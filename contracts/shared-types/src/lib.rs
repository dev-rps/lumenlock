//! # LumenLock Shared Types
//!
//! This crate defines the data types shared between the MarketplaceRegistry
//! and EscrowVault contracts. Both contracts depend on this crate to ensure
//! type compatibility when exchanging data via cross-contract calls.
//!
//! All types implement `soroban_sdk::contracttype` for on-chain XDR encoding.

#![no_std]

use soroban_sdk::{contracttype, Address, String, Vec};

// ─── Listing Types ──────────────────────────────────────────────────────────

/// The status of a marketplace listing.
///
/// State transitions:
/// - `Active`   → created and available for purchase
/// - `Locked`   → escrow opened; no new buyers accepted  
/// - `Completed`→ escrow released; transaction successful
/// - `Refunded` → escrow refunded; listing returns to closed state
/// - `Disputed` → under arbiter review (mirrors escrow dispute state)
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ListingStatus {
    Active,
    Locked,
    Completed,
    Refunded,
    Disputed,
}

/// Configuration for a milestone-based listing.
///
/// `percentages` must be a vector of u32 values that sum to exactly 100.
/// Each percentage represents the fraction of the total escrow amount
/// released upon confirmation of that milestone.
///
/// Example: `[30, 70]` = 30% on start + 70% on completion.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MilestoneConfig {
    /// Percentage allocations per milestone. Must sum to 100.
    pub percentages: Vec<u32>,
    /// Human-readable labels for each milestone (same length as percentages).
    pub labels: Vec<String>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum MilestoneConfigOption {
    None,
    Some(MilestoneConfig),
}

/// A marketplace listing record stored in MarketplaceRegistry.
///
/// Created by `create_listing()` and updated by `update_listing_status()`.
/// Immutable fields (title, description, price, asset, seller) cannot be
/// changed after creation. Only `status` is mutable.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ListingData {
    /// Unique monotonic identifier assigned at creation.
    pub listing_id: u64,
    /// The Stellar account address of the seller.
    pub seller: Address,
    /// Short human-readable title for the listing.
    pub title: String,
    /// Detailed description of the product or service.
    pub description: String,
    /// Price in the smallest unit of the asset (e.g., stroops for XLM).
    pub price: i128,
    /// The Soroban token contract address (SAC or SEP-41).
    pub asset: Address,
    /// Optional milestone configuration. If None, full amount released on confirmation.
    pub milestone_config: MilestoneConfigOption,
    /// Current status of this listing.
    pub status: ListingStatus,
    /// Ledger timestamp when this listing was created.
    pub created_at: u64,
}

// ─── Escrow Types ────────────────────────────────────────────────────────────

/// The state of an escrow record in EscrowVault.
///
/// Full state machine:
/// ```text
/// Created → Funded → Released
///                  → Refunded (deadline passed, buyer calls claim_refund)
///                  → Disputed → Resolved
///           Funded → PartiallyReleased → ... → Released (milestones)
/// ```
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowState {
    /// Escrow opened but not yet funded. Buyer has committed to purchase.
    Created,
    /// Buyer has deposited funds. Awaiting dual confirmation.
    Funded,
    /// All funds released to seller (or all milestones completed).
    Released,
    /// Funds returned to buyer after deadline elapsed.
    Refunded,
    /// At least one milestone released; waiting for next milestone confirmation.
    PartiallyReleased,
    /// A dispute was raised; funds frozen pending arbiter resolution.
    Disputed,
    /// Arbiter resolved the dispute; funds distributed per resolution.
    Resolved,
}

/// An escrow record stored in EscrowVault.
///
/// Tracks the full lifecycle of a single escrow from creation to settlement.
/// All financial amounts are in the smallest token unit.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowRecord {
    /// Unique monotonic identifier assigned at open_escrow().
    pub escrow_id: u64,
    /// The listing this escrow is associated with.
    pub listing_id: u64,
    /// The buyer's Stellar account address.
    pub buyer: Address,
    /// The seller's Stellar account address (copied from listing at open time).
    pub seller: Address,
    /// The token contract address for this escrow.
    pub asset: Address,
    /// Total escrow amount (must equal listing price at fund time).
    pub amount: i128,
    /// Current state in the escrow state machine.
    pub state: EscrowState,
    /// Whether the buyer has confirmed this escrow (or current milestone).
    pub buyer_confirmed: bool,
    /// Whether the seller has confirmed this escrow (or current milestone).
    pub seller_confirmed: bool,
    /// Ledger timestamp after which buyer may claim a refund.
    pub deadline: u64,
    /// Ledger timestamp when this escrow was opened.
    pub created_at: u64,
    /// Optional milestone percentages (copied from listing at open time).
    pub milestone_percentages: Option<Vec<u32>>,
    /// Index of the current milestone being confirmed (0-based).
    pub current_milestone_index: u32,
    /// Amount released so far (for milestone escrows).
    pub released_amount: i128,
}
