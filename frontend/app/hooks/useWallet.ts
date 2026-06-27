/**
 * useWallet — React hook for wallet connection management
 *
 * Provides connect, disconnect, and sign functions using StellarWalletsKit.
 * Persists wallet identity across sessions. Handles all wallet-specific errors
 * with human-readable messages.
 *
 * Usage:
 *   const { address, status, connect, disconnect, signXdr } = useWallet();
 */

'use client';

import { useCallback, useEffect } from 'react';
import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils';
import { useWalletStore } from '../state/walletStore';
import { logger, parseContractError } from '../services/observability';
import { submitAndWaitForTransaction, buildExplorerTxLink } from '../services/stellar';
import { useTxStore } from '../state/txStore';
import { useToastStore } from '../state/toastStore';

const NETWORK = (process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet').toLowerCase();

function getWalletNetwork(): string {
  switch (NETWORK) {
    case 'mainnet': return Networks.PUBLIC;
    case 'futurenet': return Networks.FUTURENET;
    default: return Networks.TESTNET;
  }
}

let isInitialized = false;

function ensureInitialized() {
  if (!isInitialized) {
    try {
      StellarWalletsKit.init({
        network: getWalletNetwork() as any,
        selectedWalletId: FREIGHTER_ID,
        modules: defaultModules(),
      });
      isInitialized = true;
    } catch (e) {
      logger.error('wallet.init.failed', e);
    }
  }
}

export function useWallet() {
  const { status, address, walletId, error, setConnecting, setConnected, setDisconnected, setError, clearError } =
    useWalletStore();
  const { addTransaction, updateTxHash, confirmTx, failTx } = useTxStore();

  /** Open the wallet selection modal and connect */
  const connect = useCallback(async () => {
    setConnecting();
    try {
      ensureInitialized();
      const { address: addr } = await StellarWalletsKit.authModal();
      
      const activeModule = StellarWalletsKit.selectedModule;
      const selectedId = activeModule ? activeModule.productId : FREIGHTER_ID;
      
      const networkPassphrase = process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015';
      setConnected(addr, networkPassphrase, selectedId);
      logger.info('wallet.connected', { walletId: selectedId, address: addr });
    } catch (e) {
      const msg = parseContractError(e);
      setError(msg);
      logger.error('wallet.connect.failed', e);
    }
  }, [setConnecting, setConnected, setError]);

  /** Disconnect the wallet */
  const disconnect = useCallback(async () => {
    ensureInitialized();
    await StellarWalletsKit.disconnect().catch(() => {});
    setDisconnected();
    logger.info('wallet.disconnected');
  }, [setDisconnected]);

  /**
   * Sign an XDR transaction and submit it to the network.
   * Returns the transaction hash on success.
   * Updates the global transaction store throughout the lifecycle.
   */
  const signAndSubmit = useCallback(
    async (xdr: string, description: string): Promise<string> => {
      if (!address) throw new Error('Wallet not connected');

      const txId = addTransaction(description);

      try {
        ensureInitialized();

        // Sign
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
          address,
          networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
        });

        logger.info('wallet.signTransaction.success', { txId, description });

        // Submit and wait for confirmation
        const result = await submitAndWaitForTransaction(signedTxXdr);
        const hash = result.txHash || '';
        const explorerUrl = buildExplorerTxLink(hash);

        updateTxHash(txId, hash, explorerUrl);
        confirmTx(txId, hash);
        useToastStore.getState().success('Transaction Confirmed', description);

        logger.info('wallet.submitTransaction.success', { hash, description });
        return hash;
      } catch (e) {
        const msg = parseContractError(e);
        failTx(txId, msg);
        useToastStore.getState().error('Transaction Failed', msg);
        logger.error('wallet.submitTransaction.failed', e, { txId, description });
        throw new Error(msg);
      }
    },
    [address, addTransaction, updateTxHash, confirmTx, failTx],
  );

  // Auto-reconnect if wallet was previously connected
  useEffect(() => {
    const stored = useWalletStore.getState();
    if (stored.walletId && stored.address && status === 'disconnected') {
      try {
        ensureInitialized();
        StellarWalletsKit.setWallet(stored.walletId);
        StellarWalletsKit.getAddress().then(({ address: addr }) => {
          if (addr === stored.address) {
            setConnected(addr, stored.network || '', stored.walletId || '');
          }
        }).catch(() => {
          // Silent fail — user can reconnect manually
        });
      } catch {
        // Ignore
      }
    }
  }, [setConnected, status]);

  return {
    status,
    address,
    walletId,
    error,
    isConnected: status === 'connected',
    connect,
    disconnect,
    signAndSubmit,
    clearError,
  };
}
