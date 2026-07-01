'use client';

import { use } from 'react';
import { useListing } from '../../hooks/useListings';
import { useOpenEscrow } from '../../hooks/useListings';
import { useWallet } from '../../hooks/useWallet';
import { useEscrowStore } from '../../state/escrowStore';
import { EscrowPanel } from '../../components/EscrowPanel';
import {
  formatAmount,
  formatAddress,
  SUPPORTED_TOKENS,
} from '../../types';
import {
  ArrowLeft,
  CheckCircle2,
  Milestone,
  AlertTriangle,
  User,
  ExternalLink,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { SealIcon } from '../../components/ui/SealIcon';

function getTokenSymbol(assetAddress: string): string {
  for (const [symbol, info] of Object.entries(SUPPORTED_TOKENS)) {
    if (info.address === assetAddress) return symbol;
  }
  return 'TOKEN';
}

function ListingDetailSkeleton() {
  return (
    <div className="container-narrow" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      <Skeleton height={16} width={120} style={{ marginBottom: 'var(--spacing-4)' }} />
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-6">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <Skeleton height={36} width="70%" />
            <Skeleton height={16} width="40%" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
            <Skeleton height={14} width={40} />
            <Skeleton height={48} width={120} />
          </div>
        </div>
        <div className="ll-card p-6" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Skeleton height={14} width={80} />
          <Skeleton height={16} width="100%" />
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const listingId = BigInt(id);

  const { data: listing, isLoading, error } = useListing(listingId);
  const { address, isConnected, connect } = useWallet();
  const openEscrow = useOpenEscrow();
  const getListingEscrow = useEscrowStore((s) => s.getListingEscrow);
  const escrowId = getListingEscrow(listingId);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';

  const handleOpenEscrow = async () => {
    try {
      const result = await openEscrow.mutateAsync({ listingId });
      const returnedId = result.returnValue != null
        ? BigInt(result.returnValue as string | number | bigint).toString()
        : 'unknown';
      setActionFeedback({
        type: 'success',
        msg: `Escrow #${returnedId} opened. Fund it below to complete your purchase.`,
      });
    } catch (e) {
      setActionFeedback({ type: 'error', msg: String(e instanceof Error ? e.message : e) });
    }
  };

  if (isLoading) return <ListingDetailSkeleton />;

  if (error || !listing) {
    return (
      <div className="container-narrow" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
        <Link
          href="/marketplace"
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: 'var(--color-ink-faint)', marginBottom: 'var(--spacing-4)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-ink-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <ErrorState
          title="Listing not found"
          message={error instanceof Error ? error.message : 'This listing may not exist or has been removed.'}
        />
      </div>
    );
  }

  const tokenSymbol = getTokenSymbol(listing.asset);
  const isSeller = address === listing.seller;

  return (
    <div className="container-narrow" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      {/* Back link */}
      <Link
        href="/marketplace"
        className="flex items-center gap-1.5 text-sm transition-colors w-fit"
        style={{ color: 'var(--color-ink-faint)', marginBottom: 'var(--spacing-4)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6" style={{ marginBottom: 'var(--spacing-4)' }}>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3" style={{ marginBottom: 'var(--spacing-1)' }}>
            <h1
              className="type-display-lg"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
            >
              {listing.title}
            </h1>
            <StatusBadge status={listing.status} />
          </div>
          <div className="flex items-center gap-2">
            <User style={{ width: 14, height: 14, color: 'var(--color-ink-faint)' }} />
            <span className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
              by{' '}
              <a
                href={`${explorerUrl}/account/${listing.seller}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: 'var(--color-trust)', fontFamily: 'var(--font-mono)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust-soft)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
              >
                {formatAddress(listing.seller)}
                <ExternalLink className="inline ml-0.5" style={{ width: 12, height: 12 }} />
              </a>
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="type-caption" style={{ color: 'var(--color-ink-faint)', marginBottom: 'var(--spacing-1)' }}>Price</p>
          <p
            className="type-mono"
            style={{ color: 'var(--color-ink)', fontSize: '2.25rem', fontWeight: 600, lineHeight: 1.1 }}
          >
            {formatAmount(listing.price)}
          </p>
          <p className="type-body-sm" style={{ color: 'var(--color-accent)', marginTop: 'var(--spacing-1)' }}>
            {tokenSymbol}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="ll-card p-6" style={{ marginBottom: 'var(--spacing-3)' }}>
        <p className="type-caption" style={{ color: 'var(--color-ink-faint)', marginBottom: 'var(--spacing-2)' }}>Description</p>
        <p className="type-body whitespace-pre-wrap" style={{ color: 'var(--color-ink)' }}>
          {listing.description}
        </p>
      </div>

      {/* Milestones */}
      {listing.milestone_config && (
        <div className="ll-card p-6" style={{ marginBottom: 'var(--spacing-3)' }}>
          <p className="type-caption flex items-center gap-2" style={{ color: 'var(--color-ink-faint)', marginBottom: 'var(--spacing-3)' }}>
            <Milestone style={{ width: 14, height: 14 }} />
            Payment Milestones
          </p>
          <div className="space-y-2">
            {listing.milestone_config.labels.map((label, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: 'var(--color-surface-sunken)' }}
              >
                <span className="type-body-sm" style={{ color: 'var(--color-ink)' }}>
                  {label}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className="font-semibold text-sm"
                    style={{ color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
                  >
                    {listing.milestone_config!.percentages[i]}%
                  </span>
                  <span className="type-mono-sm" style={{ color: 'var(--color-ink-muted)' }}>
                    = {formatAmount(
                      (listing.price * BigInt(listing.milestone_config!.percentages[i])) / BigInt(100),
                    )}{' '}
                    {tokenSymbol}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Escrow Protection info */}
      <div
        className="ll-card p-6"
        style={{
          backgroundColor: 'var(--color-surface-raised)',
          borderColor: 'var(--color-border-strong)',
          marginBottom: 'var(--spacing-3)',
        }}
      >
        <p className="type-caption flex items-center gap-2" style={{ color: 'var(--color-accent)', marginBottom: 'var(--spacing-3)' }}>
          <Shield style={{ width: 14, height: 14 }} />
          Escrow Protection
        </p>
        <div className="space-y-2">
          {[
            'Funds locked in Soroban smart contract — not held by any company',
            'Release requires BOTH buyer and seller to confirm delivery',
            '7-day refund window if seller doesn\'t confirm',
            'Dispute arbitration available if disagreement arises',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <CheckCircle2
                className="shrink-0"
                style={{ width: 16, height: 16, marginTop: 2, color: 'var(--color-success)' }}
              />
              <span className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback message */}
      {actionFeedback && (
        <div
          className="ll-card p-4 flex items-start gap-3"
          style={{
            backgroundColor: actionFeedback.type === 'success' ? 'var(--color-success-soft)' : 'var(--color-danger-soft)',
            borderColor: actionFeedback.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
            marginBottom: 'var(--spacing-3)',
          }}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="shrink-0" style={{ width: 16, height: 16, marginTop: 2, color: 'var(--color-success)' }} />
          ) : (
            <AlertTriangle className="shrink-0" style={{ width: 16, height: 16, marginTop: 2, color: 'var(--color-danger)' }} />
          )}
          <p
            className="type-body-sm"
            style={{ color: actionFeedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)' }}
          >
            {actionFeedback.msg}
          </p>
        </div>
      )}

      {/* Escrow management panel */}
      {escrowId && listing.status !== 'Active' && (
        <div style={{ marginBottom: 'var(--spacing-3)' }}>
          <EscrowPanel listing={listing} escrowId={escrowId} />
        </div>
      )}

      {/* Purchase actions */}
      {listing.status === 'Active' && (
        <div className="ll-card p-6">
          {!isConnected ? (
            <div className="text-center py-4 flex flex-col items-center" style={{ gap: 'var(--spacing-2)' }}>
              <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
                Connect your wallet to purchase
              </p>
              <button
                onClick={connect}
                className="btn-primary"
                id="listing-connect-wallet-btn"
              >
                Connect Wallet
              </button>
            </div>
          ) : isSeller ? (
            <div className="text-center py-4">
              <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
                This is your listing. Share the link with potential buyers.
              </p>
            </div>
          ) : (
            <div className="flex flex-col" style={{ gap: 'var(--spacing-2)' }}>
              <h3
                className="type-heading"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
              >
                Purchase with Escrow
              </h3>
              <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
                Open an escrow to lock in this purchase. You&apos;ll be prompted to fund it next.
              </p>
              <button
                onClick={handleOpenEscrow}
                disabled={openEscrow.isPending}
                className="btn-primary w-full justify-center"
                style={{ marginTop: 'var(--spacing-1)' }}
                id="open-escrow-btn"
              >
                {openEscrow.isPending ? (
                  <>
                    <SealIcon variant="loading" size={20} />
                    Opening Escrow…
                  </>
                ) : (
                  <>
                    <Shield style={{ width: 18, height: 18 }} />
                    Buy with Escrow — {formatAmount(listing.price)} {tokenSymbol}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
