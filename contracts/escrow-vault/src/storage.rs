//! # EscrowVault — Storage Keys & Constants

use soroban_sdk::contracttype;

/// All storage keys for the EscrowVault contract.
#[contracttype]
pub enum VaultKey {
    /// Admin account address — Instance storage.
    Admin,
    /// Designated arbiter address — Instance storage.
    Arbiter,
    /// MarketplaceRegistry contract address — Instance storage.
    RegistryAddress,
    /// Initialization flag — Instance storage.
    Initialized,
    /// Monotonic counter for escrow IDs — Instance storage.
    EscrowCounter,
    /// A specific escrow record — Persistent storage.
    Escrow(u64),
    /// Default escrow deadline in seconds — Instance storage.
    DefaultDeadlineSecs,
}

// TTL bump thresholds (in ledgers, ~5s per ledger)
// 60 days for escrow records (max expected escrow duration)
pub const LEDGER_BUMP_LOW: u32 = 1_036_800;   // 60 days
pub const LEDGER_BUMP_HIGH: u32 = 2_073_600;  // 120 days

/// Default escrow deadline: 7 days in seconds.
pub const DEFAULT_DEADLINE_SECS: u64 = 7 * 24 * 60 * 60;
