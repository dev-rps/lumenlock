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
    <div className="container-narrow py-12">
      <Skeleton height={16} width={120} className="mb-8" />
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <Skeleton height={36} width="70%" />
            <Skeleton height={16} width="40%" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton height={14} width={40} />
            <Skeleton height={48} width={120} />
            <Skeleton height={16} width={60} />
          </div>
        </div>
        <div className="ll-card p-6 space-y-3">
          <Skeleton height={14} width={80} />
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="88%" />
          <Skeleton height={16} width="72%" />
        </div>
        <div className="ll-card p-6 space-y-3">
          <Skeleton height={14} width={120} />
          <Skeleton height={80} width="100%" />
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
      <div className="container-narrow py-12">
        <Link
          href="/marketplace"
          className="flex items-center gap-1.5 text-sm mb-8 transition-colors"
          style={{ color: 'var(--color-ink-faint)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-ink-muted)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </Link>
        <ErrorState
          title="Listing not found"
          message={error instanceof Error ? error.message : "This listing may not exist or has been removed."}
        />
      </div>
    );
  }

  const tokenSymbol = getTokenSymbol(listing.asset);
  const isBuyer = address && address !== listing.seller;
  const isSeller = address === listing.seller;

  return (
    <div className="container-narrow py-12">
      {/* Back link */}
      <Link
        href="/marketplace"
        className="flex items-center gap-1.5 text-sm mb-8 transition-colors w-fit"
        style={{ color: 'var(--color-ink-faint)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Marketplace
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1
              className="type-display-lg"
              style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
            >
              {listing.title}
            </h1>
            <StatusBadge status={listing.status} />
          </div>
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5" style={{ color: 'var(--color-ink-faint)' }} />
            <span className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
              by{' '}
              <a
                href={`${explorerUrl}/account/${listing.seller}`}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: 'var(--color-trust)', fontFamily: 'var(--font-mono)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
              >
                {formatAddress(listing.seller)}
                <ExternalLink className="inline w-3 h-3 ml-0.5" />
              </a>
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="type-caption mb-1" style={{ color: 'var(--color-ink-faint)' }}>Price</p>
          <p
            className="font-bold"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontSize: '2.5rem', lineHeight: 1.1 }}
          >
            {formatAmount(listing.price)}
          </p>
          <p className="type-body-sm mt-0.5" style={{ color: 'var(--color-ink-muted)' }}>
            {tokenSymbol}
          </p>
        </div>
      </div>

      {/* Description */}
      <div className="ll-card p-6 mb-5">
        <p className="type-caption mb-3" style={{ color: 'var(--color-ink-faint)' }}>Description</p>
        <p className="type-body whitespace-pre-wrap" style={{ color: 'var(--color-ink)' }}>
          {listing.description}
        </p>
      </div>

      {/* Milestones */}
      {listing.milestone_config && (
        <div className="ll-card p-6 mb-5">
          <p className="type-caption mb-4 flex items-center gap-2" style={{ color: 'var(--color-ink-faint)' }}>
            <Milestone className="w-3.5 h-3.5" />
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
                    style={{ color: 'var(--color-trust)', fontFamily: 'var(--font-mono)' }}
                  >
                    {listing.milestone_config!.percentages[i]}%
                  </span>
                  <span className="type-mono-sm" style={{ color: 'var(--color-ink-muted)' }}>
                    = {formatAmount(
                      listing.price * BigInt(listing.milestone_config!.percentages[i]) / BigInt(100),
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
        className="ll-card p-6 mb-5"
        style={{
          backgroundColor: 'var(--color-trust-soft)',
          borderColor: 'rgba(43,58,143,0.2)',
        }}
      >
        <p className="type-caption mb-4 flex items-center gap-2" style={{ color: 'var(--color-trust)' }}>
          <Shield className="w-3.5 h-3.5" />
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
                className="w-4 h-4 shrink-0 mt-0.5"
                style={{ color: 'var(--color-success)' }}
              />
              <span className="type-body-sm" style={{ color: 'var(--color-trust)' }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Feedback message */}
      {actionFeedback && (
        <div
          className="ll-card p-4 mb-5 flex items-start gap-3"
          style={{
            backgroundColor: actionFeedback.type === 'success' ? 'var(--color-success-soft)' : 'var(--color-danger-soft)',
            borderColor: actionFeedback.type === 'success' ? 'rgba(31,138,77,0.25)' : 'rgba(194,59,59,0.25)',
          }}
        >
          {actionFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-danger)' }} />
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
        <div className="mb-5">
          <EscrowPanel listing={listing} escrowId={escrowId} />
        </div>
      )}

      {/* Purchase actions */}
      {listing.status === 'Active' && (
        <div className="ll-card p-6">
          {!isConnected ? (
            <div className="text-center py-4">
              <p className="type-body-sm mb-5" style={{ color: 'var(--color-ink-muted)' }}>
                Connect your wallet to purchase
              </p>
              <button
                onClick={connect}
                className="btn-primary mx-auto"
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
            <div>
              <h3
                className="type-heading mb-2"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
              >
                Purchase with Escrow
              </h3>
              <p className="type-body-sm mb-5" style={{ color: 'var(--color-ink-muted)' }}>
                Open an escrow to lock in this purchase. You&apos;ll be prompted to fund it next.
              </p>
              <button
                onClick={handleOpenEscrow}
                disabled={openEscrow.isPending}
                className="btn-primary w-full justify-center"
                style={{ padding: '0.875rem 1.5rem', fontSize: '1rem' }}
                id="open-escrow-btn"
              >
                {openEscrow.isPending ? (
                  <>
                    <SealIcon variant="loading" size={20} />
                    Opening Escrow…
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
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
