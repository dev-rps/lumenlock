//! # EscrowVault — Main Contract
//!
//! The EscrowVault contract is the financial core of LumenLock. It:
//! - Opens escrow records linked to marketplace listings
//! - Holds buyer funds in custody
//! - Enforces the bilateral confirmation state machine
//! - Releases funds to sellers on mutual confirmation
//! - Handles milestone-based partial releases
//! - Allows buyer refunds after deadline
//! - Manages dispute arbitration
//! - Calls back into MarketplaceRegistry to update listing status
//!
//! ## Security Model
//!
//! All state mutations follow Checks-Effects-Interactions order.
//! Token transfers only occur AFTER all state mutations are complete.
//! See SECURITY.md for the full threat model and mitigation analysis.
//!
//! ## Inter-Contract Calls
//!
//! This contract calls into MarketplaceRegistry for:
//! 1. `get_listing()` — to fetch price/asset/milestone config at escrow open
//! 2. `update_listing_status()` — to reflect escrow state in the listing record
//!
//! MarketplaceRegistry enforces that only THIS contract's address can call
//! `update_listing_status()`, creating a strict cross-contract trust boundary.

#![no_std]

mod errors;
mod events;
mod milestone;
mod storage;

use errors::VaultError;
mod registry_contract {
    soroban_sdk::contractimport!(
        file = "../target/wasm32v1-none/release/lumenlock_marketplace_registry.wasm"
    );
}
use registry_contract::Client as RegistryClient;
use lumenlock_shared_types::{EscrowRecord, EscrowState, ListingStatus};

fn map_status_to_registry(status: ListingStatus) -> registry_contract::ListingStatus {
    match status {
        ListingStatus::Active => registry_contract::ListingStatus::Active,
        ListingStatus::Locked => registry_contract::ListingStatus::Locked,
        ListingStatus::Completed => registry_contract::ListingStatus::Completed,
        ListingStatus::Refunded => registry_contract::ListingStatus::Refunded,
        ListingStatus::Disputed => registry_contract::ListingStatus::Disputed,
    }
}
use soroban_sdk::{
    contract, contractimpl, panic_with_error, token, Address, BytesN, Env, Vec,
};
use storage::{VaultKey, DEFAULT_DEADLINE_SECS, LEDGER_BUMP_HIGH, LEDGER_BUMP_LOW};

// ─── Internal Helpers ────────────────────────────────────────────────────────

fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get::<VaultKey, Address>(&VaultKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, VaultError::NotInitialized))
}

fn get_arbiter(env: &Env) -> Address {
    env.storage()
        .instance()
        .get::<VaultKey, Address>(&VaultKey::Arbiter)
        .unwrap_or_else(|| panic_with_error!(env, VaultError::NotInitialized))
}

fn get_registry_address(env: &Env) -> Address {
    env.storage()
        .instance()
        .get::<VaultKey, Address>(&VaultKey::RegistryAddress)
        .unwrap_or_else(|| panic_with_error!(env, VaultError::NotInitialized))
}

fn next_escrow_id(env: &Env) -> u64 {
    let current: u64 = env
        .storage()
        .instance()
        .get::<VaultKey, u64>(&VaultKey::EscrowCounter)
        .unwrap_or(0);
    let next = current + 1;
    env.storage()
        .instance()
        .set(&VaultKey::EscrowCounter, &next);
    next
}

fn get_escrow(env: &Env, escrow_id: u64) -> EscrowRecord {
    let key = VaultKey::Escrow(escrow_id);
    env.storage()
        .persistent()
        .extend_ttl(&key, LEDGER_BUMP_LOW, LEDGER_BUMP_HIGH);
    env.storage()
        .persistent()
        .get::<VaultKey, EscrowRecord>(&key)
        .unwrap_or_else(|| panic_with_error!(env, VaultError::EscrowNotFound))
}

fn save_escrow(env: &Env, escrow: &EscrowRecord) {
    let key = VaultKey::Escrow(escrow.escrow_id);
    env.storage().persistent().set(&key, escrow);
    env.storage()
        .persistent()
        .extend_ttl(&key, LEDGER_BUMP_LOW, LEDGER_BUMP_HIGH);
}

/// Call MarketplaceRegistry.update_listing_status via cross-contract call.
///
/// This is the inter-contract communication from EscrowVault → MarketplaceRegistry.
/// The registry enforces that only this contract's address can call this function.
fn update_registry_listing_status(env: &Env, listing_id: u64, status: ListingStatus) {
    let registry_addr = get_registry_address(env);
    let registry = RegistryClient::new(env, &registry_addr);
    let mapped = map_status_to_registry(status);
    registry.update_listing_status(&listing_id, &mapped);
}

/// Execute token transfer from `from` to `to`.
///
/// This is always called AFTER all state mutations (CEI pattern).
fn transfer_token(env: &Env, asset: &Address, from: &Address, to: &Address, amount: i128) {
    let token_client = token::TokenClient::new(env, asset);
    token_client.transfer(from, to, &amount);
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct EscrowVault;

#[contractimpl]
impl EscrowVault {
    /// Initialize the EscrowVault contract.
    ///
    /// **Purpose**: Sets the admin, arbiter, and registry contract addresses.
    /// Must be called exactly once after deployment.
    ///
    /// **Auth requirements**: None (one-time initialization).
    ///
    /// **State preconditions**: Contract must not be initialized.
    ///
    /// **State postconditions**:
    /// - Admin, Arbiter, RegistryAddress set in Instance storage
    /// - Initialized flag set
    ///
    /// **Panics**:
    /// - `AlreadyInitialized` if called a second time
    pub fn initialize(env: Env, admin: Address, arbiter: Address, registry_addr: Address) {
        if env.storage().instance().has(&VaultKey::Initialized) {
            panic_with_error!(&env, VaultError::AlreadyInitialized);
        }

        env.storage().instance().set(&VaultKey::Admin, &admin);
        env.storage().instance().set(&VaultKey::Arbiter, &arbiter);
        env.storage()
            .instance()
            .set(&VaultKey::RegistryAddress, &registry_addr);
        env.storage()
            .instance()
            .set(&VaultKey::DefaultDeadlineSecs, &DEFAULT_DEADLINE_SECS);
        env.storage()
            .instance()
            .set(&VaultKey::Initialized, &true);
        env.storage()
            .instance()
            .extend_ttl(LEDGER_BUMP_LOW, LEDGER_BUMP_HIGH);
    }

    /// Open an escrow for a marketplace listing.
    ///
    /// **Purpose**: Creates an escrow record linked to a listing. Pulls the listing's
    /// price, asset, and milestone config from MarketplaceRegistry via cross-contract
    /// call. Marks the listing as `Locked` so no other buyer can open a competing escrow.
    ///
    /// **Auth requirements**: `buyer` must sign this transaction.
    ///
    /// **Inter-contract calls**:
    /// 1. `MarketplaceRegistry.get_listing(listing_id)` — fetch listing data
    /// 2. `MarketplaceRegistry.update_listing_status(listing_id, Locked)` — lock listing
    ///
    /// **State preconditions**:
    /// - Contract must be initialized
    /// - Listing must exist and be in `Active` status
    ///
    /// **State postconditions**:
    /// - New `EscrowRecord` stored with state `Created`
    /// - Listing status updated to `Locked` in MarketplaceRegistry
    /// - `EscrowCounter` incremented
    ///
    /// **Returns**: The new `escrow_id`.
    ///
    /// **Panics**:
    /// - `NotInitialized` if contract not initialized
    /// - `ListingNotActive` if the listing is not in Active status
    /// - Any panic from cross-contract call to registry
    pub fn open_escrow(env: Env, listing_id: u64, buyer: Address) -> u64 {
        // CHECKS
        if !env.storage().instance().has(&VaultKey::Initialized) {
            panic_with_error!(&env, VaultError::NotInitialized);
        }
        buyer.require_auth();

        // Cross-contract call 1: Fetch listing data
        let registry_addr = get_registry_address(&env);
        let registry = RegistryClient::new(&env, &registry_addr);
        let listing = registry.get_listing(&listing_id);

        // Validate listing is active
        if listing.status != registry_contract::ListingStatus::Active {
            panic_with_error!(&env, VaultError::ListingNotActive);
        }

        // Assign escrow ID
        let escrow_id = next_escrow_id(&env);
        let now = env.ledger().timestamp();
        let deadline = now + DEFAULT_DEADLINE_SECS;

        // Copy milestone percentages if present
        let milestone_percentages: Option<Vec<u32>> = match listing.milestone_config {
            registry_contract::MilestoneConfigOption::Some(mc) => Some(mc.percentages),
            registry_contract::MilestoneConfigOption::None => None,
        };

        let escrow = EscrowRecord {
            escrow_id,
            listing_id,
            buyer: buyer.clone(),
            seller: listing.seller.clone(),
            asset: listing.asset.clone(),
            amount: listing.price,
            state: EscrowState::Created,
            buyer_confirmed: false,
            seller_confirmed: false,
            deadline,
            created_at: now,
            milestone_percentages,
            current_milestone_index: 0,
            released_amount: 0,
        };

        // EFFECTS: Save escrow before cross-contract call
        save_escrow(&env, &escrow);
        env.storage()
            .instance()
            .extend_ttl(LEDGER_BUMP_LOW, LEDGER_BUMP_HIGH);

        // Cross-contract call 2: Lock the listing in registry
        // This is called AFTER our state is saved (effects before interactions)
        update_registry_listing_status(&env, listing_id, ListingStatus::Locked);

        // Emit event
        events::emit_escrow_opened(
            &env,
            escrow_id,
            listing_id,
            &buyer,
            &listing.seller,
            listing.price,
            &listing.asset,
        );

        escrow_id
    }

    /// Fund the escrow by depositing the listing price.
    ///
    /// **Purpose**: The buyer deposits the full listing price into the vault contract.
    /// This moves the escrow from `Created` to `Funded` state. After funding,
    /// the funds are held by this contract until bilateral confirmation or refund.
    ///
    /// **Auth requirements**: `buyer` must sign (verified against stored buyer address).
    ///
    /// **State preconditions**:
    /// - Escrow must exist and be in `Created` state
    /// - Caller must be the buyer for this escrow
    ///
    /// **State postconditions**:
    /// - Escrow state transitions to `Funded`
    /// - Token amount transferred from buyer to this contract
    ///
    /// **Security (CEI)**:
    /// State is set to `Funded` in storage BEFORE the token transfer occurs.
    /// If the token transfer fails, the entire transaction is reverted by the host.
    ///
    /// **Panics**:
    /// - `EscrowNotFound` if escrow doesn't exist
    /// - `InvalidState` if escrow is not in Created state
    /// - `NotBuyer` via require_auth if caller is not the buyer
    /// - Token transfer failure if buyer has insufficient balance
    pub fn fund(env: Env, escrow_id: u64) {
        // CHECKS
        let mut escrow = get_escrow(&env, escrow_id);

        if escrow.state != EscrowState::Created {
            panic_with_error!(&env, VaultError::InvalidState);
        }

        escrow.buyer.require_auth();

        let buyer = escrow.buyer.clone();
        let asset = escrow.asset.clone();
        let amount = escrow.amount;

        // EFFECTS: Update state before token transfer
        escrow.state = EscrowState::Funded;
        save_escrow(&env, &escrow);

        // INTERACTIONS: Transfer tokens from buyer to vault
        transfer_token(
            &env,
            &asset,
            &buyer,
            &env.current_contract_address(),
            amount,
        );

        events::emit_escrow_funded(&env, escrow_id, amount);
    }

    /// Buyer confirms delivery of goods/service.
    ///
    /// **Purpose**: The buyer signals that they are satisfied with the delivery.
    /// If the seller has also confirmed, this triggers automatic fund release.
    /// For milestone escrows, releases the current milestone percentage and advances
    /// to the next milestone stage.
    ///
    /// **Auth requirements**: Caller must be the buyer for this escrow.
    ///
    /// **State preconditions**:
    /// - Escrow must be in `Funded` or `PartiallyReleased` state
    /// - Buyer must not have already confirmed the current milestone
    /// - Deadline must not have passed (if deadline passed, buyer should claim refund)
    ///
    /// **State postconditions**:
    /// - `buyer_confirmed` set to true
    /// - If seller has also confirmed: triggers release logic
    ///   - Standard: state → Released, full amount transferred to seller
    ///   - Milestone: current milestone amount transferred; state → PartiallyReleased or Released
    ///
    /// **Panics**:
    /// - `EscrowNotFound` if escrow doesn't exist
    /// - `InvalidState` if not in Funded/PartiallyReleased state
    /// - `AlreadyConfirmedBuyer` if buyer already confirmed
    /// - `DeadlinePassed` if deadline has passed
    pub fn confirm_buyer(env: Env, escrow_id: u64) {
        // CHECKS
        let mut escrow = get_escrow(&env, escrow_id);

        if escrow.state != EscrowState::Funded && escrow.state != EscrowState::PartiallyReleased {
            panic_with_error!(&env, VaultError::InvalidState);
        }

        escrow.buyer.require_auth();

        if escrow.buyer_confirmed {
            panic_with_error!(&env, VaultError::AlreadyConfirmedBuyer);
        }

        let now = env.ledger().timestamp();
        if now > escrow.deadline {
            panic_with_error!(&env, VaultError::DeadlinePassed);
        }

        let milestone_index = escrow.current_milestone_index;

        // EFFECTS: Mark buyer confirmed
        escrow.buyer_confirmed = true;

        // Check if both have confirmed → trigger release
        if escrow.seller_confirmed {
            execute_release(&env, &mut escrow);
        } else {
            save_escrow(&env, &escrow);
        }

        events::emit_buyer_confirmed(&env, escrow_id, milestone_index);
    }

    /// Seller confirms delivery of goods/service.
    ///
    /// **Purpose**: The seller signals that they have delivered the product/service.
    /// If the buyer has also confirmed, triggers automatic fund release.
    ///
    /// **Auth requirements**: Caller must be the seller for this escrow.
    ///
    /// **State preconditions**:
    /// - Escrow must be in `Funded` or `PartiallyReleased` state
    /// - Seller must not have already confirmed the current milestone
    ///
    /// **State postconditions**:
    /// - `seller_confirmed` set to true
    /// - If buyer has also confirmed: triggers release logic
    ///
    /// **Panics**:
    /// - `EscrowNotFound` if escrow doesn't exist
    /// - `InvalidState` if not in Funded/PartiallyReleased state
    /// - `AlreadyConfirmedSeller` if seller already confirmed
    pub fn confirm_seller(env: Env, escrow_id: u64) {
        // CHECKS
        let mut escrow = get_escrow(&env, escrow_id);

        if escrow.state != EscrowState::Funded && escrow.state != EscrowState::PartiallyReleased {
            panic_with_error!(&env, VaultError::InvalidState);
        }

        escrow.seller.require_auth();

        if escrow.seller_confirmed {
            panic_with_error!(&env, VaultError::AlreadyConfirmedSeller);
        }

        let milestone_index = escrow.current_milestone_index;

        // EFFECTS: Mark seller confirmed
        escrow.seller_confirmed = true;

        // Check if both have confirmed → trigger release
        if escrow.buyer_confirmed {
            execute_release(&env, &mut escrow);
        } else {
            save_escrow(&env, &escrow);
        }

        events::emit_seller_confirmed(&env, escrow_id, milestone_index);
    }

    /// Claim a refund after the deadline has passed.
    ///
    /// **Purpose**: If the deadline passes without both parties confirming,
    /// the buyer can call this to recover their funds. This is the safety valve
    /// that prevents funds from being locked forever if the seller goes silent.
    ///
    /// **Auth requirements**: Caller must be the buyer for this escrow.
    ///
    /// **State preconditions**:
    /// - Escrow must be in `Funded` state (not PartiallyReleased — milestones
    ///   need separate handling; partially released escrows still require arbiter)
    /// - Current ledger timestamp must be AFTER the deadline
    /// - Escrow must not already be Refunded
    ///
    /// **State postconditions**:
    /// - Escrow state → `Refunded` (BEFORE token transfer — CEI)
    /// - Full locked amount transferred back to buyer
    /// - Listing status updated to `Refunded` in MarketplaceRegistry
    ///
    /// **Security (CEI)**:
    /// State is set to `Refunded` BEFORE the token transfer. A second call
    /// would find state == Refunded and fail the InvalidState check. This
    /// prevents any double-refund attack.
    ///
    /// **Panics**:
    /// - `EscrowNotFound` if escrow doesn't exist
    /// - `InvalidState` if escrow is not in Funded state
    /// - `NotBuyer` via require_auth if caller is not buyer
    /// - `DeadlineNotPassed` if deadline has not yet elapsed
    pub fn claim_refund(env: Env, escrow_id: u64) {
        // CHECKS
        let mut escrow = get_escrow(&env, escrow_id);

        if escrow.state != EscrowState::Funded {
            panic_with_error!(&env, VaultError::InvalidState);
        }

        escrow.buyer.require_auth();

        let now = env.ledger().timestamp();
        if now <= escrow.deadline {
            panic_with_error!(&env, VaultError::DeadlineNotPassed);
        }

        let buyer = escrow.buyer.clone();
        let asset = escrow.asset.clone();
        let amount = escrow.amount;
        let listing_id = escrow.listing_id;

        // EFFECTS: Set state to Refunded BEFORE any external call
        escrow.state = EscrowState::Refunded;
        save_escrow(&env, &escrow);

        // Cross-contract call: Update listing status
        update_registry_listing_status(&env, listing_id, ListingStatus::Refunded);

        // INTERACTIONS: Transfer funds back to buyer (last step)
        transfer_token(&env, &asset, &env.current_contract_address(), &buyer, amount);

        events::emit_refund_claimed(&env, escrow_id, &buyer, amount);
    }

    /// Raise a dispute to freeze funds pending arbiter resolution.
    ///
    /// **Purpose**: If either party believes the other is acting in bad faith,
    /// they can raise a dispute. This freezes all funds and prevents the buyer
    /// from claiming a refund. The arbiter must then resolve the dispute.
    ///
    /// **Auth requirements**: Caller must be either the buyer or the seller.
    ///
    /// **State preconditions**:
    /// - Escrow must be in `Funded` or `PartiallyReleased` state
    ///
    /// **State postconditions**:
    /// - Escrow state → `Disputed`
    /// - Listing status updated to `Disputed` in MarketplaceRegistry
    ///
    /// **Panics**:
    /// - `EscrowNotFound` if escrow doesn't exist
    /// - `InvalidState` if escrow is not in Funded/PartiallyReleased state
    /// - `NotParty` if caller is neither buyer nor seller
    pub fn raise_dispute(env: Env, escrow_id: u64, raiser: Address) {
        // CHECKS
        let mut escrow = get_escrow(&env, escrow_id);

        if escrow.state != EscrowState::Funded && escrow.state != EscrowState::PartiallyReleased {
            panic_with_error!(&env, VaultError::InvalidState);
        }

        raiser.require_auth();
        if raiser != escrow.buyer && raiser != escrow.seller {
            panic_with_error!(&env, VaultError::NotParty);
        }

        // EFFECTS: Update state
        escrow.state = EscrowState::Disputed;
        let listing_id = escrow.listing_id;
        save_escrow(&env, &escrow);

        // Cross-contract call: Update listing status
        update_registry_listing_status(&env, listing_id, ListingStatus::Disputed);

        events::emit_dispute_raised(&env, escrow_id, &raiser);
    }

    /// Resolve a disputed escrow, distributing funds to the winning party.
    ///
    /// **Purpose**: The designated arbiter resolves a dispute by awarding funds
    /// to either the buyer (full refund) or seller (full payment). Partial awards
    /// are not supported in v1 (documented as a known limitation in SECURITY.md).
    ///
    /// **Auth requirements**: Only the arbiter address stored in Instance storage
    /// may call this function. This is a known centralization point — see SECURITY.md.
    ///
    /// **State preconditions**:
    /// - Escrow must be in `Disputed` state
    /// - `winner` must be either the buyer or seller of this escrow
    ///
    /// **State postconditions**:
    /// - Escrow state → `Resolved`
    /// - Full amount (including any partially released amount if applicable)
    ///   transferred to `winner`
    /// - Listing status updated to `Completed` or `Refunded` in MarketplaceRegistry
    ///
    /// **Panics**:
    /// - `EscrowNotFound` if escrow doesn't exist
    /// - `InvalidState` if escrow is not in Disputed state
    /// - `NotArbiter` via require_auth if caller is not the arbiter
    /// - `InvalidWinner` if winner is not buyer or seller
    pub fn resolve_dispute(env: Env, escrow_id: u64, winner: Address) {
        // CHECKS
        let mut escrow = get_escrow(&env, escrow_id);

        if escrow.state != EscrowState::Disputed {
            panic_with_error!(&env, VaultError::InvalidState);
        }

        // Only arbiter can call
        let arbiter = get_arbiter(&env);
        arbiter.require_auth();

        // Winner must be a party to this escrow
        if winner != escrow.buyer && winner != escrow.seller {
            panic_with_error!(&env, VaultError::InvalidWinner);
        }

        let asset = escrow.asset.clone();
        let listing_id = escrow.listing_id;
        
        // Amount remaining in vault (total minus already-released milestone amounts)
        let remaining = escrow
            .amount
            .checked_sub(escrow.released_amount)
            .unwrap_or_else(|| panic_with_error!(&env, VaultError::ArithmeticOverflow));

        let winner_clone = winner.clone();
        let is_seller_winner = winner == escrow.seller;

        // EFFECTS: Update state
        escrow.state = EscrowState::Resolved;
        save_escrow(&env, &escrow);

        // Update listing status
        let new_listing_status = if is_seller_winner {
            ListingStatus::Completed
        } else {
            ListingStatus::Refunded
        };
        update_registry_listing_status(&env, listing_id, new_listing_status);

        // INTERACTIONS: Transfer remaining funds to winner
        if remaining > 0 {
            transfer_token(
                &env,
                &asset,
                &env.current_contract_address(),
                &winner_clone,
                remaining,
            );
        }

        events::emit_dispute_resolved(&env, escrow_id, &winner_clone, remaining);
    }

    /// Get an escrow record by ID.
    ///
    /// **Purpose**: Read-only accessor for escrow state. Used by the frontend
    /// to display escrow status, amounts, and confirmation flags.
    ///
    /// **Auth requirements**: None.
    ///
    /// **Panics**:
    /// - `EscrowNotFound` if the escrow does not exist
    pub fn get_escrow(env: Env, escrow_id: u64) -> EscrowRecord {
        get_escrow(&env, escrow_id)
    }

    /// Upgrade the contract WASM bytecode.
    ///
    /// **Purpose**: Admin-only upgrade function. See ARCHITECTURE.md for the
    /// full upgrade procedure and storage migration guidelines.
    ///
    /// **Auth requirements**: Admin must sign.
    ///
    /// **Panics**: If admin auth fails or WASM hash is invalid.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin = get_admin(&env);
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    /// Get the arbiter address.
    ///
    /// **Purpose**: Read-only accessor for transparency. Useful for users
    /// who want to verify who the arbiter is before opening an escrow.
    ///
    /// **Auth requirements**: None.
    pub fn get_arbiter(env: Env) -> Address {
        get_arbiter(&env)
    }
}

// ─── Release Logic (internal) ────────────────────────────────────────────────

/// Execute fund release when both parties have confirmed.
///
/// This handles both standard (full release) and milestone (partial release) escrows.
/// Called internally by `confirm_buyer` and `confirm_seller` after both flags are set.
///
/// EFFECTS precede INTERACTIONS — all state mutations happen before token transfers.
fn execute_release(env: &Env, escrow: &mut EscrowRecord) {
    let has_milestones = escrow.milestone_percentages.is_some();

    if has_milestones {
        execute_milestone_release(env, escrow);
    } else {
        execute_full_release(env, escrow);
    }
}

/// Release the full amount to the seller (non-milestone escrow).
fn execute_full_release(env: &Env, escrow: &mut EscrowRecord) {
    let seller = escrow.seller.clone();
    let asset = escrow.asset.clone();
    let amount = escrow.amount;
    let listing_id = escrow.listing_id;
    let escrow_id = escrow.escrow_id;
    let milestone_index = escrow.current_milestone_index;

    // EFFECTS: Update state before transfer
    escrow.state = EscrowState::Released;
    escrow.released_amount = amount;
    save_escrow(env, escrow);

    // Cross-contract call: Mark listing completed
    update_registry_listing_status(env, listing_id, ListingStatus::Completed);

    // INTERACTIONS: Transfer to seller
    transfer_token(env, &asset, &env.current_contract_address(), &seller, amount);

    events::emit_funds_released(env, escrow_id, &seller, amount, milestone_index, true);
}

/// Release the current milestone amount and advance to the next milestone.
fn execute_milestone_release(env: &Env, escrow: &mut EscrowRecord) {
    let percentages = escrow.milestone_percentages.clone().unwrap();
    let index = escrow.current_milestone_index;
    let total = escrow.amount;
    let already_released = escrow.released_amount;

    // Calculate this milestone's release amount
    let release_amount =
        milestone::milestone_amount(env, total, &percentages, index, already_released);

    let seller = escrow.seller.clone();
    let asset = escrow.asset.clone();
    let escrow_id = escrow.escrow_id;
    let listing_id = escrow.listing_id;

    let is_final = index == percentages.len() - 1;

    // EFFECTS: Update state
    escrow.released_amount = already_released
        .checked_add(release_amount)
        .unwrap_or_else(|| panic_with_error!(env, VaultError::ArithmeticOverflow));

    if is_final {
        escrow.state = EscrowState::Released;
        // Update listing status to Completed on final release
        save_escrow(env, escrow);
        update_registry_listing_status(env, listing_id, ListingStatus::Completed);
    } else {
        // Advance to next milestone; reset confirmation flags
        escrow.current_milestone_index += 1;
        escrow.buyer_confirmed = false;
        escrow.seller_confirmed = false;
        escrow.state = EscrowState::PartiallyReleased;
        save_escrow(env, escrow);
    }

    // INTERACTIONS: Transfer milestone amount to seller
    transfer_token(
        env,
        &asset,
        &env.current_contract_address(),
        &seller,
        release_amount,
    );

    events::emit_funds_released(env, escrow_id, &seller, release_amount, index, is_final);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use lumenlock_marketplace_registry::MarketplaceRegistry;
    use lumenlock_shared_types::{MilestoneConfig, ListingStatus as SharedListingStatus};
    use soroban_sdk::{
        testutils::{Address as _, Ledger, MockAuth, MockAuthInvoke},
        token::{Client as TokenClient, StellarAssetClient},
        Address, Env, String, Vec,
    };

    struct TestSetup {
        env: Env,
        registry_id: Address,
        vault_id: Address,
        admin: Address,
        arbiter: Address,
        seller: Address,
        buyer: Address,
        token_id: Address,
        registry: RegistryClient<'static>,
        vault: EscrowVaultClient<'static>,
    }

    fn setup() -> TestSetup {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let arbiter = Address::generate(&env);
        let seller = Address::generate(&env);
        let buyer = Address::generate(&env);

        // Deploy registry
        let registry_id = env.register_contract(None, MarketplaceRegistry);
        let registry = RegistryClient::new(&env, &registry_id);

        // Deploy vault
        let vault_id = env.register_contract(None, EscrowVault);
        let vault = EscrowVaultClient::new(&env, &vault_id);

        // Initialize registry with vault address
        registry.initialize(&admin, &Some(vault_id.clone()));

        // Initialize vault with registry address
        vault.initialize(&admin, &arbiter, &registry_id);

        // Create a test token (stellar asset)
        let token_admin = Address::generate(&env);
        let token_id = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
        
        // Mint tokens to buyer
        let token_sac = StellarAssetClient::new(&env, &token_id);
        token_sac.mint(&buyer, &10_000_000i128);

        // unsafe transmute lifetimes for test convenience
        let registry: RegistryClient<'static> =
            unsafe { core::mem::transmute(registry) };
        let vault: EscrowVaultClient<'static> = unsafe { core::mem::transmute(vault) };

        TestSetup {
            env,
            registry_id,
            vault_id,
            admin,
            arbiter,
            seller,
            buyer,
            token_id,
            registry,
            vault,
        }
    }

    fn create_standard_listing(s: &TestSetup) -> u64 {
        s.registry.create_listing(
            &s.seller,
            &String::from_str(&s.env, "Test Service"),
            &String::from_str(&s.env, "A test service"),
            &1_000_000i128,
            &s.token_id,
            &None,
        )
    }

    fn create_milestone_listing(s: &TestSetup) -> u64 {
        let config = registry_contract::MilestoneConfig {
            percentages: Vec::from_array(&s.env, [30u32, 70u32]),
            labels: Vec::from_array(&s.env, [
                String::from_str(&s.env, "Start"),
                String::from_str(&s.env, "Complete"),
            ]),
        };
        s.registry.create_listing(
            &s.seller,
            &String::from_str(&s.env, "Milestone Service"),
            &String::from_str(&s.env, "A milestone service"),
            &1_000_000i128,
            &s.token_id,
            &Some(config),
        )
    }

    /// Test 1: Full mutual-confirm release flow.
    ///
    /// Verifies the complete happy path:
    /// open_escrow → fund → confirm_buyer → confirm_seller → funds released to seller.
    #[test]
    fn test_full_mutual_confirm_release() {
        let s = setup();

        let listing_id = create_standard_listing(&s);
        let token = TokenClient::new(&s.env, &s.token_id);

        // Check buyer's initial balance
        assert_eq!(token.balance(&s.buyer), 10_000_000i128);

        // Open escrow
        let escrow_id = s.vault.open_escrow(&listing_id, &s.buyer);
        assert_eq!(escrow_id, 1u64);

        // Verify listing is now locked
        let listing = s.registry.get_listing(&listing_id);
        assert_eq!(listing.status, registry_contract::ListingStatus::Locked);

        // Fund escrow
        s.vault.fund(&escrow_id);
        assert_eq!(token.balance(&s.buyer), 9_000_000i128);
        assert_eq!(token.balance(&s.vault_id), 1_000_000i128);

        // Buyer confirms
        s.vault.confirm_buyer(&escrow_id);
        let escrow = s.vault.get_escrow(&escrow_id);
        assert!(escrow.buyer_confirmed);
        assert_eq!(escrow.state, EscrowState::Funded); // not released yet

        // Seller confirms → triggers release
        let seller_balance_before = token.balance(&s.seller);
        s.vault.confirm_seller(&escrow_id);

        let escrow = s.vault.get_escrow(&escrow_id);
        assert_eq!(escrow.state, EscrowState::Released);
        assert_eq!(token.balance(&s.seller), seller_balance_before + 1_000_000i128);
        assert_eq!(token.balance(&s.vault_id), 0i128);

        // Verify listing is completed
        let listing = s.registry.get_listing(&listing_id);
        assert_eq!(listing.status, registry_contract::ListingStatus::Completed);
    }

    /// Test 2: Timeout refund flow.
    ///
    /// Verifies that buyer can claim refund after deadline.
    #[test]
    fn test_timeout_refund() {
        let s = setup();
        let listing_id = create_standard_listing(&s);
        let token = TokenClient::new(&s.env, &s.token_id);

        let escrow_id = s.vault.open_escrow(&listing_id, &s.buyer);
        s.vault.fund(&escrow_id);

        let buyer_balance_after_fund = token.balance(&s.buyer);

        // Advance time past deadline (7 days + 1 second)
        s.env.ledger().with_mut(|l| {
            l.timestamp += DEFAULT_DEADLINE_SECS + 1;
        });

        // Buyer claims refund
        s.vault.claim_refund(&escrow_id);

        let escrow = s.vault.get_escrow(&escrow_id);
        assert_eq!(escrow.state, EscrowState::Refunded);
        assert_eq!(token.balance(&s.buyer), buyer_balance_after_fund + 1_000_000i128);
        assert_eq!(token.balance(&s.vault_id), 0i128);

        let listing = s.registry.get_listing(&listing_id);
        assert_eq!(listing.status, registry_contract::ListingStatus::Refunded);
    }

    /// Test 3: Dispute and arbiter resolution (seller wins).
    ///
    /// Verifies that a dispute can be raised and the arbiter can award funds to the seller.
    #[test]
    fn test_dispute_and_arbiter_resolution_seller_wins() {
        let s = setup();
        let listing_id = create_standard_listing(&s);
        let token = TokenClient::new(&s.env, &s.token_id);

        let escrow_id = s.vault.open_escrow(&listing_id, &s.buyer);
        s.vault.fund(&escrow_id);

        // Raise dispute
        s.vault.raise_dispute(&escrow_id, &s.buyer);
        let escrow = s.vault.get_escrow(&escrow_id);
        assert_eq!(escrow.state, EscrowState::Disputed);

        // Arbiter resolves in seller's favor
        let seller_balance_before = token.balance(&s.seller);
        s.vault.resolve_dispute(&escrow_id, &s.seller);

        let escrow = s.vault.get_escrow(&escrow_id);
        assert_eq!(escrow.state, EscrowState::Resolved);
        assert_eq!(token.balance(&s.seller), seller_balance_before + 1_000_000i128);

        let listing = s.registry.get_listing(&listing_id);
        assert_eq!(listing.status, registry_contract::ListingStatus::Completed);
    }

    /// Test 4: Dispute and arbiter resolution (buyer wins / full refund).
    #[test]
    fn test_dispute_and_arbiter_resolution_buyer_wins() {
        let s = setup();
        let listing_id = create_standard_listing(&s);
        let token = TokenClient::new(&s.env, &s.token_id);

        let escrow_id = s.vault.open_escrow(&listing_id, &s.buyer);
        s.vault.fund(&escrow_id);
        let buyer_balance_after_fund = token.balance(&s.buyer);

        s.vault.raise_dispute(&escrow_id, &s.buyer);
        s.vault.resolve_dispute(&escrow_id, &s.buyer);

        let escrow = s.vault.get_escrow(&escrow_id);
        assert_eq!(escrow.state, EscrowState::Resolved);
        assert_eq!(token.balance(&s.buyer), buyer_balance_after_fund + 1_000_000i128);

        let listing = s.registry.get_listing(&listing_id);
        assert_eq!(listing.status, registry_contract::ListingStatus::Refunded);
    }

    /// Test 5: Milestone partial release flow.
    ///
    /// Verifies the 30%/70% milestone release pattern:
    /// - First milestone: 300,000 released to seller
    /// - Second milestone: 700,000 released to seller
    #[test]
    fn test_milestone_partial_release() {
        let s = setup();
        let listing_id = create_milestone_listing(&s);
        let token = TokenClient::new(&s.env, &s.token_id);

        let escrow_id = s.vault.open_escrow(&listing_id, &s.buyer);
        s.vault.fund(&escrow_id);

        let seller_initial = token.balance(&s.seller);

        // First milestone: both confirm → 30% released
        s.vault.confirm_buyer(&escrow_id);
        s.vault.confirm_seller(&escrow_id);

        let escrow = s.vault.get_escrow(&escrow_id);
        assert_eq!(escrow.state, EscrowState::PartiallyReleased);
        assert_eq!(escrow.current_milestone_index, 1u32);
        assert_eq!(escrow.released_amount, 300_000i128);
        assert!(!escrow.buyer_confirmed); // reset for next milestone
        assert!(!escrow.seller_confirmed);
        assert_eq!(token.balance(&s.seller), seller_initial + 300_000i128);

        // Second milestone: both confirm → remaining 70% released
        s.vault.confirm_buyer(&escrow_id);
        s.vault.confirm_seller(&escrow_id);

        let escrow = s.vault.get_escrow(&escrow_id);
        assert_eq!(escrow.state, EscrowState::Released);
        assert_eq!(escrow.released_amount, 1_000_000i128);
        assert_eq!(token.balance(&s.seller), seller_initial + 1_000_000i128);
        assert_eq!(token.balance(&s.vault_id), 0i128);
    }

    /// Attack Test 1: Buyer attempts double refund.
    ///
    /// After claiming a refund, the escrow is in Refunded state.
    /// A second call to claim_refund should panic with InvalidState.
    #[test]
    #[should_panic(expected = "Error(Contract, #4)")]
    fn test_attack_double_refund() {
        let s = setup();
        let listing_id = create_standard_listing(&s);

        let escrow_id = s.vault.open_escrow(&listing_id, &s.buyer);
        s.vault.fund(&escrow_id);

        // Advance past deadline
        s.env.ledger().with_mut(|l| {
            l.timestamp += DEFAULT_DEADLINE_SECS + 1;
        });

        // First refund — should succeed
        s.vault.claim_refund(&escrow_id);

        // Second refund — should panic with InvalidState (state is Refunded, not Funded)
        s.vault.claim_refund(&escrow_id);
    }

    /// Attack Test 2: Non-arbiter attempts to resolve dispute.
    ///
    /// A random address attempting to call resolve_dispute should fail
    /// because only the designated arbiter can call it.
    #[test]
    #[should_panic]
    fn test_attack_unauthorized_dispute_resolution() {
        let s = setup();
        let listing_id = create_standard_listing(&s);

        let escrow_id = s.vault.open_escrow(&listing_id, &s.buyer);
        s.vault.fund(&escrow_id);
        s.vault.raise_dispute(&escrow_id, &s.buyer);

        // Create a new env without mock_all_auths — caller must provide real auth
        // An attacker (random address) tries to resolve the dispute
        let env2 = Env::default();
        let vault2 = EscrowVaultClient::new(&env2, &s.vault_id);
        
        // This should panic because the caller is not the arbiter
        // Without mock_all_auths, arbiter.require_auth() will fail for any non-arbiter caller
        vault2.resolve_dispute(&escrow_id, &s.seller);
    }

    /// Attack Test 3: Confirm after deadline.
    ///
    /// Buyer attempting to confirm after deadline should fail,
    /// preventing a seller from being able to claim funds after deadline.
    #[test]
    #[should_panic(expected = "Error(Contract, #10)")]
    fn test_attack_confirm_after_deadline() {
        let s = setup();
        let listing_id = create_standard_listing(&s);

        let escrow_id = s.vault.open_escrow(&listing_id, &s.buyer);
        s.vault.fund(&escrow_id);

        // Advance past deadline
        s.env.ledger().with_mut(|l| {
            l.timestamp += DEFAULT_DEADLINE_SECS + 1;
        });

        // Buyer tries to confirm after deadline — should fail
        s.vault.confirm_buyer(&escrow_id);
    }

    /// Attack Test 4: Refund before deadline.
    ///
    /// Buyer attempting to claim refund before deadline should fail.
    #[test]
    #[should_panic(expected = "Error(Contract, #9)")]
    fn test_attack_early_refund() {
        let s = setup();
        let listing_id = create_standard_listing(&s);

        let escrow_id = s.vault.open_escrow(&listing_id, &s.buyer);
        s.vault.fund(&escrow_id);

        // Try to claim refund immediately (before deadline) — should fail
        s.vault.claim_refund(&escrow_id);
    }

    /// Attack Test 5: Dispute resolution with invalid winner.
    ///
    /// Arbiter attempting to award funds to a third party (not buyer or seller)
    /// should be rejected.
    #[test]
    #[should_panic(expected = "Error(Contract, #18)")]
    fn test_attack_invalid_dispute_winner() {
        let s = setup();
        let listing_id = create_standard_listing(&s);
        let random_attacker = Address::generate(&s.env);

        let escrow_id = s.vault.open_escrow(&listing_id, &s.buyer);
        s.vault.fund(&escrow_id);
        s.vault.raise_dispute(&escrow_id, &s.buyer);

        // Arbiter tries to award to an unrelated address — should fail
        s.vault.resolve_dispute(&escrow_id, &random_attacker);
    }
}
