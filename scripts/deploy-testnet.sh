#!/usr/bin/env bash
# =============================================================================
# LumenLock — Testnet Deployment Script
# =============================================================================
# Deploys both contracts to Stellar Testnet.
#
# Prerequisites:
#   - stellar CLI installed
#   - Rust + wasm32 target
#   - ADMIN_SECRET_KEY set in environment (or ~/.stellar/identity/admin)
#
# Usage:
#   export ADMIN_SECRET_KEY="S..."   # Testnet admin secret
#   ./scripts/deploy-testnet.sh
#
# The script will:
#   1. Build both contracts
#   2. Upload WASM to network
#   3. Deploy MarketplaceRegistry
#   4. Deploy EscrowVault
#   5. Initialize both with cross-contract trust
#   6. Print contract addresses and save to .env.testnet
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_DIR="$SCRIPT_DIR/../contracts"
NETWORK="testnet"
RPC_URL="${STELLAR_RPC_URL:-https://soroban-testnet.stellar.org}"
HORIZON_URL="https://horizon-testnet.stellar.org"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log() { echo -e "${BLUE}[LumenLock]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ─── Prerequisites ────────────────────────────────────────────────────────────

log "Checking prerequisites..."
command -v stellar >/dev/null 2>&1 || error "stellar CLI not found"
command -v cargo >/dev/null 2>&1 || error "Cargo not found"
rustup target list --installed | grep -q "wasm32-unknown-unknown" || rustup target add wasm32-unknown-unknown

# ─── Setup Identities ─────────────────────────────────────────────────────────

log "Setting up admin identity..."

if [ -n "${ADMIN_SECRET_KEY:-}" ]; then
    echo "$ADMIN_SECRET_KEY" | stellar keys add admin --secret-key
    success "Admin identity loaded from ADMIN_SECRET_KEY"
elif ! stellar keys address admin 2>/dev/null; then
    warn "No admin identity found. Generating a new funded testnet keypair..."
    stellar keys generate admin --network testnet --fund
    warn "IMPORTANT: Save this secret key! Run: stellar keys show admin"
    success "Admin identity generated"
fi

ADMIN_ADDRESS=$(stellar keys address admin)
log "Admin address: $ADMIN_ADDRESS"

log "Setting up arbiter identity..."
if ! stellar keys address arbiter 2>/dev/null; then
    stellar keys generate arbiter --network testnet --fund
    success "Arbiter identity generated"
fi
ARBITER_ADDRESS=$(stellar keys address arbiter)
log "Arbiter address: $ARBITER_ADDRESS"

# ─── Fund Accounts (if needed) ────────────────────────────────────────────────

log "Ensuring admin account is funded..."
stellar keys fund admin --network testnet 2>/dev/null || warn "Could not fund via friendbot (may already be funded)"

log "Ensuring arbiter account is funded..."
stellar keys fund arbiter --network testnet 2>/dev/null || warn "Could not fund arbiter (may already be funded)"

# ─── Build ────────────────────────────────────────────────────────────────────

log "Building contracts in release mode..."
cd "$CONTRACTS_DIR"
stellar contract build

REGISTRY_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/lumenlock_marketplace_registry.wasm"
VAULT_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/lumenlock_escrow_vault.wasm"

[ -f "$REGISTRY_WASM" ] || error "Registry WASM not found after build"
[ -f "$VAULT_WASM" ] || error "Vault WASM not found after build"

success "Contracts built"
log "Registry WASM size: $(du -sh "$REGISTRY_WASM" | cut -f1)"
log "Vault WASM size: $(du -sh "$VAULT_WASM" | cut -f1)"

# ─── Upload WASMs ─────────────────────────────────────────────────────────────

log "Uploading MarketplaceRegistry WASM to testnet..."
REGISTRY_WASM_HASH=$(stellar contract upload \
    --wasm "$REGISTRY_WASM" \
    --source admin \
    --network testnet \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE")
success "Registry WASM hash: $REGISTRY_WASM_HASH"

log "Uploading EscrowVault WASM to testnet..."
VAULT_WASM_HASH=$(stellar contract upload \
    --wasm "$VAULT_WASM" \
    --source admin \
    --network testnet \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE")
success "Vault WASM hash: $VAULT_WASM_HASH"

# ─── Deploy ───────────────────────────────────────────────────────────────────

log "Deploying MarketplaceRegistry..."
REGISTRY_CONTRACT_ID=$(stellar contract deploy \
    --wasm-hash "$REGISTRY_WASM_HASH" \
    --source admin \
    --network testnet \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE")
success "MarketplaceRegistry: $REGISTRY_CONTRACT_ID"

log "Deploying EscrowVault..."
VAULT_CONTRACT_ID=$(stellar contract deploy \
    --wasm-hash "$VAULT_WASM_HASH" \
    --source admin \
    --network testnet \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE")
success "EscrowVault: $VAULT_CONTRACT_ID"

# ─── Initialize ───────────────────────────────────────────────────────────────

log "Initializing MarketplaceRegistry (with vault address for access control)..."
INIT_REGISTRY_TX=$(stellar contract invoke \
    --id "$REGISTRY_CONTRACT_ID" \
    --source admin \
    --network testnet \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE" \
    -- initialize \
    --admin "$ADMIN_ADDRESS" \
    --vault_addr "$VAULT_CONTRACT_ID")
success "Registry initialized. TX: $INIT_REGISTRY_TX"

log "Initializing EscrowVault (with registry and arbiter addresses)..."
INIT_VAULT_TX=$(stellar contract invoke \
    --id "$VAULT_CONTRACT_ID" \
    --source admin \
    --network testnet \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE" \
    -- initialize \
    --admin "$ADMIN_ADDRESS" \
    --arbiter "$ARBITER_ADDRESS" \
    --registry_addr "$REGISTRY_CONTRACT_ID")
success "Vault initialized. TX: $INIT_VAULT_TX"

# ─── Verify Deployment ────────────────────────────────────────────────────────

log "Verifying deployment..."

VAULT_CHECK=$(stellar contract invoke \
    --id "$REGISTRY_CONTRACT_ID" \
    --source admin \
    --network testnet \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE" \
    -- get_vault_address)

if echo "$VAULT_CHECK" | grep -q "$VAULT_CONTRACT_ID"; then
    success "Cross-contract trust verified: Registry knows Vault address"
else
    warn "Vault address verification returned: $VAULT_CHECK"
fi

# ─── Save Configuration ───────────────────────────────────────────────────────

ENV_FILE="$SCRIPT_DIR/../frontend/.env.testnet"
ADDRESSES_FILE="$SCRIPT_DIR/../deployed-addresses.json"

cat > "$ENV_FILE" << EOF
# Auto-generated by deploy-testnet.sh on $(date -u +"%Y-%m-%dT%H:%M:%SZ")
NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
NEXT_PUBLIC_SOROBAN_RPC_URL=$RPC_URL
NEXT_PUBLIC_HORIZON_URL=$HORIZON_URL
NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_ARBITER_ADDRESS=$ARBITER_ADDRESS
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ID=$REGISTRY_CONTRACT_ID
NEXT_PUBLIC_ESCROW_VAULT_CONTRACT_ID=$VAULT_CONTRACT_ID
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_EXPLORER_URL=https://stellar.expert/explorer/testnet
NEXT_PUBLIC_XLM_TOKEN_ADDRESS="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
NEXT_PUBLIC_USDC_TOKEN_ADDRESS="CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA"
EOF

cat > "$ADDRESSES_FILE" << EOF
{
  "network": "testnet",
  "deployedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "admin": "$ADMIN_ADDRESS",
  "arbiter": "$ARBITER_ADDRESS",
  "contracts": {
    "marketplaceRegistry": {
      "contractId": "$REGISTRY_CONTRACT_ID",
      "wasmHash": "$REGISTRY_WASM_HASH",
      "initTxHash": "$INIT_REGISTRY_TX"
    },
    "escrowVault": {
      "contractId": "$VAULT_CONTRACT_ID",
      "wasmHash": "$VAULT_WASM_HASH",
      "initTxHash": "$INIT_VAULT_TX"
    }
  },
  "explorerLinks": {
    "marketplaceRegistry": "https://stellar.expert/explorer/testnet/contract/$REGISTRY_CONTRACT_ID",
    "escrowVault": "https://stellar.expert/explorer/testnet/contract/$VAULT_CONTRACT_ID"
  }
}
EOF

success "Configuration saved to $ENV_FILE and $ADDRESSES_FILE"

# Copy to frontend .env.local for development use
cp "$ENV_FILE" "$SCRIPT_DIR/../frontend/.env.local"
success "Copied to frontend/.env.local"

# ─── Summary ─────────────────────────────────────────────────────────────────

echo ""
echo "============================================================"
echo -e "${GREEN}✅ LumenLock deployed to Stellar Testnet!${NC}"
echo "============================================================"
echo ""
echo "  MarketplaceRegistry: $REGISTRY_CONTRACT_ID"
echo "    Explorer: https://stellar.expert/explorer/testnet/contract/$REGISTRY_CONTRACT_ID"
echo ""
echo "  EscrowVault: $VAULT_CONTRACT_ID"
echo "    Explorer: https://stellar.expert/explorer/testnet/contract/$VAULT_CONTRACT_ID"
echo ""
echo "  Admin:   $ADMIN_ADDRESS"
echo "  Arbiter: $ARBITER_ADDRESS"
echo ""
echo "Next steps:"
echo "  1. Copy frontend/.env.testnet to frontend/.env.local"
echo "  2. Update README.md with contract addresses"
echo "  3. cd frontend && npm run dev"
echo ""
echo "Update README.md contract addresses section with:"
echo "  - MarketplaceRegistry: $REGISTRY_CONTRACT_ID"
echo "  - EscrowVault: $VAULT_CONTRACT_ID"
echo "============================================================"
