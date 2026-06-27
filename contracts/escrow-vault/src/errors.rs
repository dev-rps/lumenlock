//! # EscrowVault — Error Definitions

use soroban_sdk::contracterror;

/// All error codes for the EscrowVault contract.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VaultError {
    /// Contract already initialized.
    AlreadyInitialized = 1,
    /// Contract not initialized.
    NotInitialized = 2,
    /// Escrow record not found.
    EscrowNotFound = 3,
    /// Operation not valid in the current escrow state.
    InvalidState = 4,
    /// Caller is not the buyer for this escrow.
    NotBuyer = 5,
    /// Caller is not the seller for this escrow.
    NotSeller = 6,
    /// Caller is not the designated arbiter.
    NotArbiter = 7,
    /// Caller is not admin.
    NotAdmin = 8,
    /// The refund deadline has not passed yet.
    DeadlineNotPassed = 9,
    /// The refund deadline has already passed (can't confirm after deadline).
    DeadlinePassed = 10,
    /// Listing is not in Active status (cannot open escrow).
    ListingNotActive = 11,
    /// The fund amount doesn't match the listing price.
    AmountMismatch = 12,
    /// Caller must be either buyer or seller.
    NotParty = 13,
    /// Integer arithmetic overflow detected.
    ArithmeticOverflow = 14,
    /// Milestone index out of bounds.
    MilestoneOutOfBounds = 15,
    /// Buyer has already confirmed this milestone.
    AlreadyConfirmedBuyer = 16,
    /// Seller has already confirmed this milestone.
    AlreadyConfirmedSeller = 17,
    /// Resolution winner address must be buyer or seller.
    InvalidWinner = 18,
}
