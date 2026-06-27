//! # EscrowVault — Event Definitions
//!
//! All events emitted by EscrowVault, subscribed to by the frontend activity feed.

use soroban_sdk::{symbol_short, Address, Env};

/// Event: Escrow opened.
///
/// Topics: ["esc_open", escrow_id]
/// Data: { listing_id, buyer, seller, amount, asset }
pub fn emit_escrow_opened(
    env: &Env,
    escrow_id: u64,
    listing_id: u64,
    buyer: &Address,
    seller: &Address,
    amount: i128,
    asset: &Address,
) {
    env.events().publish(
        (symbol_short!("esc_open"), escrow_id),
        (listing_id, buyer.clone(), seller.clone(), amount, asset.clone()),
    );
}

/// Event: Escrow funded.
///
/// Topics: ["esc_fund", escrow_id]
/// Data: { amount }
pub fn emit_escrow_funded(env: &Env, escrow_id: u64, amount: i128) {
    env.events().publish(
        (symbol_short!("esc_fund"), escrow_id),
        (amount,),
    );
}

/// Event: Buyer confirmed.
///
/// Topics: ["esc_bcnf", escrow_id]
/// Data: { milestone_index }
pub fn emit_buyer_confirmed(env: &Env, escrow_id: u64, milestone_index: u32) {
    env.events().publish(
        (symbol_short!("esc_bcnf"), escrow_id),
        (milestone_index,),
    );
}

/// Event: Seller confirmed.
///
/// Topics: ["esc_scnf", escrow_id]
/// Data: { milestone_index }
pub fn emit_seller_confirmed(env: &Env, escrow_id: u64, milestone_index: u32) {
    env.events().publish(
        (symbol_short!("esc_scnf"), escrow_id),
        (milestone_index,),
    );
}

/// Event: Funds released (full or partial milestone).
///
/// Topics: ["esc_rels", escrow_id]
/// Data: { recipient, amount, milestone_index, is_final }
pub fn emit_funds_released(
    env: &Env,
    escrow_id: u64,
    recipient: &Address,
    amount: i128,
    milestone_index: u32,
    is_final: bool,
) {
    env.events().publish(
        (symbol_short!("esc_rels"), escrow_id),
        (recipient.clone(), amount, milestone_index, is_final),
    );
}

/// Event: Refund claimed.
///
/// Topics: ["esc_refn", escrow_id]
/// Data: { buyer, amount }
pub fn emit_refund_claimed(env: &Env, escrow_id: u64, buyer: &Address, amount: i128) {
    env.events().publish(
        (symbol_short!("esc_refn"), escrow_id),
        (buyer.clone(), amount),
    );
}

/// Event: Dispute raised.
///
/// Topics: ["esc_disp", escrow_id]
/// Data: { raised_by }
pub fn emit_dispute_raised(env: &Env, escrow_id: u64, raised_by: &Address) {
    env.events().publish(
        (symbol_short!("esc_disp"), escrow_id),
        (raised_by.clone(),),
    );
}

/// Event: Dispute resolved.
///
/// Topics: ["esc_resv", escrow_id]
/// Data: { winner, amount }
pub fn emit_dispute_resolved(env: &Env, escrow_id: u64, winner: &Address, amount: i128) {
    env.events().publish(
        (symbol_short!("esc_resv"), escrow_id),
        (winner.clone(), amount),
    );
}
