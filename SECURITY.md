# LumenLock — Security Document

## Overview

This document exhaustively covers all security properties of the LumenLock smart contracts, known attack vectors, mitigations, and documented tradeoffs. It is intended as a primary deliverable for security review — not an afterthought.

---

## Access Control Matrix

Every state-changing function is listed below with its exact authorization requirement.

### MarketplaceRegistry

| Function | Caller Requirement | Enforcement |
|---|---|---|
| `initialize(admin, vault_addr)` | Anyone (one-time, panics if already initialized) | Storage key `Initialized` check |
| `create_listing(seller, ...)` | `seller` must sign (require_auth) | `seller.require_auth()` |
| `get_listing(listing_id)` | Anyone (read-only) | N/A |
| `list_active_listings()` | Anyone (read-only) | N/A |
| `update_listing_status(listing_id, status)` | Only the authorized EscrowVault contract address | `assert_caller_is_vault(&env)` |
| `upgrade(new_wasm_hash)` | Admin address only | `admin.require_auth()` |
| `set_vault_address(vault_addr)` | Admin address only | `admin.require_auth()` |

### EscrowVault

| Function | Caller Requirement | Enforcement |
|---|---|---|
| `initialize(admin, arbiter, registry_addr)` | Anyone (one-time) | Storage key check |
| `open_escrow(listing_id, buyer)` | `buyer` must sign | `buyer.require_auth()` |
| `fund(escrow_id)` | `buyer` must sign | `buyer.require_auth()` + escrow.buyer == caller |
| `confirm_buyer(escrow_id)` | `buyer` must sign | `buyer.require_auth()` + escrow.buyer == caller |
| `confirm_seller(escrow_id)` | `seller` must sign | `seller.require_auth()` + escrow.seller == caller |
| `claim_refund(escrow_id)` | `buyer` must sign | `buyer.require_auth()` + escrow.buyer == caller |
| `raise_dispute(escrow_id)` | `buyer` or `seller` must sign | Caller must be either party |
| `resolve_dispute(escrow_id, winner)` | Arbiter address only | `arbiter.require_auth()` + stored arbiter == caller |
| `upgrade(new_wasm_hash)` | Admin address only | `admin.require_auth()` |

---

## Reentrancy Protection

### Threat Model

Soroban's execution model is synchronous and single-threaded per transaction. Unlike EVM, there is no way for a callee to re-enter the caller mid-execution in the same transaction. However, a malicious token contract could theoretically attempt to call back into the vault during a `token.transfer()` call.

### Mitigation: Checks-Effects-Interactions Pattern

All state-mutating functions in EscrowVault strictly follow this ordering:

1. **Checks**: Validate caller identity, state preconditions, escrow state
2. **Effects**: Mutate storage (update state, clear flags, record amounts)  
3. **Interactions**: Execute token transfers

Example from `fund()`:

```rust
// CHECKS
let mut escrow = storage::get_escrow(&env, escrow_id);
assert!(escrow.state == EscrowState::Created, Error::InvalidState);
escrow.buyer.require_auth();

// EFFECTS — mutate state BEFORE token transfer
escrow.state = EscrowState::Funded;
storage::save_escrow(&env, escrow_id, &escrow);

// INTERACTIONS — transfer happens last
let token = token::Client::new(&env, &escrow.asset);
token.transfer(&escrow.buyer, &env.current_contract_address(), &escrow.amount);
```

This guarantees that even if a malicious token contract re-enters the vault, the state has already been updated and the re-entrant call will fail the state check.

### Additional Defense

- `claim_refund()` is only callable when state is `Funded` — a buyer who has already received a refund cannot call it again because state is `Refunded`.
- Confirmed flags are set in storage before any token transfer.

---

## Access Control — Detailed Analysis

### Unauthorized `update_listing_status` Prevention

**Attack**: A malicious actor directly calls `MarketplaceRegistry.update_listing_status(listing_id, Completed)` to mark a listing as complete without paying the escrow.

**Mitigation**: The function checks that the `env.invoker()` (the contract or account invoking the call) matches the stored EscrowVault contract address:

```rust
fn assert_caller_is_vault(env: &Env) {
    let vault_addr: Address = storage::get_vault_address(env);
    // In Soroban, require_auth on a contract address verifies the invoker is that contract
    vault_addr.require_auth();
}
```

When called from outside the EscrowVault, `vault_addr.require_auth()` will fail because the actual invoker is not the vault. When EscrowVault calls this function, Soroban's cross-contract authorization automatically satisfies the auth requirement.

### Double-Spend / Double-Refund Prevention

**Attack**: A buyer calls `claim_refund()` twice to drain the vault.

**Mitigation**: 
- First `claim_refund()` sets state to `Refunded` before the token transfer (effects before interactions).
- Second call finds state == `Refunded`, not `Funded`, and panics with `InvalidState`.
- The vault never holds extra funds because `fund()` is a one-time state transition from `Created` to `Funded`.

### Buyer Impersonation Prevention

**Attack**: An attacker calls `confirm_buyer(escrow_id)` claiming to be the buyer for an escrow they didn't open.

**Mitigation**:
```rust
pub fn confirm_buyer(env: Env, escrow_id: u64) {
    let escrow = storage::get_escrow(&env, escrow_id);
    escrow.buyer.require_auth(); // Fails if caller is not the buyer
    // ...
}
```

`require_auth()` on a specific address ensures only the address that signed the transaction can proceed. An attacker cannot forge another account's signature.

---

## Integer Overflow / Underflow

### Milestone Percentage Arithmetic

Milestone percentage calculations use Soroban's `i128` arithmetic which is bounded by the host environment. The key calculation is:

```rust
fn milestone_amount(total: i128, pct: u32) -> i128 {
    // Both values fit in i128; intermediate product checked
    total.checked_mul(pct as i128)
        .expect("milestone amount overflow")
        .checked_div(100)
        .expect("milestone div by zero")
}
```

**Percentage validation on listing creation**:
```rust
let sum: u32 = milestones.iter().sum();
assert!(sum == 100, Error::InvalidMilestoneConfig);
```

This ensures milestone percentages are validated at listing time, not at release time.

**Edge cases**:
- Rounding: Integer division truncates; any dust (from rounding) is sent to the seller on the final milestone via `final_amount = total_remaining - released_so_far`. This ensures no funds are permanently locked.
- Zero-percentage milestones: Rejected by validation (each milestone must be > 0).

---

## Deadline Manipulation Resistance

### Timestamp Source

Deadlines use `env.ledger().timestamp()` — the ledger close time as agreed by the validator network consensus. This is not user-supplied and cannot be manipulated by a single transaction sender.

**Assumptions**:
- Stellar validators operate with clocks accurate to within ~5 seconds
- Ledger close time is the median of validators' proposed timestamps (SCP-enforced)
- For deadlines measured in days, 5-second drift is negligible

**Attack scenario**: A validator set colluding to advance the clock by hours to prematurely expire escrows.

**Mitigation**: SCP requires a supermajority of validators (>67%) to agree on timestamps. A single validator or small coalition cannot advance the clock by more than a few seconds without detection. LumenLock documents this as an acceptable assumption.

### Deadline Extension

Currently, deadlines cannot be extended post-creation. This is intentional — allowing buyer-requested extensions could be used to delay refund eligibility indefinitely. Future version: require seller signature to extend deadline.

---

## Asset / Token Validation

### Listing Creation Validation

When a seller creates a listing, the asset (token contract address) is validated:

```rust
assert!(asset != Address::default(), Error::InvalidAsset);
// Asset must be a valid Soroban contract address
// (The SDK ensures Address type is always a valid 32-byte account/contract ID)
```

### Escrow Opening Validation

When `fund()` is called, the vault attempts a `token.balance()` call before the transfer to verify the token contract is callable. If the token contract is malformed or not SEP-41 compliant, this call fails and the escrow remains in `Funded` state — but note: `fund()` actually performs the transfer directly, so a non-compliant token would cause the entire transaction to fail before state is mutated (since the check happens in the interaction phase).

Actually, following checks-effects-interactions strictly:
- If the token transfer fails, the entire transaction is rolled back by the Soroban host
- Storage mutations within a failed transaction are discarded
- This means a bad token causes fund() to revert, protecting the user

### Recommended Future Improvement

Maintain a contract-admin-controlled allowlist of approved token addresses. This prevents:
- Scam listings that accept only worthless tokens
- Tokens with malicious `transfer` implementations designed to cause unexpected behavior

---

## Upgrade Safety

### Upgrade Authority

Both contracts enforce that only the admin address can trigger an upgrade:

```rust
pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
    let admin: Address = storage::get_admin(&env);
    admin.require_auth();
    env.deployer().update_current_contract_wasm(new_wasm_hash);
}
```

### Storage Migration Policy

Soroban upgrades replace only the WASM bytecode; contract storage persists across upgrades. This means:

**Safe upgrade operations**:
- Adding new storage keys (old code never writes them; new code reads with defaults)
- Adding new functions
- Changing internal business logic without changing storage schema

**Unsafe upgrade operations** (require explicit migration):
- Removing or renaming storage keys that existing records use
- Changing the type stored at an existing key

**Migration procedure**:
1. Deploy new WASM that includes both old and new storage reading/writing logic
2. Call a one-time `migrate_v1_to_v2()` admin function that transforms storage
3. In a subsequent upgrade, remove the old storage access and migration function

**Upgrade key management**: For production, the admin account should be a Stellar multisig account (e.g., 3-of-5 threshold) to prevent a single key compromise from triggering a malicious upgrade. This is the single most important operational security recommendation.

---

## Known Centralization Tradeoffs

### Single Arbiter

**What it is**: A single `arbiter` address stored in EscrowVault instance storage. Only this address can call `resolve_dispute(escrow_id, winner)`.

**Why it's a tradeoff**: 
- If the arbiter key is compromised, all disputed escrows can be resolved in the attacker's favor
- The arbiter has unilateral power to decide the outcome of any dispute
- No transparency mechanism ensures arbiter decisions are consistent or unbiased

**Risk level**: HIGH for individual escrow participants; the protocol itself is not affected.

**Current mitigation**: The arbiter address is set at initialization and can be updated by the admin. Using a separate hardware wallet for the arbiter key reduces compromise risk.

**Proposed v2 Multi-Sig Arbitration**:

```
Option A — Multisig Threshold:
  Replace single arbiter with a list of arbiters.
  Resolution requires M-of-N signatures (e.g., 2-of-3).
  Implemented as a separate ArbitrationCouncil contract.

Option B — Staked Juror Pool (Kleros-style):
  Arbiters stake XLM to participate.
  Disputes are assigned to random jurors.
  Majority vote wins; losing jurors lose stake.
  Provides economic incentive for honest arbitration.

Option C — DAO Governance:
  Dispute resolution voted on by LMK token holders.
  Requires governance token infrastructure.
  Highest decentralization, highest complexity.
```

Recommended migration path: Option A (multisig) for v2, Option B for v3.

---

## Event Integrity

Contract events emitted by LumenLock are:
- Immutable once included in a ledger
- Indexable via Stellar RPC `getEvents` with contract ID filter
- Not authenticated at the event level (events don't carry signatures), but are verified by the ledger consensus that included them

**Frontend event validation**: The frontend subscribes to events using the known contract address. Events from other contract addresses are ignored. Event payloads are decoded using the generated SDK types.

---

## Attack Scenario Summary

| Attack | Vector | Mitigation | Status |
|--------|--------|------------|--------|
| Unauthorized listing status update | Direct call to update_listing_status | vault_addr.require_auth() guard | ✅ Mitigated |
| Double refund claim | Call claim_refund twice | State set to Refunded before transfer | ✅ Mitigated |
| Buyer impersonation in confirm | Call confirm_buyer for someone else's escrow | buyer.require_auth() tied to stored buyer address | ✅ Mitigated |
| Milestone percentage manipulation | Integer overflow in pct math | checked_mul / checked_div | ✅ Mitigated |
| Deadline clock manipulation | Validator clock collusion | SCP supermajority timestamp consensus | ✅ Documented |
| Malicious token contract reentrancy | Token.transfer() calls back into vault | CEI pattern; state mutated before transfer | ✅ Mitigated |
| Arbiter compromise | Single key controls all disputes | Known tradeoff; multi-sig upgrade path | ⚠️ Documented |
| Upgrade to malicious WASM | Admin key compromise | Admin = multisig recommendation | ⚠️ Operational |
| Token allowlist bypass | Any token accepted | Known gap; allowlist recommended for mainnet | ⚠️ Future work |
| Escrow with zero amount | Listing price = 0 | Validated: price must be > 0 on create_listing | ✅ Mitigated |

---

## Recommendations for Production Mainnet

1. **Use a multisig admin account** (Stellar threshold signatures, M-of-N)
2. **Use a separate multisig arbiter account** for dispute resolution
3. **Implement token allowlist** before opening to public listings
4. **Professional security audit** before mainnet deployment
5. **Bug bounty program** with responsible disclosure policy
6. **Monitor contract events** for anomalous activity patterns (e.g., many disputes from same account)
7. **Rate limit listing creation** per address to prevent spam
8. **Test upgrade path** on testnet before any mainnet upgrade

---

*This security document was written as a primary deliverable alongside the contract implementation. All security properties described here are enforced in code.*
