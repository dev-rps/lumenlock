'use client';

import {
  useEscrow,
  useFundEscrow,
  useConfirmBuyer,
  useConfirmSeller,
  useClaimRefund,
  useRaiseDispute,
} from '../hooks/useListings';
import { useWallet } from '../hooks/useWallet';
import {
  formatAmount,
  getEscrowStateLabel,
  getEscrowStateColor,
  getTimeRemaining,
  SUPPORTED_TOKENS,
  type ListingData,
} from '../types';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

function getTokenSymbol(assetAddress: string): string {
  for (const [symbol, info] of Object.entries(SUPPORTED_TOKENS)) {
    if (info.address === assetAddress) return symbol;
  }
  return 'TOKEN';
}

interface EscrowPanelProps {
  listing: ListingData;
  escrowId: bigint;
}

export function EscrowPanel({ listing, escrowId }: EscrowPanelProps) {
  const { address } = useWallet();
  const { data: escrow, isLoading, refetch } = useEscrow(escrowId);
  const fundEscrow = useFundEscrow();
  const confirmBuyer = useConfirmBuyer();
  const confirmSeller = useConfirmSeller();
  const claimRefund = useClaimRefund();
  const raiseDispute = useRaiseDispute();
  const [error, setError] = useState<string | null>(null);

  const isBuyer = address === escrow?.buyer;
  const isSeller = address === escrow?.seller;
  const tokenSymbol = getTokenSymbol(listing.asset);
  const pending =
    fundEscrow.isPending ||
    confirmBuyer.isPending ||
    confirmSeller.isPending ||
    claimRefund.isPending ||
    raiseDispute.isPending;

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
      await refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  if (isLoading || !escrow) {
    return (
      <div className="glass-card p-6 flex items-center gap-2 text-zinc-400">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading escrow #{escrowId.toString()}…
      </div>
    );
  }

  const timeLeft = getTimeRemaining(escrow.deadline);

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          Escrow #{escrow.escrow_id.toString()}
        </h3>
        <span className={`text-sm font-medium ${getEscrowStateColor(escrow.state)}`}>
          {getEscrowStateLabel(escrow.state)}
        </span>
      </div>

      <p className="text-sm text-zinc-400">
        Amount: {formatAmount(escrow.amount)} {tokenSymbol}
        {!timeLeft.expired && escrow.state === 'Funded' && (
          <span className="ml-2 text-zinc-500">
            · Refund in {timeLeft.days}d {timeLeft.hours}h
          </span>
        )}
      </p>

      {error && (
        <p className="text-sm text-red-400 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {isBuyer && escrow.state === 'Created' && (
          <button
            disabled={pending}
            onClick={() => run(() => fundEscrow.mutateAsync({ escrowId }))}
            className="px-4 py-2 rounded-lg brand-gradient text-white text-sm font-medium disabled:opacity-50"
          >
            Fund Escrow
          </button>
        )}
        {isBuyer && (escrow.state === 'Funded' || escrow.state === 'PartiallyReleased') && !escrow.buyer_confirmed && (
          <button
            disabled={pending}
            onClick={() => run(() => confirmBuyer.mutateAsync({ escrowId }))}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
          >
            Confirm Delivery (Buyer)
          </button>
        )}
        {isSeller && (escrow.state === 'Funded' || escrow.state === 'PartiallyReleased') && !escrow.seller_confirmed && (
          <button
            disabled={pending}
            onClick={() => run(() => confirmSeller.mutateAsync({ escrowId }))}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:opacity-50"
          >
            Confirm Delivery (Seller)
          </button>
        )}
        {isBuyer && escrow.state === 'Funded' && timeLeft.expired && (
          <button
            disabled={pending}
            onClick={() => run(() => claimRefund.mutateAsync({ escrowId }))}
            className="px-4 py-2 rounded-lg bg-orange-600 text-white text-sm disabled:opacity-50"
          >
            Claim Refund
          </button>
        )}
        {(isBuyer || isSeller) && (escrow.state === 'Funded' || escrow.state === 'PartiallyReleased') && (
          <button
            disabled={pending}
            onClick={() => run(() => raiseDispute.mutateAsync({ escrowId }))}
            className="px-4 py-2 rounded-lg border border-red-500/40 text-red-400 text-sm disabled:opacity-50"
          >
            Raise Dispute
          </button>
        )}
      </div>
    </div>
  );
}
