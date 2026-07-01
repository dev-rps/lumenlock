'use client';

import { useActiveListings } from '../hooks/useListings';
import { useWallet } from '../hooks/useWallet';
import {
  formatAmount,
  formatAddress,
  SUPPORTED_TOKENS,
  type ListingData,
} from '../types';
import { Search, Plus, Milestone, ArrowRight, User } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

function getTokenSymbol(assetAddress: string): string {
  for (const [symbol, info] of Object.entries(SUPPORTED_TOKENS)) {
    if (info.address === assetAddress) return symbol;
  }
  return 'TOKEN';
}

// ─── Listing Card ─────────────────────────────────────────────────────────────
function ListingCard({ listing }: { listing: ListingData }) {
  const tokenSymbol = getTokenSymbol(listing.asset);
  const hasMilestones = !!listing.milestone_config;
  const priceDisplay = `${formatAmount(listing.price)} ${tokenSymbol}`;

  return (
    <div
      className="ll-card ll-card-hover flex flex-col gap-4 group"
      style={{ cursor: 'default', padding: 'var(--spacing-3)' }}
    >
      {/* Header row: title + badges */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold truncate mb-1 transition-colors"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-ink)',
              fontSize: '1.05rem',
            }}
          >
            {listing.title}
          </h3>
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" style={{ color: 'var(--color-ink-faint)' }} />
            <span
              className="text-xs"
              style={{ color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}
            >
              {formatAddress(listing.seller)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={listing.status} />
          {hasMilestones && (
            <span
              className="badge-base"
              style={{
                backgroundColor: 'var(--color-trust-soft)',
                color: 'var(--color-trust)',
                border: '1px solid rgba(43,58,143,0.15)',
              }}
            >
              <Milestone className="w-3 h-3" />
              Milestones
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p
        className="type-body-sm line-clamp-2 leading-relaxed flex-1"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        {listing.description}
      </p>

      {/* Footer: price + CTA */}
      <div
        className="flex items-center justify-between pt-4"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <div>
          <p className="type-caption mb-0.5" style={{ color: 'var(--color-ink-faint)' }}>
            Price
          </p>
          <p
            className="font-semibold text-xl"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
          >
            {priceDisplay}
          </p>
        </div>
        {listing.status === 'Active' && (
          <Link
            href={`/marketplace/${listing.listing_id}`}
            className="btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
          >
            Buy Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function ListingCardSkeleton() {
  return (
    <div className="ll-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <Skeleton height={20} width="75%" />
          <Skeleton height={14} width="45%" />
        </div>
        <Skeleton height={22} width={64} style={{ borderRadius: 9999 }} />
      </div>
      <div className="space-y-2">
        <Skeleton height={14} width="100%" />
        <Skeleton height={14} width="80%" />
      </div>
      <div
        className="pt-4 flex items-center justify-between"
        style={{ borderTop: '1px solid var(--color-surface-sunken)' }}
      >
        <div className="space-y-1">
          <Skeleton height={10} width={36} />
          <Skeleton height={24} width={80} />
        </div>
        <Skeleton height={36} width={90} style={{ borderRadius: 8 }} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MarketplacePage() {
  const { data: listings, isLoading, error, refetch } = useActiveListings();
  const { isConnected } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Locked' | 'Completed'>('all');

  const filtered = listings?.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-wide py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <p className="type-caption mb-2" style={{ color: 'var(--color-accent)' }}>
            P2P Exchange
          </p>
          <h1
            className="type-display-lg"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
          >
            Marketplace
          </h1>
          <div style={{ marginTop: 'var(--stack-xs)' }}>
            {isLoading ? (
              <Skeleton height={16} width={180} />
            ) : (
              <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
                {listings?.length ?? 0} listing{listings?.length !== 1 ? 's' : ''} — all backed by Soroban escrow
              </p>
            )}
          </div>
        </div>
        {isConnected && (
          <Link
            href="/dashboard?action=create"
            className="btn-primary w-fit"
            id="create-listing-btn"
          >
            <Plus className="w-4.5 h-4.5" />
            Create Listing
          </Link>
        )}
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] shrink-0 pointer-events-none"
            style={{ color: 'var(--color-ink-faint)' }}
          />
          <input
            type="text"
            placeholder="Search listings…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ll-input"
            style={{ paddingLeft: '2.375rem' }}
            aria-label="Search marketplace listings"
            id="marketplace-search"
          />
        </div>

        {/* Status filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'Active', 'Locked', 'Completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',       /* explicit — never let height vary */
                whiteSpace: 'nowrap',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 500,
                fontFamily: 'var(--font-ui)',
                border: `1px solid ${statusFilter === s ? 'rgba(43,58,143,0.25)' : 'var(--color-border)'}`,
                backgroundColor: statusFilter === s ? 'var(--color-trust-soft)' : 'var(--color-surface)',
                color: statusFilter === s ? 'var(--color-trust)' : 'var(--color-ink-muted)',
                transition: 'all 150ms',
                cursor: 'pointer',
              }}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Content states */}
      {isLoading ? (
        <div className="card-grid marketplace-listing-grid" style={{ gap: 'var(--spacing-3)' }}>
          {[...Array(6)].map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState
          title="Couldn't load listings"
          message={error instanceof Error ? error.message : "Check your connection and try again."}
          onRetry={() => refetch()}
        />
      ) : filtered && filtered.length > 0 ? (
        <div className="card-grid marketplace-listing-grid" style={{ gap: 'var(--spacing-3)' }}>
          {filtered.map((listing) => (
            <ListingCard key={listing.listing_id.toString()} listing={listing} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={searchQuery ? 'No listings match your search' : 'No listings yet'}
          description={
            searchQuery
              ? 'Try a different search term or clear the filter.'
              : isConnected
              ? 'No listings yet — be the first to create one.'
              : 'Connect your wallet to create or buy listings.'
          }
          action={
            isConnected && !searchQuery ? (
              <Link href="/dashboard?action=create" className="btn-primary" id="marketplace-create-first-btn">
                <Plus className="w-4.5 h-4.5" />
                Create Listing
              </Link>
            ) : searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="btn-ghost"
              >
                Clear search
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
