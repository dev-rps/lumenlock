/**
 * Wallet Store — Zustand global state for wallet connection
 *
 * Manages wallet connection status, address, network, and error state.
 * This is the single source of truth for wallet state across the entire app.
 * Components read from this store; the StellarWalletsKit service writes to it.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WalletConnectStatus } from '../types';

interface WalletStore {
  // State
  status: WalletConnectStatus;
  address: string | null;
  network: string | null;
  walletId: string | null;
  error: string | null;
  isFreighterInstalled: boolean | null;

  // Actions
  setConnecting: () => void;
  setConnected: (address: string, network: string, walletId: string) => void;
  setDisconnected: () => void;
  setError: (error: string) => void;
  clearError: () => void;
  setFreighterInstalled: (installed: boolean) => void;
  setNetwork: (network: string | null) => void;
}

export const useWalletStore = create<WalletStore>()(
  persist(
    (set) => ({
      // Initial state
      status: 'disconnected',
      address: null,
      network: null,
      walletId: null,
      error: null,
      isFreighterInstalled: null,

      // Actions
      setConnecting: () =>
        set({ status: 'connecting', error: null }),

      setConnected: (address, network, walletId) =>
        set({
          status: 'connected',
          address,
          network,
          walletId,
          error: null,
        }),

      setDisconnected: () =>
        set({
          status: 'disconnected',
          address: null,
          network: null,
          walletId: null,
          error: null,
        }),

      setError: (error) =>
        set({ status: 'error', error }),

      clearError: () =>
        set({ error: null }),

      setFreighterInstalled: (installed) =>
        set({ isFreighterInstalled: installed }),

      setNetwork: (network) =>
        set({ network }),
    }),
    {
      name: 'lumenlock-wallet',
      // Only persist the connection info, not the status (reconnect on load)
      partialize: (state) => ({
        walletId: state.walletId,
        address: state.address,
        network: state.network,
      }),
    },
  ),
);
