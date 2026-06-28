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
  getTimeRemaining,
  SUPPORTED_TOKENS,
  type ListingData,
} from '../types';
import { AlertTriangle, Clock } from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from './ui/StatusBadge';
import { Skeleton } from './ui/Skeleton';
import { SealIcon } from './ui/SealIcon';

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
      <div className="ll-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton height={20} width={120} />
          <Skeleton height={22} width={80} style={{ borderRadius: 9999 }} />
        </div>
        <Skeleton height={16} width="60%" />
        <div className="flex gap-2">
          <Skeleton height={36} width={110} style={{ borderRadius: 8 }} />
          <Skeleton height={36} width={110} style={{ borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  const timeLeft = getTimeRemaining(escrow.deadline);

  return (
    <div className="ll-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-trust-soft)' }}
          >
            <SealIcon variant="static" size={20} />
          </div>
          <h3
            className="font-semibold"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-ui)' }}
          >
            Escrow #{escrow.escrow_id.toString()}
          </h3>
        </div>
        <StatusBadge status={escrow.state} />
      </div>

      {/* Amount + deadline */}
      <div className="flex items-center gap-6 flex-wrap">
        <div>
          <p className="type-caption mb-0.5" style={{ color: 'var(--color-ink-faint)' }}>
            Amount
          </p>
          <p
            className="font-semibold text-lg"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
          >
            {formatAmount(escrow.amount)} {tokenSymbol}
          </p>
        </div>
        {!timeLeft.expired && escrow.state === 'Funded' && (
          <div>
            <p className="type-caption mb-0.5" style={{ color: 'var(--color-ink-faint)' }}>
              Refund window
            </p>
            <p className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-warning)' }}>
              <Clock className="w-3.5 h-3.5" />
              {timeLeft.days}d {timeLeft.hours}h remaining
            </p>
          </div>
        )}
        {timeLeft.expired && escrow.state === 'Funded' && (
          <div
            className="px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5"
            style={{
              backgroundColor: 'var(--color-warning-soft)',
              color: 'var(--color-warning)',
            }}
          >
            <Clock className="w-3.5 h-3.5" />
            Refund window expired
          </div>
        )}
      </div>

      {/* Confirmation status */}
      {(escrow.state === 'Funded' || escrow.state === 'PartiallyReleased') && (
        <div
          className="flex items-center gap-4 p-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-surface-sunken)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: escrow.buyer_confirmed
                  ? 'var(--color-success)'
                  : 'var(--color-border)',
              }}
            />
            <span className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
              Buyer {escrow.buyer_confirmed ? 'confirmed' : 'pending'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: escrow.seller_confirmed
                  ? 'var(--color-success)'
                  : 'var(--color-border)',
              }}
            />
            <span className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
              Seller {escrow.seller_confirmed ? 'confirmed' : 'pending'}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="p-3 rounded-lg flex items-start gap-2"
          style={{ backgroundColor: 'var(--color-danger-soft)' }}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-danger)' }} />
          <p className="type-body-sm" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {isBuyer && escrow.state === 'Created' && (
          <button
            disabled={pending}
            onClick={() => run(() => fundEscrow.mutateAsync({ escrowId }))}
            className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            {fundEscrow.isPending ? (
              <><SealIcon variant="loading" size={16} /> Funding…</>
            ) : (
              'Fund Escrow'
            )}
          </button>
        )}

        {isBuyer &&
          (escrow.state === 'Funded' || escrow.state === 'PartiallyReleased') &&
          !escrow.buyer_confirmed && (
            <button
              disabled={pending}
              onClick={() => run(() => confirmBuyer.mutateAsync({ escrowId }))}
              className="btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-success-soft)',
                color: 'var(--color-success)',
                borderColor: 'rgba(31,138,77,0.3)',
              }}
            >
              {confirmBuyer.isPending ? 'Confirming…' : 'Confirm Delivery (Buyer)'}
            </button>
          )}

        {isSeller &&
          (escrow.state === 'Funded' || escrow.state === 'PartiallyReleased') &&
          !escrow.seller_confirmed && (
            <button
              disabled={pending}
              onClick={() => run(() => confirmSeller.mutateAsync({ escrowId }))}
              className="btn-secondary"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                backgroundColor: 'var(--color-success-soft)',
                color: 'var(--color-success)',
                borderColor: 'rgba(31,138,77,0.3)',
              }}
            >
              {confirmSeller.isPending ? 'Confirming…' : 'Confirm Delivery (Seller)'}
            </button>
          )}

        {isBuyer && escrow.state === 'Funded' && timeLeft.expired && (
          <button
            disabled={pending}
            onClick={() => run(() => claimRefund.mutateAsync({ escrowId }))}
            className="btn-ghost"
            style={{
              padding: '0.5rem 1rem',
              fontSize: '0.875rem',
              color: 'var(--color-warning)',
              borderColor: 'rgba(181,121,10,0.3)',
            }}
          >
            {claimRefund.isPending ? 'Processing…' : 'Claim Refund'}
          </button>
        )}

        {(isBuyer || isSeller) &&
          (escrow.state === 'Funded' || escrow.state === 'PartiallyReleased') && (
            <button
              disabled={pending}
              onClick={() => run(() => raiseDispute.mutateAsync({ escrowId }))}
              className="btn-ghost"
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                color: 'var(--color-danger)',
                borderColor: 'rgba(194,59,59,0.3)',
              }}
            >
              {raiseDispute.isPending ? 'Raising…' : 'Raise Dispute'}
            </button>
          )}
      </div>
    </div>
  );
}
