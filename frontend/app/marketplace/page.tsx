'use client';

import { useActiveListings } from '../hooks/useListings';
import { useWallet } from '../hooks/useWallet';
import {
  formatAmount,
  formatAddress,
  getEscrowStateLabel,
  SUPPORTED_TOKENS,
  type ListingData,
} from '../types';
import {
  ShoppingBag,
  Search,
  Filter,
  Plus,
  Loader2,
  AlertCircle,
  Tag,
  User,
  Clock,
  ArrowRight,
  Milestone,
} from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

function getTokenSymbol(assetAddress: string): string {
  for (const [symbol, info] of Object.entries(SUPPORTED_TOKENS)) {
    if (info.address === assetAddress) return symbol;
  }
  return 'TOKEN';
}

function ListingCard({ listing }: { listing: ListingData }) {
  const tokenSymbol = getTokenSymbol(listing.asset);
  const hasMilestones = !!listing.milestone_config;
  const priceDisplay = `${formatAmount(listing.price)} ${tokenSymbol}`;

  return (
    <div className="glass-card p-6 hover:border-zinc-600/80 transition-all duration-300 group hover:-translate-y-1 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-zinc-100 truncate group-hover:text-violet-300 transition-colors">
            {listing.title}
          </h3>
          <div className="flex items-center gap-1.5 mt-1">
            <User className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-xs text-zinc-500 font-mono">
              {formatAddress(listing.seller)}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              listing.status === 'Active'
                ? 'status-active'
                : listing.status === 'Locked'
                  ? 'status-locked'
                  : 'status-completed'
            }`}
          >
            {listing.status}
          </span>
          {hasMilestones && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 flex items-center gap-1">
              <Milestone className="w-3 h-3" />
              Milestones
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">
        {listing.description}
      </p>

      {/* Price & CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
        <div>
          <p className="text-xs text-zinc-500 mb-0.5">Price</p>
          <p className="text-xl font-bold gradient-text">{priceDisplay}</p>
        </div>
        {listing.status === 'Active' && (
          <Link
            href={`/marketplace/${listing.listing_id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all"
          >
            Buy Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const { data: listings, isLoading, error, refetch } = useActiveListings();
  const { isConnected } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = listings?.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container-wide py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="text-zinc-400 mt-1">
            {listings?.length ?? 0} active listing{listings?.length !== 1 ? 's' : ''} — all backed by Soroban escrow
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <Link
              href="/dashboard?action=create"
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all"
              id="create-listing-btn"
            >
              <Plus className="w-4 h-4" />
              Create Listing
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search listings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
          aria-label="Search marketplace listings"
          id="marketplace-search"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <div className="skeleton h-5 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-8 w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-card p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to load listings</h3>
          <p className="text-zinc-400 text-sm mb-4">{String(error)}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((listing) => (
            <ListingCard key={listing.listing_id.toString()} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 text-center">
          <ShoppingBag className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery ? 'No listings match your search' : 'No listings yet'}
          </h3>
          <p className="text-zinc-400 mb-6">
            {isConnected
              ? 'Be the first to create a listing!'
              : 'Connect your wallet to create or buy listings.'}
          </p>
          {isConnected ? (
            <Link
              href="/dashboard?action=create"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg brand-gradient text-white font-medium hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Create First Listing
            </Link>
          ) : (
            <button
              onClick={() => {}}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-all"
            >
              Connect Wallet
            </button>
          )}
        </div>
      )}
    </div>
  );
}
