//! # MarketplaceRegistry — Event Definitions
//!
//! All contract events emitted by MarketplaceRegistry.
//! Events are indexed by the RPC and consumed by the frontend activity feed.
//!
//! Event structure: `(contract_id, topics, data)`
//! - Topics are used for filtering (up to 4 topics per event)
//! - Data contains the event payload

use soroban_sdk::{symbol_short, Address, Env};

/// Event: A new listing was created.
///
/// Topics: ["listing_created", listing_id]
/// Data: { seller, title, price, asset }
pub fn emit_listing_created(
    env: &Env,
    listing_id: u64,
    seller: &Address,
    price: i128,
    asset: &Address,
) {
    env.events().publish(
        (symbol_short!("lst_creat"), listing_id),
        (seller.clone(), price, asset.clone()),
    );
}

/// Event: A listing's status was updated.
///
/// Topics: ["listing_update", listing_id]
/// Data: { new_status_code }
/// Status codes: 0=Active, 1=Locked, 2=Completed, 3=Refunded, 4=Disputed
pub fn emit_listing_status_updated(env: &Env, listing_id: u64, status_code: u32) {
    env.events().publish(
        (symbol_short!("lst_updat"), listing_id),
        (status_code,),
    );
}
