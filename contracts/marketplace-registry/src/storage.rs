//! # MarketplaceRegistry — Storage Keys
//!
//! Defines all storage keys used by the MarketplaceRegistry contract.
//! Using an enum as key type ensures type safety and avoids key collisions.

use soroban_sdk::contracttype;

/// All storage keys for the MarketplaceRegistry contract.
///
/// Key types:
/// - `Instance` storage: Admin, VaultAddress, ListingCounter, Initialized  
/// - `Persistent` storage: Listing(id), ActiveListings
#[contracttype]
pub enum RegistryKey {
    /// Admin account address — stored in Instance storage.
    Admin,
    /// The authorized EscrowVault contract address — stored in Instance storage.
    VaultAddress,
    /// Monotonic counter for listing IDs — stored in Instance storage.
    ListingCounter,
    /// Initialization flag — stored in Instance storage.
    Initialized,
    /// A specific listing record — stored in Persistent storage.
    /// Keyed by listing_id (u64).
    Listing(u64),
    /// The ordered list of all active listing IDs — stored in Persistent storage.
    ActiveListings,
}

// TTL bump thresholds (in ledgers, ~5s per ledger on testnet)
// 30 days = 30 * 24 * 3600 / 5 = 518400 ledgers
pub const LEDGER_BUMP_LOW: u32 = 518_400;
// 60 days
pub const LEDGER_BUMP_HIGH: u32 = 1_036_800;
