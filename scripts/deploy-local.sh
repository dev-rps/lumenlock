#!/usr/bin/env bash
# =============================================================================
# LumenLock — Local Sandbox Deployment Script
# =============================================================================
# Deploys both contracts to a local Stellar quickstart sandbox.
# Prerequisites:
#   - Docker running
#   - stellar CLI installed (cargo install stellar-cli --features opt)
#   - Rust toolchain with wasm32 target
#
# Usage:
#   ./scripts/deploy-local.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_DIR="$SCRIPT_DIR/../contracts"
NETWORK="standalone"
RPC_URL="http://localhost:8000/soroban/rpc"
NETWORK_PASSPHRASE="Standalone Network ; February 2017"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[LumenLock]${NC} $1"; }
success() { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ─── Check Prerequisites ─────────────────────────────────────────────────────

log "Checking prerequisites..."

command -v stellar >/dev/null 2>&1 || error "stellar CLI not found. Install with: cargo install stellar-cli --features opt"
command -v docker >/dev/null 2>&1 || error "Docker not found"
command -v cargo >/dev/null 2>&1 || error "Cargo (Rust) not found"

# Check wasm32 target
rustup target list --installed | grep -q "wasm32-unknown-unknown" || {
    warn "wasm32-unknown-unknown target not installed. Installing..."
    rustup target add wasm32-unknown-unknown
}

success "Prerequisites check passed"

# ─── Start Local Network ─────────────────────────────────────────────────────

log "Starting local Stellar quickstart network..."

if docker ps | grep -q "stellar-quickstart"; then
    warn "Local network already running"
else
    docker run --rm -d \
        --name stellar-quickstart \
        -p 8000:8000 \
        stellar/quickstart:latest \
        --standalone \
        --enable-soroban-rpc
    
    log "Waiting for network to start..."
    sleep 10
fi

success "Local network ready at $RPC_URL"

# ─── Generate Keys ────────────────────────────────────────────────────────────

log "Setting up admin keypair..."

# Check if admin identity exists
if ! stellar keys address admin 2>/dev/null; then
    stellar keys generate admin --network standalone --fund
    success "Admin keypair generated and funded"
else
    warn "Admin identity already exists"
    stellar keys fund admin --network standalone 2>/dev/null || true
fi

ADMIN_ADDRESS=$(stellar keys address admin)
log "Admin address: $ADMIN_ADDRESS"

log "Setting up arbiter keypair..."
if ! stellar keys address arbiter 2>/dev/null; then
    stellar keys generate arbiter --network standalone --fund
    success "Arbiter keypair generated and funded"
else
    warn "Arbiter identity already exists"
fi

ARBITER_ADDRESS=$(stellar keys address arbiter)
log "Arbiter address: $ARBITER_ADDRESS"

# ─── Build Contracts ─────────────────────────────────────────────────────────

log "Building contracts..."

cd "$CONTRACTS_DIR"
stellar contract build

success "Contracts built"

# ─── Deploy MarketplaceRegistry ──────────────────────────────────────────────

log "Deploying MarketplaceRegistry..."

REGISTRY_WASM="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release/lumenlock_marketplace_registry.wasm"

REGISTRY_CONTRACT_ID=$(stellar contract deploy \
    --wasm "$REGISTRY_WASM" \
    --source admin \
    --network standalone \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE")

success "MarketplaceRegistry deployed: $REGISTRY_CONTRACT_ID"

# ─── Deploy EscrowVault ──────────────────────────────────────────────────────

log "Deploying EscrowVault..."

VAULT_WASM="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release/lumenlock_escrow_vault.wasm"

VAULT_CONTRACT_ID=$(stellar contract deploy \
    --wasm "$VAULT_WASM" \
    --source admin \
    --network standalone \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE")

success "EscrowVault deployed: $VAULT_CONTRACT_ID"

# ─── Initialize Contracts ────────────────────────────────────────────────────

log "Initializing MarketplaceRegistry..."

stellar contract invoke \
    --id "$REGISTRY_CONTRACT_ID" \
    --source admin \
    --network standalone \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE" \
    -- initialize \
    --admin "$ADMIN_ADDRESS" \
    --vault_addr "$VAULT_CONTRACT_ID"

success "MarketplaceRegistry initialized"

log "Initializing EscrowVault..."

stellar contract invoke \
    --id "$VAULT_CONTRACT_ID" \
    --source admin \
    --network standalone \
    --rpc-url "$RPC_URL" \
    --network-passphrase "$NETWORK_PASSPHRASE" \
    -- initialize \
    --admin "$ADMIN_ADDRESS" \
    --arbiter "$ARBITER_ADDRESS" \
    --registry_addr "$REGISTRY_CONTRACT_ID"

success "EscrowVault initialized"

# ─── Update .env.local ────────────────────────────────────────────────────────

ENV_FILE="$SCRIPT_DIR/../frontend/.env.local"

log "Fetching native token contract ID..."
XLM_SAC=$(stellar contract id asset --asset native --rpc-url "$RPC_URL" --network-passphrase "$NETWORK_PASSPHRASE")
success "Native XLM token contract ID: $XLM_SAC"

cat > "$ENV_FILE" << EOF
# Auto-generated by deploy-local.sh on $(date)
NEXT_PUBLIC_STELLAR_NETWORK=standalone
NEXT_PUBLIC_STELLAR_RPC_URL=$RPC_URL
NEXT_PUBLIC_STELLAR_HORIZON_URL=http://localhost:8000
NEXT_PUBLIC_NETWORK_PASSPHRASE=$NETWORK_PASSPHRASE
NEXT_PUBLIC_MARKETPLACE_REGISTRY_CONTRACT_ID=$REGISTRY_CONTRACT_ID
NEXT_PUBLIC_ESCROW_VAULT_CONTRACT_ID=$VAULT_CONTRACT_ID
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_EXPLORER_URL=http://localhost:8000
NEXT_PUBLIC_XLM_TOKEN_ADDRESS=$XLM_SAC
EOF

success "Frontend .env.local updated"

# ─── Summary ─────────────────────────────────────────────────────────────────

echo ""
echo "============================================================"
echo -e "${GREEN}LumenLock deployed successfully to local network!${NC}"
echo "============================================================"
echo ""
echo "  MarketplaceRegistry: $REGISTRY_CONTRACT_ID"
echo "  EscrowVault:         $VAULT_CONTRACT_ID"
echo "  Admin:               $ADMIN_ADDRESS"
echo "  Arbiter:             $ARBITER_ADDRESS"
echo ""
echo "  Network RPC:         $RPC_URL"
echo ""
echo "Next steps:"
echo "  1. cd frontend && npm run dev"
echo "  2. Open http://localhost:3000"
echo "============================================================"
