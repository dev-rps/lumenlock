/**
 * Transaction Store — Zustand store for transaction lifecycle tracking
 *
 * Tracks all submitted transactions with their status, hash, and errors.
 * Provides the Transaction Center page with its data source.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from './nanoid';
import type { TxRecord, TxStatus } from '../types';

interface TxStore {
  transactions: TxRecord[];
  
  // Actions
  addTransaction: (description: string) => string; // returns tx id
  updateTxHash: (id: string, hash: string, explorerUrl: string) => void;
  updateTxStatus: (id: string, status: TxStatus, error?: string) => void;
  confirmTx: (id: string, hash: string) => void;
  failTx: (id: string, error: string) => void;
  clearCompleted: () => void;
}

export const useTxStore = create<TxStore>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTransaction: (description) => {
        const id = nanoid();
        const tx: TxRecord = {
          id,
          status: 'pending',
          hash: null,
          description,
          createdAt: new Date(),
          confirmedAt: null,
          error: null,
          explorerUrl: null,
        };
        set((state) => ({ transactions: [tx, ...state.transactions].slice(0, 50) }));
        return id;
      },

      updateTxHash: (id, hash, explorerUrl) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, hash, explorerUrl, status: 'processing' as TxStatus } : tx,
          ),
        })),

      updateTxStatus: (id, status, error) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, status, error: error || null } : tx,
          ),
        })),

      confirmTx: (id, hash) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id
              ? { ...tx, status: 'confirmed' as TxStatus, hash, confirmedAt: new Date() }
              : tx,
          ),
        })),

      failTx: (id, error) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, status: 'failed' as TxStatus, error } : tx,
          ),
        })),

      clearCompleted: () =>
        set((state) => ({
          transactions: state.transactions.filter(
            (tx) => tx.status !== 'confirmed' && tx.status !== 'failed',
          ),
        })),
    }),
    {
      name: 'lumenlock-transactions',
      // Store last 20 transactions in localStorage
      partialize: (state) => ({
        transactions: state.transactions.slice(0, 20),
      }),
    },
  ),
);

// ─── Listing Store ────────────────────────────────────────────────────────────

import type { ListingData } from '../types';

interface ListingStore {
  listings: ListingData[];
  selectedListing: ListingData | null;
  setListings: (listings: ListingData[]) => void;
  setSelectedListing: (listing: ListingData | null) => void;
}

export const useListingStore = create<ListingStore>()((set) => ({
  listings: [],
  selectedListing: null,
  setListings: (listings) => set({ listings }),
  setSelectedListing: (listing) => set({ selectedListing: listing }),
}));

// ─── Activity Feed Store ──────────────────────────────────────────────────────

import type { ContractEvent } from '../types';

interface ActivityStore {
  events: ContractEvent[];
  lastLedger: number;
  addEvents: (events: ContractEvent[]) => void;
  setLastLedger: (ledger: number) => void;
  clearEvents: () => void;
}

export const useActivityStore = create<ActivityStore>()((set) => ({
  events: [],
  lastLedger: 0,

  addEvents: (newEvents) =>
    set((state) => {
      const existingIds = new Set(state.events.map((e) => e.id));
      const unique = newEvents.filter((e) => !existingIds.has(e.id));
      return {
        events: [...unique, ...state.events].slice(0, 200), // keep last 200 events
      };
    }),

  setLastLedger: (ledger) => set({ lastLedger: ledger }),
  clearEvents: () => set({ events: [] }),
}));
