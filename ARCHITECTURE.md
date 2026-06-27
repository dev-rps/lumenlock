# LumenLock — Architecture Document

## Table of Contents

1. [System Overview](#system-overview)
2. [Why Two Contracts](#why-two-contracts)
3. [Contract State Machine](#contract-state-machine)
4. [Inter-Contract Communication](#inter-contract-communication)
5. [Storage Design](#storage-design)
6. [Asset Support Strategy](#asset-support-strategy)
7. [Milestone Architecture](#milestone-architecture)
8. [Deadline & Time Model](#deadline--time-model)
9. [Single Arbiter Design](#single-arbiter-design)
10. [Upgrade Strategy](#upgrade-strategy)
11. [Frontend Architecture](#frontend-architecture)
12. [Known Tradeoffs](#known-tradeoffs)

---

## System Overview

LumenLock is a decentralized escrow marketplace built on Stellar's Soroban smart contract platform. It enables trustless peer-to-peer commerce for digital products and online services without requiring mutual trust between buyer and seller.

The system is composed of two Soroban smart contracts that communicate via inter-contract calls, a Next.js 15 frontend, and supporting infrastructure.

```
┌─────────────────────────────────────────────────────────────────────┐
│                          LumenLock System                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 15 Frontend                       │   │
│  │  Landing │ Marketplace │ Dashboard │ Activity │ Transactions  │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │ @stellar/stellar-sdk                  │
│                             │ StellarWalletsKit                     │
│                             ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Stellar RPC Layer                          │  │
│  │             (testnet.stellar.validationcloud.io)              │  │
│  └──────────┬───────────────────────────┬────────────────────────┘ │
│             │                           │                           │
│             ▼                           ▼                           │
│  ┌─────────────────────┐   ┌──────────────────────────┐           │
│  │ MarketplaceRegistry │◄──│       EscrowVault        │           │
│  │   (Contract 1)      │   │      (Contract 2)         │           │
│  │                     │   │                           │           │
│  │ - Listing CRUD      │   │ - Escrow state machine    │           │
│  │ - Status tracking   │   │ - Token custody           │           │
│  │ - Active listings   │   │ - Milestone releases      │           │
│  └─────────────────────┘   │ - Dispute arbitration     │           │
│                             └──────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Why Two Contracts

**Decision**: Separate MarketplaceRegistry from EscrowVault rather than a monolithic contract.

**Rationale**:

1. **Separation of concerns**: The registry is a stateless lookup table; the vault is a stateful financial custodian. These have different security profiles, upgrade cadences, and failure modes. Combining them would mean a vault bug requires redeploying the entire registry (with all listing data).

2. **Composability**: Third-party frontends or protocols can query `MarketplaceRegistry` without ever touching escrow funds. The vault contract address can be updated without changing how listings are stored.

3. **Auditability**: Smart contract auditors can review each contract independently. The attack surface of EscrowVault (which holds funds) is bounded and auditable without reading registry code.

4. **Access control boundary**: `MarketplaceRegistry.update_listing_status()` enforces that only the EscrowVault contract address can call it. This creates an explicit, auditable trust relationship between the two contracts.

5. **Future extensibility**: A second vault contract (e.g., a lending-integrated vault) could be authorized on the registry without any registry changes.

**Considered alternatives**:
- *Single contract*: Simpler deploy but entangles fund custody with registry logic. Rejected.
- *Three contracts (add arbitration contract)*: Cleaner arbitration separation but excessive complexity for v1. Named as a future improvement.

---

## Contract State Machine

### EscrowVault States

```
                    ┌─────────────┐
                    │   Created   │ ← open_escrow()
                    └──────┬──────┘
                           │ fund()
                           ▼
                    ┌─────────────┐
                    │   Funded    │
                    └─────┬───┬───┘
                          │   │
        both confirm()    │   │  deadline passed,
              ────────────┘   │  buyer only
              │               │
              ▼               ▼
     ┌─────────────────┐  ┌──────────┐
     │    Released     │  │Refunded  │
     └─────────────────┘  └──────────┘
              │
              │ (if milestone config)
              ▼
     ┌──────────────────────┐
     │  PartiallyReleased   │ ← per milestone confirm()
     └──────────────────────┘
              │ (final milestone)
              ▼
     ┌─────────────────┐
     │    Released     │
     └─────────────────┘

     At any Funded/PartiallyReleased state:
     raise_dispute() →
     ┌─────────────┐
     │  Disputed   │
     └──────┬──────┘
            │ resolve_dispute()
            ▼
     ┌─────────────┐
     │  Resolved   │
     └─────────────┘
```

### State Transition Rules

| From State       | To State           | Function              | Caller       |
|------------------|--------------------|-----------------------|--------------|
| Created          | Funded             | fund()                | buyer        |
| Funded           | Released           | confirm_buyer() + confirm_seller() | buyer + seller |
| Funded           | PartiallyReleased  | confirm_buyer() + confirm_seller() (milestone) | buyer + seller |
| PartiallyReleased| PartiallyReleased  | confirm_buyer() + confirm_seller() (next milestone) | buyer + seller |
| PartiallyReleased| Released           | confirm_buyer() + confirm_seller() (final milestone) | buyer + seller |
| Funded           | Refunded           | claim_refund()        | buyer (after deadline) |
| Funded/PartiallyReleased | Disputed | raise_dispute()     | buyer or seller |
| Disputed         | Resolved           | resolve_dispute()     | arbiter only |

### MarketplaceRegistry Listing Statuses

| Status    | Meaning                                    |
|-----------|--------------------------------------------|
| Active    | Available for purchase                     |
| Locked    | Escrow opened; pending confirmation        |
| Completed | Escrow resolved successfully               |
| Refunded  | Escrow refunded to buyer                   |
| Disputed  | Under arbiter review                       |

---

## Inter-Contract Communication

All inter-contract calls use Soroban's `invoke_contract` host function via the `Client` pattern generated from the contract interface.

### Call Flow: open_escrow()

```
EscrowVault.open_escrow(listing_id, buyer)
    │
    ├─► MarketplaceRegistry.get_listing(listing_id)
    │       Returns: ListingData { price, asset, milestones, seller, ... }
    │
    ├── [validate: listing is Active]
    ├── [create EscrowRecord in storage]
    │
    └─► MarketplaceRegistry.update_listing_status(listing_id, Locked)
            [enforced: only EscrowVault address can call this]
```

### Call Flow: release (final confirmation)

```
EscrowVault.confirm_buyer(escrow_id) or confirm_seller(escrow_id)
    │
    ├── [both flags set → trigger release]
    ├── [transfer tokens to seller via SAC token.transfer()]
    ├── [state = Released]
    │
    └─► MarketplaceRegistry.update_listing_status(listing_id, Completed)
```

### Call Flow: claim_refund()

```
EscrowVault.claim_refund(escrow_id)
    │
    ├── [validate: deadline passed, not confirmed]
    ├── [transfer tokens back to buyer]
    ├── [state = Refunded]
    │
    └─► MarketplaceRegistry.update_listing_status(listing_id, Refunded)
```

### Authorization Model

`MarketplaceRegistry.update_listing_status()` stores the authorized EscrowVault contract address in its `Instance` storage (set during initialization). Any call that doesn't come from that exact address is rejected with `UnauthorizedCaller` before any state mutation.

This prevents:
- Frontend directly calling `update_listing_status()` to mark listings as completed without payment
- A malicious third party impersonating the vault

---

## Storage Design

### Soroban Storage Types Used

| Data              | Contract     | Storage Type | Rationale                                |
|-------------------|--------------|--------------|------------------------------------------|
| Listings          | Registry     | Persistent   | Must survive ledger archival; permanent records |
| Active listing index | Registry  | Persistent   | Iterable index; large potential size     |
| Authorized vault addr | Registry | Instance    | Single value, frequently read, no archival risk |
| Escrow records    | Vault        | Persistent   | Financial data; must never be archived   |
| Admin/arbiter addr| Vault        | Instance     | Single value, config-level               |
| Registry addr     | Vault        | Instance     | Single value, config-level               |
| Listing counter   | Registry     | Instance     | Single monotonic counter                 |
| Escrow counter    | Registry     | Instance     | Single monotonic counter                 |

### TTL Bump Strategy

All persistent storage entries have their TTL bumped on every read and write using:

```rust
env.storage().persistent().extend_ttl(
    &key,
    LEDGER_BUMP_LOW,   // 30 days in ledgers
    LEDGER_BUMP_HIGH,  // 60 days in ledgers
);
```

This ensures data doesn't get archived mid-escrow. On testnet, we use conservative values. For production mainnet, bump thresholds should be calibrated to maximum expected escrow duration.

---

## Asset Support Strategy

LumenLock accepts any Soroban-compatible token that implements the SEP-41 token interface (the `transfer` and `balance` functions). This includes:

- **XLM** via its Stellar Asset Contract (SAC)
- **USDC** via its SAC
- **Custom SAC tokens** from any Stellar asset issuer
- **Custom SEP-41 tokens** deployed as Soroban contracts

**Validation on listing creation**: The registry verifies the token address is a valid Soroban contract (non-zero, valid address format). It does NOT attempt to call the token on listing creation to avoid unnecessary cross-contract calls and potential failures at list time. The vault validates the token at escrow opening by attempting to read the buyer's balance.

**Whitelisting consideration**: For production mainnet, adding an admin-controlled token allowlist is recommended to prevent scam token listings. This is documented as a future improvement.

---

## Milestone Architecture

Milestones are configured on listing creation as a vector of percentage allocations:

```
milestones: Some(vec![30, 70])  // 30% on start, 70% on completion
```

Rules:
- Percentages must sum to 100 (validated on listing creation)
- Each milestone is confirmed independently (both buyer and seller must confirm each stage)
- `current_milestone_index` tracks progress in the escrow record
- Amounts use checked arithmetic: `(total_amount * pct) / 100`

The state advances from `Funded` → `PartiallyReleased` → ... → `Released` as each milestone clears.

---

## Deadline & Time Model

Deadlines are stored as absolute Unix timestamps (seconds since epoch) using `env.ledger().timestamp()` at escrow creation time plus a configured timeout.

**Default timeout**: 7 days (604800 seconds) — configurable per-escrow in future versions.

**Clock drift assumptions**: Stellar validators' clocks are generally accurate to within a few seconds. For deadline purposes (measured in days), this drift is negligible. The system does NOT use ledger sequence numbers for deadlines because sequence number time is less predictable under network congestion.

**Manipulation resistance**: Since Stellar consensus requires supermajority agreement, a single validator cannot manipulate the timestamp to prematurely expire an escrow.

---

## Single Arbiter Design

**Current design**: A single hardcoded admin address stored in `EscrowVault` instance storage acts as the arbiter for all disputes. Only this address can call `resolve_dispute()`.

**Why this is a tradeoff**: This is a known centralization point. If the arbiter address is compromised, the attacker can resolve all disputed escrows in their favor. This is explicitly called out in SECURITY.md.

**Proposed v2 upgrade**:
- Replace single arbiter with a multisig-style voting contract (e.g., 2-of-3 designated arbiters)
- Or integrate a decentralized dispute resolution protocol (e.g., Kleros-style staked jurors)
- The storage key `ARBITER` can be updated via a separate admin function once the upgrade contract is deployed

---

## Upgrade Strategy

Both contracts use Soroban's native `upgrade()` host function with WASM hash-based upgrades:

```rust
pub fn upgrade(env: Env, new_wasm_hash: BytesN<32>) {
    let admin = storage::get_admin(&env);
    admin.require_auth();
    env.deployer().update_current_contract_wasm(new_wasm_hash);
}
```

**Upgrade authority**: The admin address set at initialization. For production, this should be a Stellar multisig account (M-of-N threshold).

**Storage migration**: Soroban upgrades only replace WASM; storage persists. For breaking schema changes:
1. Deploy a migration function that reads old keys and writes new keys
2. Call migration exactly once via a dedicated admin transaction
3. Remove migration function in the next upgrade cycle

**Upgrade safety**: The `open_escrow` function checks the vault contract address stored in the registry. If the vault is upgraded to a new address (not typical — Soroban upgrades in-place), the registry's authorized caller must be updated atomically via a batched transaction.

---

## Frontend Architecture

The frontend follows a strict feature-based layered architecture:

```
App Layer (pages)
    ↓
Component Layer (UI components — no blockchain logic)
    ↓
Hook Layer (React Query hooks — orchestrate services)
    ↓
Service Layer (pure async functions — build transactions)
    ↓
Contract Layer (typed contract clients — invoke Soroban)
    ↓
Stellar SDK + StellarWalletsKit
```

No blockchain logic lives in React components. Components receive data and callbacks via props. This makes testing each layer independently straightforward.

**State management**:
- **Zustand**: Wallet state (address, network, connection status), transaction queue
- **React Query**: All blockchain data (listings, escrow state, balances) with automatic refetch

**Event streaming**:
- RPC `getEvents` polling every 3 seconds for new contract events
- Events parsed and dispatched to activity feed Zustand store
- UI components subscribe to store for real-time updates

---

## Known Tradeoffs

| Tradeoff | Decision | Future Improvement |
|----------|----------|--------------------|
| Single arbiter | Simple to implement; central trust point | Multisig arbitration contract |
| No token whitelist | Any SEP-41 token accepted | Admin-controlled allowlist |
| Fixed 7-day deadline | Predictable; may not fit all use cases | Per-listing deadline configuration |
| No seller reputation | Out of scope for v1 | On-chain rating system using events |
| Sequential milestones | Simpler state machine | Parallel milestone unlocks |
| Polling for events | Simpler than WebSocket subscription | Migrate to streaming RPC when available |
| No dispute evidence storage | On-chain storage expensive | IPFS-linked evidence hashes |
