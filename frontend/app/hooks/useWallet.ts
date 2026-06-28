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
import {
  submitAndWaitForTransaction,
  buildExplorerTxLink,
  type SubmitResult,
} from '../services/stellar';
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
  const {
    status,
    address,
    walletId,
    network,
    error,
    isFreighterInstalled,
    setConnecting,
    setConnected,
    setDisconnected,
    setError,
    clearError,
    setFreighterInstalled,
    setNetwork,
  } = useWalletStore();

  const { addTransaction, updateTxHash, confirmTx, failTx, updateTxStatus } = useTxStore();

  // On mount, check if Freighter is installed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkInstallation = () => {
        const isInstalled = !!(window as any).freighterApi || !!(window as any).stellarPublicKey;
        setFreighterInstalled(isInstalled);
      };
      
      checkInstallation();
      // Also check again shortly in case extension injects late
      const timer = setTimeout(checkInstallation, 1000);
      return () => clearTimeout(timer);
    }
  }, [setFreighterInstalled]);

  /** Helper to verify Freighter is set to TESTNET */
  const checkNetwork = useCallback(async (): Promise<boolean> => {
    ensureInitialized();
    try {
      const netInfo = await StellarWalletsKit.getNetwork();
      const currentNetwork = (netInfo?.network || '').toUpperCase();
      setNetwork(currentNetwork);

      if (currentNetwork !== 'TESTNET') {
        useToastStore.getState().error(
          'Invalid Network',
          `Freighter is connected to ${currentNetwork}. Switch Freighter to Testnet to use LumenLock.`
        );
        return false;
      }
      return true;
    } catch (e) {
      logger.error('wallet.checkNetwork.failed', e);
      return false;
    }
  }, [setNetwork]);

  /** Open the wallet selection modal and connect */
  const connect = useCallback(async () => {
    setConnecting();
    try {
      ensureInitialized();
      const { address: addr } = await StellarWalletsKit.authModal();
      
      const activeModule = StellarWalletsKit.selectedModule;
      const selectedId = activeModule ? activeModule.productId : FREIGHTER_ID;
      
      const netInfo = await StellarWalletsKit.getNetwork().catch(() => null);
      const currentNetwork = (netInfo?.network || 'TESTNET').toUpperCase();
      setNetwork(currentNetwork);

      setConnected(addr, currentNetwork, selectedId);
      logger.info('wallet.connected', { walletId: selectedId, address: addr, network: currentNetwork });

      if (currentNetwork !== 'TESTNET') {
        useToastStore.getState().warning(
          'Switch to Testnet',
          `Freighter is connected to ${currentNetwork}. Switch Freighter to Testnet to use LumenLock.`
        );
      } else {
        useToastStore.getState().success('Wallet Connected', `Logged in as ${addr.slice(0, 4)}...${addr.slice(-4)}`);
      }
    } catch (e) {
      const msg = parseContractError(e);
      if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('declined') || msg.toLowerCase().includes('canceled')) {
        useToastStore.getState().warning('Connection Declined', 'Connection request declined in wallet popup.');
        setDisconnected();
      } else {
        setError(msg);
        logger.error('wallet.connect.failed', e);
      }
    }
  }, [setConnecting, setConnected, setDisconnected, setError, setNetwork]);

  /** Disconnect the wallet */
  const disconnect = useCallback(async () => {
    ensureInitialized();
    await StellarWalletsKit.disconnect().catch(() => {});
    setDisconnected();
    logger.info('wallet.disconnected');
    useToastStore.getState().info('Wallet Disconnected', 'Logged out successfully.');
  }, [setDisconnected]);

  /**
   * Sign an XDR transaction and submit it to the network.
   * Returns the transaction hash on success.
   * Updates the global transaction store throughout the lifecycle.
   */
  const signAndSubmit = useCallback(
    async (xdr: string, description: string): Promise<SubmitResult> => {
      if (!address) throw new Error('Wallet not connected');

      const txId = addTransaction(description);

      try {
        ensureInitialized();

        // 1. Re-check network before signing
        updateTxStatus(txId, 'pending');
        const isCorrectNetwork = await checkNetwork();
        if (!isCorrectNetwork) {
          throw new Error('Switch Freighter to Testnet to use LumenLock.');
        }

        // 2. Awaiting Signature State
        updateTxStatus(txId, 'pending'); // UI displays: Awaiting Signature
        
        // Sign
        const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
          address,
          networkPassphrase: process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015',
        });

        logger.info('wallet.signTransaction.success', { txId, description });

        // 3. Submitting State
        updateTxStatus(txId, 'processing'); // UI displays: Submitting
        
        // Submit and wait for confirmation
        const result = await submitAndWaitForTransaction(signedTxXdr);
        const hash = result.txHash || '';
        const explorerUrl = buildExplorerTxLink(hash);

        updateTxHash(txId, hash, explorerUrl);
        confirmTx(txId, hash);
        useToastStore.getState().success('Transaction Confirmed', description);

        logger.info('wallet.submitTransaction.success', { hash, description });
        return result;
      } catch (e) {
        const msg = parseContractError(e);
        failTx(txId, msg);
        
        let displayError = msg;
        if (msg.toLowerCase().includes('user rejected') || msg.toLowerCase().includes('declined') || msg.toLowerCase().includes('canceled')) {
          displayError = 'Signature rejected in Freighter';
        }
        
        useToastStore.getState().error('Transaction Failed', displayError);
        logger.error('wallet.submitTransaction.failed', e, { txId, description });
        throw new Error(displayError);
      }
    },
    [address, addTransaction, updateTxHash, confirmTx, failTx, updateTxStatus, checkNetwork],
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
            StellarWalletsKit.getNetwork().then((netInfo) => {
              const currentNetwork = (netInfo?.network || 'TESTNET').toUpperCase();
              setNetwork(currentNetwork);
              setConnected(addr, currentNetwork, stored.walletId || '');
            }).catch(() => {
              setConnected(addr, 'TESTNET', stored.walletId || '');
            });
          } else {
            setDisconnected();
          }
        }).catch(() => {
          setDisconnected();
        });
      } catch {
        setDisconnected();
      }
    }
  }, [setConnected, setDisconnected, setNetwork, status]);

  return {
    status,
    address,
    walletId,
    network,
    error,
    isFreighterInstalled,
    isConnected: status === 'connected',
    isTestnet: network === 'TESTNET',
    connect,
    disconnect,
    signAndSubmit,
    clearError,
  };
}
