/**
 * Maps listing IDs to escrow IDs after open_escrow succeeds.
 * Persisted so buyers can fund/confirm after page reload.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EscrowStore {
  byListing: Record<string, string>;
  setListingEscrow: (listingId: bigint, escrowId: bigint) => void;
  getListingEscrow: (listingId: bigint) => bigint | null;
}

export const useEscrowStore = create<EscrowStore>()(
  persist(
    (set, get) => ({
      byListing: {},

      setListingEscrow: (listingId, escrowId) =>
        set((state) => ({
          byListing: {
            ...state.byListing,
            [listingId.toString()]: escrowId.toString(),
          },
        })),

      getListingEscrow: (listingId) => {
        const id = get().byListing[listingId.toString()];
        return id ? BigInt(id) : null;
      },
    }),
    { name: 'lumenlock-listing-escrows' },
  ),
);
