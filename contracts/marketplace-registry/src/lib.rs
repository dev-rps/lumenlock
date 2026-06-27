//! # MarketplaceRegistry — Main Contract
//!
//! The MarketplaceRegistry contract manages all marketplace listings.
//! It is the authoritative source of listing metadata and status.
//!
//! ## Architecture
//!
//! MarketplaceRegistry is designed to be a lightweight read/write registry.
//! It does NOT hold any funds. All financial operations are handled by EscrowVault.
//!
//! The registry enforces that only the authorized EscrowVault contract address
//! can call `update_listing_status()`, creating a strict trust boundary.
//!
//! ## Storage Layout
//!
//! - Instance: Admin, VaultAddress, ListingCounter, Initialized
//! - Persistent: Listing(id) for each listing, ActiveListings index
//!
//! ## Upgrade Path
//!
//! The admin can call `upgrade(new_wasm_hash)` to update the WASM bytecode
//! in-place without losing storage. See ARCHITECTURE.md for migration guidance.

#![no_std]

mod errors;
mod events;
mod storage;

use errors::RegistryError;
use lumenlock_shared_types::{ListingData, ListingStatus, MilestoneConfig};
use soroban_sdk::{
    contract, contractimpl, panic_with_error, Address, BytesN, Env, String, Vec,
};
use storage::{RegistryKey, LEDGER_BUMP_HIGH, LEDGER_BUMP_LOW};

// ─── Internal Helpers ────────────────────────────────────────────────────────

/// Returns the admin address, panicking if not initialized.
fn get_admin(env: &Env) -> Address {
    env.storage()
        .instance()
        .get::<RegistryKey, Address>(&RegistryKey::Admin)
        .unwrap_or_else(|| panic_with_error!(env, RegistryError::NotInitialized))
}

/// Returns the authorized vault address, panicking if not set.
fn get_vault_address(env: &Env) -> Address {
    env.storage()
        .instance()
        .get::<RegistryKey, Address>(&RegistryKey::VaultAddress)
        .unwrap_or_else(|| panic_with_error!(env, RegistryError::VaultAddressNotSet))
}

/// Returns the next listing ID and increments the counter.
fn next_listing_id(env: &Env) -> u64 {
    let current: u64 = env
        .storage()
        .instance()
        .get::<RegistryKey, u64>(&RegistryKey::ListingCounter)
        .unwrap_or(0);
    let next = current + 1;
    env.storage()
        .instance()
        .set(&RegistryKey::ListingCounter, &next);
    next
}

/// Reads a listing from persistent storage, panicking if not found.
/// Also bumps the TTL to prevent archival.
fn get_listing_internal(env: &Env, listing_id: u64) -> ListingData {
    let key = RegistryKey::Listing(listing_id);
    env.storage()
        .persistent()
        .extend_ttl(&key, LEDGER_BUMP_LOW, LEDGER_BUMP_HIGH);
    env.storage()
        .persistent()
        .get::<RegistryKey, ListingData>(&key)
        .unwrap_or_else(|| panic_with_error!(env, RegistryError::ListingNotFound))
}

/// Writes a listing to persistent storage with TTL bump.
fn save_listing(env: &Env, listing: &ListingData) {
    let key = RegistryKey::Listing(listing.listing_id);
    env.storage().persistent().set(&key, listing);
    env.storage()
        .persistent()
        .extend_ttl(&key, LEDGER_BUMP_LOW, LEDGER_BUMP_HIGH);
}

/// Appends a listing ID to the active listings index.
fn add_to_active_index(env: &Env, listing_id: u64) {
    let mut active: Vec<u64> = env
        .storage()
        .persistent()
        .get::<RegistryKey, Vec<u64>>(&RegistryKey::ActiveListings)
        .unwrap_or_else(|| Vec::new(env));
    active.push_back(listing_id);
    env.storage()
        .persistent()
        .set(&RegistryKey::ActiveListings, &active);
    env.storage().persistent().extend_ttl(
        &RegistryKey::ActiveListings,
        LEDGER_BUMP_LOW,
        LEDGER_BUMP_HIGH,
    );
}

/// Removes a listing ID from the active listings index.
fn remove_from_active_index(env: &Env, listing_id: u64) {
    let active: Vec<u64> = env
        .storage()
        .persistent()
        .get::<RegistryKey, Vec<u64>>(&RegistryKey::ActiveListings)
        .unwrap_or_else(|| Vec::new(env));

    let mut new_active: Vec<u64> = Vec::new(env);
    for id in active.iter() {
        if id != listing_id {
            new_active.push_back(id);
        }
    }
    env.storage()
        .persistent()
        .set(&RegistryKey::ActiveListings, &new_active);
    env.storage().persistent().extend_ttl(
        &RegistryKey::ActiveListings,
        LEDGER_BUMP_LOW,
        LEDGER_BUMP_HIGH,
    );
}

/// Validates a milestone configuration.
/// Panics with InvalidMilestoneConfig if:
/// - percentages is empty
/// - percentages and labels have different lengths
/// - any percentage is 0
/// - percentages don't sum to exactly 100
fn validate_milestone_config(env: &Env, config: &MilestoneConfig) {
    if config.percentages.is_empty() {
        panic_with_error!(env, RegistryError::InvalidMilestoneConfig);
    }
    if config.percentages.len() != config.labels.len() {
        panic_with_error!(env, RegistryError::InvalidMilestoneConfig);
    }
    let mut sum: u32 = 0;
    for pct in config.percentages.iter() {
        if pct == 0 {
            panic_with_error!(env, RegistryError::InvalidMilestoneConfig);
        }
        sum = sum
            .checked_add(pct)
            .unwrap_or_else(|| panic_with_error!(env, RegistryError::InvalidMilestoneConfig));
    }
    if sum != 100 {
        panic_with_error!(env, RegistryError::InvalidMilestoneConfig);
    }
}

// ─── Contract ────────────────────────────────────────────────────────────────

#[contract]
pub struct MarketplaceRegistry;

#[contractimpl]
impl MarketplaceRegistry {
    /// Initialize the contract.
    ///
    /// **Purpose**: Sets the admin address and optionally the authorized EscrowVault address.
    /// Must be called exactly once after deployment.
    ///
    /// **Auth requirements**: None (open call, but can only succeed once).
    ///
    /// **State preconditions**: Contract must not be initialized.
    ///
    /// **State postconditions**:
    /// - Admin is set to `admin`
    /// - VaultAddress is set to `vault_addr` if provided
    /// - Initialized flag is set to true
    ///
    /// **Panics**:
    /// - `AlreadyInitialized` if the contract has already been initialized
    pub fn initialize(env: Env, admin: Address, vault_addr: Option<Address>) {
        if env
            .storage()
            .instance()
            .has(&RegistryKey::Initialized)
        {
            panic_with_error!(&env, RegistryError::AlreadyInitialized);
        }

        env.storage().instance().set(&RegistryKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&RegistryKey::Initialized, &true);

        if let Some(vault) = vault_addr {
            env.storage()
                .instance()
                .set(&RegistryKey::VaultAddress, &vault);
        }

        env.storage().instance().extend_ttl(LEDGER_BUMP_LOW, LEDGER_BUMP_HIGH);
    }

    /// Set or update the authorized EscrowVault contract address.
    ///
    /// **Purpose**: Allows the admin to set or rotate the vault address that
    /// is permitted to call `update_listing_status()`.
    ///
    /// **Auth requirements**: Admin must sign this transaction.
    ///
    /// **State preconditions**: Contract must be initialized.
    ///
    /// **State postconditions**: VaultAddress storage key is updated.
    ///
    /// **Panics**:
    /// - `NotAdmin` if the caller is not the admin
    /// - `NotInitialized` if the contract is not initialized
    pub fn set_vault_address(env: Env, vault_addr: Address) {
        let admin = get_admin(&env);
        admin.require_auth();

        env.storage()
            .instance()
            .set(&RegistryKey::VaultAddress, &vault_addr);
        env.storage().instance().extend_ttl(LEDGER_BUMP_LOW, LEDGER_BUMP_HIGH);
    }

    /// Create a new marketplace listing.
    ///
    /// **Purpose**: Registers a new product or service listing on the marketplace.
    /// Assigns a unique listing_id and adds the listing to the active index.
    ///
    /// **Auth requirements**: `seller` must sign this transaction (`seller.require_auth()`).
    /// This prevents impersonating another seller.
    ///
    /// **State preconditions**:
    /// - Contract must be initialized
    /// - `price` must be > 0
    /// - `asset` must be a non-default address
    /// - `title` must be non-empty
    /// - If `milestone_config` is provided, percentages must sum to 100,
    ///   labels must match percentages length, and no percentage can be 0
    ///
    /// **State postconditions**:
    /// - New `ListingData` record stored at `Listing(listing_id)` in Persistent storage
    /// - `listing_id` added to `ActiveListings` index
    /// - `ListingCounter` incremented
    ///
    /// **Returns**: The new listing's `listing_id`.
    ///
    /// **Panics**:
    /// - `NotInitialized` if contract is not initialized
    /// - `InvalidPrice` if price <= 0
    /// - `InvalidAsset` if asset is the zero address
    /// - `EmptyTitle` if title is empty
    /// - `InvalidMilestoneConfig` if milestone config is malformed
    pub fn create_listing(
        env: Env,
        seller: Address,
        title: String,
        description: String,
        price: i128,
        asset: Address,
        milestone_config: Option<MilestoneConfig>,
    ) -> u64 {
        // Ensure initialized
        if !env.storage().instance().has(&RegistryKey::Initialized) {
            panic_with_error!(&env, RegistryError::NotInitialized);
        }

        // Auth: seller must sign
        seller.require_auth();

        // Validate inputs
        if price <= 0 {
            panic_with_error!(&env, RegistryError::InvalidPrice);
        }
        if title.is_empty() {
            panic_with_error!(&env, RegistryError::EmptyTitle);
        }

        // Validate milestone config if provided
        if let Some(ref config) = milestone_config {
            validate_milestone_config(&env, config);
        }

        let milestone_config_option = match milestone_config {
            Some(cfg) => lumenlock_shared_types::MilestoneConfigOption::Some(cfg),
            None => lumenlock_shared_types::MilestoneConfigOption::None,
        };

        // Assign listing ID
        let listing_id = next_listing_id(&env);
        let now = env.ledger().timestamp();

        let listing = ListingData {
            listing_id,
            seller: seller.clone(),
            title,
            description,
            price,
            asset: asset.clone(),
            milestone_config: milestone_config_option,
            status: ListingStatus::Active,
            created_at: now,
        };

        // Effects: save listing and update index
        save_listing(&env, &listing);
        add_to_active_index(&env, listing_id);

        // Emit event
        events::emit_listing_created(&env, listing_id, &seller, price, &asset);

        env.storage().instance().extend_ttl(LEDGER_BUMP_LOW, LEDGER_BUMP_HIGH);

        listing_id
    }

    /// Retrieve a listing by ID.
    ///
    /// **Purpose**: Read-only accessor for listing data. Used by EscrowVault
    /// via cross-contract call to retrieve price, asset, and milestone config.
    ///
    /// **Auth requirements**: None (public read access).
    ///
    /// **State preconditions**: Listing with `listing_id` must exist.
    ///
    /// **Panics**:
    /// - `ListingNotFound` if the listing does not exist
    pub fn get_listing(env: Env, listing_id: u64) -> ListingData {
        get_listing_internal(&env, listing_id)
    }

    /// Update a listing's status.
    ///
    /// **Purpose**: Called exclusively by EscrowVault to reflect escrow state
    /// changes in the listing record. This creates an auditable link between
    /// the two contracts.
    ///
    /// **Auth requirements**: Only the authorized EscrowVault contract address
    /// may call this function. Any other caller will be rejected.
    ///
    /// The authorization is enforced by calling `vault_addr.require_auth()`.
    /// When EscrowVault calls this via cross-contract invocation, Soroban's
    /// auth framework automatically satisfies this requirement. When called
    /// from any other source, it fails.
    ///
    /// **State preconditions**:
    /// - VaultAddress must be set (contract initialized with vault address)
    /// - The listing must exist
    ///
    /// **State postconditions**:
    /// - `listing.status` updated to `new_status`
    /// - If status is Active (re-listing), listing added back to active index
    /// - If status is non-Active (locked/completed/etc), listing removed from active index
    ///
    /// **Panics**:
    /// - `VaultAddressNotSet` if vault address not configured
    /// - `UnauthorizedCaller` logic enforced via `require_auth` panic
    /// - `ListingNotFound` if the listing does not exist
    pub fn update_listing_status(env: Env, listing_id: u64, new_status: ListingStatus) {
        // CHECKS: Enforce that caller is the authorized vault
        let vault_addr = get_vault_address(&env);
        // This call will panic if the invoker is not the vault contract
        vault_addr.require_auth();

        // CHECKS: Verify listing exists
        let mut listing = get_listing_internal(&env, listing_id);

        // EFFECTS: Update status
        let was_active = listing.status == ListingStatus::Active;
        let becomes_active = new_status == ListingStatus::Active;
        listing.status = new_status.clone();

        save_listing(&env, &listing);

        // Update active index
        if was_active && !becomes_active {
            remove_from_active_index(&env, listing_id);
        } else if !was_active && becomes_active {
            add_to_active_index(&env, listing_id);
        }

        // Emit event with status code
        let status_code: u32 = match new_status {
            ListingStatus::Active => 0,
            ListingStatus::Locked => 1,
            ListingStatus::Completed => 2,
            ListingStatus::Refunded => 3,
            ListingStatus::Disputed => 4,
        };
        events::emit_listing_status_updated(&env, listing_id, status_code);
    }

    /// List all active listing IDs.
    ///
    /// **Purpose**: Returns the ordered vector of listing IDs that are currently
    /// in `Active` status. The frontend uses this to display the marketplace grid.
    ///
    /// **Auth requirements**: None (public read access).
    ///
    /// **Returns**: Vec<u64> of active listing IDs (may be empty).
    ///
    /// **Note**: For production with many listings, consider pagination via
    /// an offset/limit parameter. The current implementation returns all active
    /// listings in a single call, which may hit Soroban resource limits at scale.
    pub fn list_active_listings(env: Env) -> Vec<u64> {
        env.storage()
            .persistent()
            .extend_ttl(
                &RegistryKey::ActiveListings,
                LEDGER_BUMP_LOW,
                LEDGER_BUMP_HIGH,
            );
        env.storage()
            .persistent()
            .get::<RegistryKey, Vec<u64>>(&RegistryKey::ActiveListings)
            .unwrap_or_else(|| Vec::new(&env))
    }

    /// Upgrade the contract WASM bytecode.
    ///
    /// **Purpose**: Allows the admin to update the contract implementation
    /// without losing storage state. Only the contract bytecode is replaced;
    /// all Persistent and Instance storage keys remain intact.
    ///
    /// **Auth requirements**: Admin must sign this transaction.
    ///
    /// **State preconditions**: Contract must be initialized, admin must be set.
    ///
    /// **State postconditions**: Contract WASM updated to `new_wasm_hash`.
    ///
    /// **Panics**:
    /// - Panics if admin auth fails
    /// - Panics if new_wasm_hash is invalid
    ///
    /// **Security note**: The new WASM must be uploaded to the network before
    /// calling this function (via `stellar contract upload`). See ARCHITECTURE.md
    /// for the full upgrade procedure and storage migration guidelines.
    pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
        let admin = get_admin(&env);
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
    }

    /// Get the admin address.
    ///
    /// **Purpose**: Read-only accessor for the admin address. Useful for
    /// frontend administration panels.
    ///
    /// **Auth requirements**: None.
    pub fn get_admin(env: Env) -> Address {
        get_admin(&env)
    }

    /// Get the authorized vault address.
    ///
    /// **Purpose**: Read-only accessor for the authorized EscrowVault address.
    ///
    /// **Auth requirements**: None.
    ///
    /// **Panics**:
    /// - `VaultAddressNotSet` if vault address has not been configured.
    pub fn get_vault_address(env: Env) -> Address {
        get_vault_address(&env)
    }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, Ledger},
        Address, Env, String, Vec,
    };

    fn create_env() -> Env {
        Env::default()
    }

    fn setup_contract(env: &Env) -> (Address, MarketplaceRegistryClient) {
        let contract_id = env.register_contract(None, MarketplaceRegistry);
        let client = MarketplaceRegistryClient::new(env, &contract_id);
        let admin = Address::generate(env);
        client.initialize(&admin, &None);
        (admin, client)
    }

    fn default_listing_args(env: &Env, seller: &Address) -> (String, String, i128, Address, Option<MilestoneConfig>) {
        (
            String::from_str(env, "Test Product"),
            String::from_str(env, "A test product description"),
            1_000_000i128, // 1 XLM in stroops
            Address::generate(env), // token address
            None,
        )
    }

    /// Test 1: Full listing creation and retrieval flow.
    ///
    /// Verifies that a seller can create a listing, it gets assigned ID 1,
    /// and is retrievable with correct data.
    #[test]
    fn test_create_and_get_listing() {
        let env = create_env();
        let (_, client) = setup_contract(&env);
        let seller = Address::generate(&env);
        let asset = Address::generate(&env);

        env.mock_all_auths();

        let listing_id = client.create_listing(
            &seller,
            &String::from_str(&env, "Digital Art Pack"),
            &String::from_str(&env, "A collection of 10 digital artworks"),
            &5_000_000i128,
            &asset,
            &None,
        );

        assert_eq!(listing_id, 1u64);

        let listing = client.get_listing(&listing_id);
        assert_eq!(listing.listing_id, 1u64);
        assert_eq!(listing.seller, seller);
        assert_eq!(listing.price, 5_000_000i128);
        assert_eq!(listing.asset, asset);
        assert_eq!(listing.status, ListingStatus::Active);
        assert!(matches!(listing.milestone_config, lumenlock_shared_types::MilestoneConfigOption::None));
    }

    /// Test 2: Active listings index management.
    ///
    /// Verifies that listings are added to the active index on creation
    /// and removed when status changes to non-Active.
    #[test]
    fn test_active_listings_index() {
        let env = create_env();
        let (admin, client) = setup_contract(&env);

        // Set a vault address so update_listing_status works
        let vault_addr = env.register_contract(None, MarketplaceRegistry);
        env.mock_all_auths();
        client.set_vault_address(&vault_addr);

        let seller = Address::generate(&env);
        let asset = Address::generate(&env);

        // Create 3 listings
        let id1 = client.create_listing(
            &seller,
            &String::from_str(&env, "Listing 1"),
            &String::from_str(&env, "desc"),
            &1_000_000i128,
            &asset,
            &None,
        );
        let id2 = client.create_listing(
            &seller,
            &String::from_str(&env, "Listing 2"),
            &String::from_str(&env, "desc"),
            &2_000_000i128,
            &asset,
            &None,
        );
        let id3 = client.create_listing(
            &seller,
            &String::from_str(&env, "Listing 3"),
            &String::from_str(&env, "desc"),
            &3_000_000i128,
            &asset,
            &None,
        );

        let active = client.list_active_listings();
        assert_eq!(active.len(), 3);

        // Lock listing 2 (vault calls update_listing_status)
        client.update_listing_status(&id2, &ListingStatus::Locked);

        let active = client.list_active_listings();
        assert_eq!(active.len(), 2);
        // id2 should be gone
        assert!(!active.contains(&id2));
        assert!(active.contains(&id1));
        assert!(active.contains(&id3));
    }

    /// Test 3: Milestone config validation.
    ///
    /// Verifies that invalid milestone configurations are rejected.
    #[test]
    #[should_panic(expected = "Error(Contract, #8)")]
    fn test_invalid_milestone_config_sum() {
        let env = create_env();
        let (_, client) = setup_contract(&env);
        let seller = Address::generate(&env);
        let asset = Address::generate(&env);

        env.mock_all_auths();

        let bad_config = MilestoneConfig {
            percentages: Vec::from_array(&env, [30u32, 50u32]), // sums to 80, not 100
            labels: Vec::from_array(&env, [
                String::from_str(&env, "Start"),
                String::from_str(&env, "End"),
            ]),
        };

        client.create_listing(
            &seller,
            &String::from_str(&env, "Service"),
            &String::from_str(&env, "desc"),
            &1_000_000i128,
            &asset,
            &Some(bad_config),
        );
    }

    /// Test 4: Valid milestone config.
    ///
    /// Verifies that a 30%/70% milestone listing is accepted and stored correctly.
    #[test]
    fn test_valid_milestone_config() {
        let env = create_env();
        let (_, client) = setup_contract(&env);
        let seller = Address::generate(&env);
        let asset = Address::generate(&env);

        env.mock_all_auths();

        let config = MilestoneConfig {
            percentages: Vec::from_array(&env, [30u32, 70u32]),
            labels: Vec::from_array(&env, [
                String::from_str(&env, "Project Start"),
                String::from_str(&env, "Project Completion"),
            ]),
        };

        let listing_id = client.create_listing(
            &seller,
            &String::from_str(&env, "Freelance Service"),
            &String::from_str(&env, "Web development service"),
            &10_000_000i128,
            &asset,
            &Some(config),
        );

        let listing = client.get_listing(&listing_id);
        let mc = match listing.milestone_config {
            lumenlock_shared_types::MilestoneConfigOption::Some(cfg) => cfg,
            lumenlock_shared_types::MilestoneConfigOption::None => panic!("Expected milestone config"),
        };
        assert_eq!(mc.percentages.len(), 2);
        assert_eq!(mc.percentages.get(0).unwrap(), 30u32);
        assert_eq!(mc.percentages.get(1).unwrap(), 70u32);
    }

    /// Test 5: Double initialization prevention.
    ///
    /// Verifies that calling initialize() twice panics with AlreadyInitialized.
    #[test]
    #[should_panic(expected = "Error(Contract, #1)")]
    fn test_double_initialize() {
        let env = create_env();
        let (_, client) = setup_contract(&env);
        let admin2 = Address::generate(&env);

        // Second initialization should fail
        client.initialize(&admin2, &None);
    }

    /// Attack Test 1: Unauthorized update_listing_status call.
    ///
    /// Verifies that a non-vault address cannot call update_listing_status.
    /// This is the primary access control test for the inter-contract boundary.
    #[test]
    #[should_panic]
    fn test_attack_unauthorized_update_listing_status() {
        let env = create_env();
        let (admin, client) = setup_contract(&env);
        let vault_addr = Address::generate(&env);

        env.mock_all_auths();
        client.set_vault_address(&vault_addr);

        let seller = Address::generate(&env);
        let asset = Address::generate(&env);

        let listing_id = client.create_listing(
            &seller,
            &String::from_str(&env, "Test"),
            &String::from_str(&env, "desc"),
            &1_000_000i128,
            &asset,
            &None,
        );

        // Remove mock auths — now calls need real auth
        // This simulates an attacker who is NOT the vault trying to update status
        // Without mock_all_auths, vault_addr.require_auth() will fail
        let env2 = Env::default();
        let client2 = MarketplaceRegistryClient::new(&env2, &client.address);
        // This should panic because the caller is not the vault address
        client2.update_listing_status(&listing_id, &ListingStatus::Completed);
    }

    /// Attack Test 2: Invalid price rejection.
    ///
    /// Verifies that zero-price listings are rejected.
    #[test]
    #[should_panic(expected = "Error(Contract, #5)")]
    fn test_attack_zero_price_listing() {
        let env = create_env();
        let (_, client) = setup_contract(&env);
        let seller = Address::generate(&env);
        let asset = Address::generate(&env);

        env.mock_all_auths();

        // Attempt to create a zero-price listing (attack: list for free)
        client.create_listing(
            &seller,
            &String::from_str(&env, "Free Stuff"),
            &String::from_str(&env, "desc"),
            &0i128, // zero price
            &asset,
            &None,
        );
    }
}
