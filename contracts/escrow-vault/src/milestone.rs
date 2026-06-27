//! # EscrowVault — Milestone Math
//!
//! Pure functions for milestone amount calculations.
//! All arithmetic uses checked operations to prevent overflow.

use crate::errors::VaultError;
use soroban_sdk::{panic_with_error, Env, Vec};

/// Calculate the amount for a given milestone index.
///
/// Uses checked arithmetic throughout. Panics with `ArithmeticOverflow`
/// on overflow (which should never occur with valid inputs but is defensive).
///
/// For the FINAL milestone, returns `total - already_released` to
/// capture any dust from integer division and ensure no funds are locked.
///
/// # Arguments
/// * `env` - Soroban environment (for panics)
/// * `total` - Total escrow amount
/// * `percentages` - Vector of u32 percentages (must sum to 100)
/// * `index` - Zero-based milestone index
/// * `already_released` - Amount released in prior milestones
///
/// # Returns
/// Amount to release for this milestone in token's smallest unit.
pub fn milestone_amount(
    env: &Env,
    total: i128,
    percentages: &Vec<u32>,
    index: u32,
    already_released: i128,
) -> i128 {
    let pct = percentages
        .get(index)
        .unwrap_or_else(|| panic_with_error!(env, VaultError::MilestoneOutOfBounds));

    let is_final = index == percentages.len() - 1;

    if is_final {
        // Final milestone: release everything remaining to avoid dust
        total
            .checked_sub(already_released)
            .unwrap_or_else(|| panic_with_error!(env, VaultError::ArithmeticOverflow))
    } else {
        // Intermediate milestone: proportional amount
        total
            .checked_mul(pct as i128)
            .unwrap_or_else(|| panic_with_error!(env, VaultError::ArithmeticOverflow))
            .checked_div(100)
            .unwrap_or_else(|| panic_with_error!(env, VaultError::ArithmeticOverflow))
    }
}
