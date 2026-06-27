/**
 * useListings — React Query hooks for marketplace listing data
 */
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getActiveListings, getListing, buildCreateListingTx } from '../services/contract';
import { useWallet } from './useWallet';
import { toStroops } from '../types';
import type { ListingData, CreateListingForm } from '../types';

/** Query key factory */
export const listingKeys = {
  all: ['listings'] as const,
  active: () => [...listingKeys.all, 'active'] as const,
  detail: (id: bigint) => [...listingKeys.all, 'detail', id.toString()] as const,
};

/** Hook: fetch all active listings with their full data */
export function useActiveListings() {
  return useQuery({
    queryKey: listingKeys.active(),
    queryFn: async (): Promise<ListingData[]> => {
      const ids = await getActiveListings();
      const listings = await Promise.all(ids.map((id) => getListing(id)));
      return listings;
    },
    refetchInterval: 10_000, // Refetch every 10s
    staleTime: 5_000,
  });
}

/** Hook: fetch a single listing by ID */
export function useListing(listingId: bigint | null) {
  return useQuery({
    queryKey: listingKeys.detail(listingId ?? BigInt(0)),
    queryFn: () => getListing(listingId!),
    enabled: listingId !== null,
    staleTime: 5_000,
  });
}

/** Hook: create a new listing mutation */
export function useCreateListing() {
  const { address, signAndSubmit } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: CreateListingForm) => {
      if (!address) throw new Error('Wallet not connected');

      const priceStroops = toStroops(form.price);

      const milestoneConfig = form.useMilestones && form.milestones.length > 0
        ? {
            percentages: form.milestones.map((m) => m.percentage),
            labels: form.milestones.map((m) => m.label),
          }
        : undefined;

      const txXdr = await buildCreateListingTx({
        seller: address,
        title: form.title,
        description: form.description,
        price: priceStroops,
        asset: form.assetSymbol, // asset address from token info
        milestoneConfig,
      });

      return signAndSubmit(txXdr, `Create listing: ${form.title}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: listingKeys.active() });
    },
  });
}

/**
 * useEscrow — React Query hooks for escrow operations
 */

import {
  getEscrow,
  buildOpenEscrowTx,
  buildFundTx,
  buildConfirmBuyerTx,
  buildConfirmSellerTx,
  buildClaimRefundTx,
  buildRaiseDisputeTx,
} from '../services/contract';
import type { EscrowRecord } from '../types';

export const escrowKeys = {
  all: ['escrows'] as const,
  detail: (id: bigint) => [...escrowKeys.all, 'detail', id.toString()] as const,
};

export function useEscrow(escrowId: bigint | null) {
  return useQuery({
    queryKey: escrowKeys.detail(escrowId ?? BigInt(0)),
    queryFn: () => getEscrow(escrowId!),
    enabled: escrowId !== null,
    refetchInterval: 5_000,
    staleTime: 3_000,
  });
}

export function useOpenEscrow() {
  const { address, signAndSubmit } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listingId }: { listingId: bigint }) => {
      if (!address) throw new Error('Wallet not connected');
      const txXdr = await buildOpenEscrowTx({ listingId, buyer: address });
      return signAndSubmit(txXdr, `Open escrow for listing #${listingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.all });
      queryClient.invalidateQueries({ queryKey: listingKeys.active() });
    },
  });
}

export function useFundEscrow() {
  const { address, signAndSubmit } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ escrowId }: { escrowId: bigint }) => {
      if (!address) throw new Error('Wallet not connected');
      const txXdr = await buildFundTx({ escrowId, buyer: address });
      return signAndSubmit(txXdr, `Fund escrow #${escrowId}`);
    },
    onSuccess: (_data, { escrowId }) => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.detail(escrowId) });
    },
  });
}

export function useConfirmBuyer() {
  const { address, signAndSubmit } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ escrowId }: { escrowId: bigint }) => {
      if (!address) throw new Error('Wallet not connected');
      const txXdr = await buildConfirmBuyerTx({ escrowId, buyer: address });
      return signAndSubmit(txXdr, `Confirm delivery (buyer) for escrow #${escrowId}`);
    },
    onSuccess: (_data, { escrowId }) => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.detail(escrowId) });
    },
  });
}

export function useConfirmSeller() {
  const { address, signAndSubmit } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ escrowId }: { escrowId: bigint }) => {
      if (!address) throw new Error('Wallet not connected');
      const txXdr = await buildConfirmSellerTx({ escrowId, seller: address });
      return signAndSubmit(txXdr, `Confirm delivery (seller) for escrow #${escrowId}`);
    },
    onSuccess: (_data, { escrowId }) => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.detail(escrowId) });
    },
  });
}

export function useClaimRefund() {
  const { address, signAndSubmit } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ escrowId }: { escrowId: bigint }) => {
      if (!address) throw new Error('Wallet not connected');
      const txXdr = await buildClaimRefundTx({ escrowId, buyer: address });
      return signAndSubmit(txXdr, `Claim refund for escrow #${escrowId}`);
    },
    onSuccess: (_data, { escrowId }) => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.detail(escrowId) });
    },
  });
}

export function useRaiseDispute() {
  const { address, signAndSubmit } = useWallet();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ escrowId }: { escrowId: bigint }) => {
      if (!address) throw new Error('Wallet not connected');
      const txXdr = await buildRaiseDisputeTx({ escrowId, caller: address });
      return signAndSubmit(txXdr, `Raise dispute for escrow #${escrowId}`);
    },
    onSuccess: (_data, { escrowId }) => {
      queryClient.invalidateQueries({ queryKey: escrowKeys.detail(escrowId) });
      queryClient.invalidateQueries({ queryKey: listingKeys.active() });
    },
  });
}
