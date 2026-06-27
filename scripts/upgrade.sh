#!/usr/bin/env bash
# =============================================================================
# LumenLock — Contract Upgrade Script
# =============================================================================
# Upgrades one or both contracts to a new WASM version.
#
# Usage:
#   ./scripts/upgrade.sh [registry|vault|both] [--dry-run]
#
# Prerequisites:
#   - stellar CLI + admin identity configured
#   - deployed-addresses.json exists (from deploy-testnet.sh)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_DIR="$SCRIPT_DIR/../contracts"
ADDRESSES_FILE="$SCRIPT_DIR/../deployed-addresses.json"
NETWORK="testnet"
RPC_URL="${STELLAR_RPC_URL:-https://soroban-testnet.stellar.org}"
NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

DRY_RUN=false
UPGRADE_TARGET="${1:-both}"

if [ "${2:-}" = "--dry-run" ]; then
    DRY_RUN=true
    echo "[DRY RUN] No transactions will be submitted"
fi

# Load deployed addresses
if [ ! -f "$ADDRESSES_FILE" ]; then
    echo "ERROR: $ADDRESSES_FILE not found. Run deploy-testnet.sh first."
    exit 1
fi

REGISTRY_CONTRACT_ID=$(cat "$ADDRESSES_FILE" | python3 -c "import sys,json; print(json.load(sys.stdin)['contracts']['marketplaceRegistry']['contractId'])")
VAULT_CONTRACT_ID=$(cat "$ADDRESSES_FILE" | python3 -c "import sys,json; print(json.load(sys.stdin)['contracts']['escrowVault']['contractId'])")

echo "Upgrading LumenLock contracts..."
echo "  Registry: $REGISTRY_CONTRACT_ID"
echo "  Vault:    $VAULT_CONTRACT_ID"

# Build latest version
cd "$CONTRACTS_DIR"
echo "Building contracts..."
stellar contract build

upgrade_contract() {
    local NAME="$1"
    local WASM_PATH="$2"
    local CONTRACT_ID="$3"
    
    echo ""
    echo "=== Upgrading $NAME ==="
    
    # Upload new WASM
    echo "Uploading new WASM..."
    if [ "$DRY_RUN" = true ]; then
        NEW_HASH="DRY_RUN_HASH"
        echo "[DRY RUN] Would upload: $WASM_PATH"
    else
        NEW_HASH=$(stellar contract upload \
            --wasm "$WASM_PATH" \
            --source admin \
            --network testnet \
            --rpc-url "$RPC_URL" \
            --network-passphrase "$NETWORK_PASSPHRASE")
        echo "New WASM hash: $NEW_HASH"
    fi
    
    # Call upgrade function
    echo "Calling upgrade()..."
    if [ "$DRY_RUN" = true ]; then
        echo "[DRY RUN] Would call: $CONTRACT_ID.upgrade($NEW_HASH)"
    else
        UPGRADE_TX=$(stellar contract invoke \
            --id "$CONTRACT_ID" \
            --source admin \
            --network testnet \
            --rpc-url "$RPC_URL" \
            --network-passphrase "$NETWORK_PASSPHRASE" \
            -- upgrade \
            --new_wasm_hash "$NEW_HASH")
        echo "Upgrade TX: $UPGRADE_TX"
    fi
    
    echo "✓ $NAME upgrade complete"
}

REGISTRY_WASM="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release/lumenlock_marketplace_registry.wasm"
VAULT_WASM="$CONTRACTS_DIR/target/wasm32-unknown-unknown/release/lumenlock_escrow_vault.wasm"

case "$UPGRADE_TARGET" in
    registry)
        upgrade_contract "MarketplaceRegistry" "$REGISTRY_WASM" "$REGISTRY_CONTRACT_ID"
        ;;
    vault)
        upgrade_contract "EscrowVault" "$VAULT_WASM" "$VAULT_CONTRACT_ID"
        ;;
    both)
        upgrade_contract "MarketplaceRegistry" "$REGISTRY_WASM" "$REGISTRY_CONTRACT_ID"
        upgrade_contract "EscrowVault" "$VAULT_WASM" "$VAULT_CONTRACT_ID"
        ;;
    *)
        echo "Usage: $0 [registry|vault|both] [--dry-run]"
        exit 1
        ;;
esac

echo ""
echo "✅ Upgrade complete!"
echo "IMPORTANT: If storage schema changed, run the migration function before use."
echo "See ARCHITECTURE.md for storage migration guidelines."
