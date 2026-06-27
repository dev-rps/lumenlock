//! # MarketplaceRegistry — Error Definitions

use soroban_sdk::contracterror;

/// All error codes emitted by the MarketplaceRegistry contract.
///
/// Errors are returned as panic payloads via `panic_with_error!()`.
/// Frontend code should decode these to display human-readable messages.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RegistryError {
    /// Contract has already been initialized. `initialize()` can only be called once.
    AlreadyInitialized = 1,
    /// Contract has not been initialized. Call `initialize()` first.
    NotInitialized = 2,
    /// The requested listing does not exist.
    ListingNotFound = 3,
    /// The listing is not in the expected state for this operation.
    InvalidListingStatus = 4,
    /// The provided price is zero or negative.
    InvalidPrice = 5,
    /// The provided asset address is invalid (zero or malformed).
    InvalidAsset = 6,
    /// The title is empty.
    EmptyTitle = 7,
    /// The milestone configuration is invalid (percentages don't sum to 100,
    /// empty config, or mismatched labels length).
    InvalidMilestoneConfig = 8,
    /// The caller is not authorized to perform this action.
    /// For `update_listing_status`, this means the caller is not the EscrowVault.
    UnauthorizedCaller = 9,
    /// The caller is not the admin.
    NotAdmin = 10,
    /// The vault address has not been set.
    VaultAddressNotSet = 11,
}
