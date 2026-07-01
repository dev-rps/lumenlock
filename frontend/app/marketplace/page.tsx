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

// ─── Listing Card ──────────────────────────────────────────────────────────────
function ListingCard({ listing }: { listing: ListingData }) {
  const tokenSymbol = getTokenSymbol(listing.asset);
  const hasMilestones = !!listing.milestone_config;
  const priceDisplay = formatAmount(listing.price);

  return (
    <div
      className="ll-card ll-card-hover flex flex-col"
      style={{ padding: 'var(--spacing-3)', gap: 'var(--spacing-2)', cursor: 'default' }}
    >
      {/* Header: title + badges */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="type-heading truncate" style={{ color: 'var(--color-ink)' }}>
            {listing.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <User style={{ width: 13, height: 13, color: 'var(--color-ink-faint)', flexShrink: 0 }} />
            <span className="type-mono-sm" style={{ color: 'var(--color-ink-faint)' }}>
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
              }}
            >
              <Milestone style={{ width: 11, height: 11 }} />
              Milestones
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p
        className="type-body-sm line-clamp-2 flex-1"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        {listing.description}
      </p>

      {/* Footer: price + CTA */}
      <div
        className="flex items-center justify-between"
        style={{ paddingTop: 'var(--spacing-2)', borderTop: '1px solid var(--color-border)', marginTop: 'auto' }}
      >
        <div>
          <p className="type-caption" style={{ color: 'var(--color-ink-faint)', marginBottom: 4 }}>
            Price
          </p>
          <p className="type-mono" style={{ color: 'var(--color-ink)' }}>
            {priceDisplay}{' '}
            <span style={{ color: 'var(--color-accent)' }}>{tokenSymbol}</span>
          </p>
        </div>
        {listing.status === 'Active' && (
          <Link
            href={`/marketplace/${listing.listing_id}`}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '0.875rem' }}
          >
            Buy Now →
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function ListingCardSkeleton() {
  return (
    <div className="ll-card flex flex-col" style={{ padding: 'var(--spacing-3)', gap: 'var(--spacing-2)' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={20} width="75%" />
          <Skeleton height={14} width="45%" />
        </div>
        <Skeleton height={22} width={64} style={{ borderRadius: 9999 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Skeleton height={14} width="100%" />
        <Skeleton height={14} width="80%" />
      </div>
      <div
        className="flex items-center justify-between"
        style={{ paddingTop: 'var(--spacing-2)', borderTop: '1px solid var(--color-border)' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Skeleton height={10} width={36} />
          <Skeleton height={24} width={80} />
        </div>
        <Skeleton height={36} width={90} style={{ borderRadius: 9999 }} />
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

  const filterLabels: Array<{ value: 'all' | 'Active' | 'Locked' | 'Completed'; label: string }> = [
    { value: 'all',       label: 'All' },
    { value: 'Active',    label: 'Active' },
    { value: 'Locked',    label: 'Locked' },
    { value: 'Completed', label: 'Completed' },
  ];

  return (
    <div className="container-wide" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between" style={{ gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-4)' }}>
        <div>
          <p className="type-caption" style={{ color: 'var(--color-accent)', marginBottom: 'var(--spacing-1)' }}>
            P2P EXCHANGE
          </p>
          <h1 className="type-display-lg" style={{ color: 'var(--color-ink)', marginBottom: 'var(--spacing-1)' }}>
            Marketplace
          </h1>
          {isLoading ? (
            <Skeleton height={16} width={180} />
          ) : (
            <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
              {listings?.length ?? 0} listing{listings?.length !== 1 ? 's' : ''} — all backed by Soroban escrow
            </p>
          )}
        </div>
        {isConnected && (
          <Link
            href="/dashboard?action=create"
            className="btn-primary w-fit"
            id="create-listing-btn"
          >
            <Plus style={{ width: 16, height: 16 }} />
            Create Listing
          </Link>
        )}
      </div>

      {/* Search */}
      <div className="relative" style={{ marginBottom: 'var(--spacing-2)' }}>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0"
          style={{ width: 18, height: 18, color: 'var(--color-ink-faint)' }}
        />
        <input
          type="text"
          placeholder="Search listings…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="ll-input"
          style={{ paddingLeft: '2.5rem' }}
          aria-label="Search marketplace listings"
          id="marketplace-search"
        />
      </div>

      {/* Filter tabs */}
      <div
        className="flex flex-wrap items-center"
        style={{ gap: 'var(--spacing-1)', marginBottom: 'var(--spacing-4)' }}
      >
        {filterLabels.map(({ value, label }) => {
          const active = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '6px 16px',
                whiteSpace: 'nowrap',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.875rem',
                fontWeight: 500,
                fontFamily: 'var(--font-ui)',
                border: `1px solid ${active ? 'var(--color-accent-border)' : 'var(--color-border)'}`,
                backgroundColor: active ? 'var(--color-accent-soft)' : 'transparent',
                color: active ? 'var(--color-accent)' : 'var(--color-ink-muted)',
                transition: 'all 150ms',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card-grid marketplace-listing-grid" style={{ gap: 'var(--spacing-2)' }}>
          {[...Array(6)].map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : error ? (
        <ErrorState
          title="Couldn't load listings"
          message={error instanceof Error ? error.message : 'Check your connection and try again.'}
          onRetry={() => refetch()}
        />
      ) : filtered && filtered.length > 0 ? (
        <div className="card-grid marketplace-listing-grid" style={{ gap: 'var(--spacing-2)' }}>
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
                <Plus style={{ width: 16, height: 16 }} />
                Create Listing
              </Link>
            ) : searchQuery ? (
              <button onClick={() => setSearchQuery('')} className="btn-ghost">
                Clear search
              </button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}
