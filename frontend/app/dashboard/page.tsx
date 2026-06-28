'use client';

import { Suspense } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useActiveListings } from '../hooks/useListings';
import { CreateListingFormPanel } from '../components/CreateListingForm';
import { useSearchParams } from 'next/navigation';
import {
  formatAmount,
  formatAddress,
  type ListingData,
} from '../types';
import {
  Plus,
  Package,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Wallet,
  RefreshCcw,
  LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

// ─── Skeleton fallback for Suspense ──────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="container-wide py-12">
      {/* Header skeleton */}
      <div className="flex items-end justify-between mb-10">
        <div className="space-y-2">
          <Skeleton height={14} width={80} />
          <Skeleton height={40} width={200} />
          <Skeleton height={16} width={150} />
        </div>
        <Skeleton height={40} width={140} style={{ borderRadius: 10 }} />
      </div>
      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 mb-10 ll-card overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-6 space-y-2"
            style={{ borderRight: i < 4 ? '1px solid var(--color-border)' : undefined }}
          >
            <Skeleton height={10} width={80} />
            <Skeleton height={32} width={60} />
            <Skeleton height={10} width={100} />
          </div>
        ))}
      </div>
      {/* Listings grid skeleton */}
      <div className="space-y-4">
        <Skeleton height={20} width={120} />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="ll-card p-5 space-y-3">
              <Skeleton height={16} width="75%" />
              <Skeleton height={12} width="50%" />
              <Skeleton height={10} width="88%" />
              <div className="pt-3 flex justify-between" style={{ borderTop: '1px solid var(--color-surface-sunken)' }}>
                <Skeleton height={22} width={80} />
                <Skeleton height={22} width={50} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Wallet Required ──────────────────────────────────────────────────────────
function WalletRequiredState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="container-wide py-12">
      <EmptyState
        title="Connect Your Wallet"
        description="Connect a Stellar wallet to view your listings, escrows, and transaction history."
        icon={
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-trust-soft)' }}
          >
            <Wallet className="w-8 h-8" style={{ color: 'var(--color-trust)' }} />
          </div>
        }
        action={
          <button
            onClick={onConnect}
            className="btn-secondary"
            id="dashboard-connect-wallet-btn"
          >
            <Wallet className="w-4.5 h-4.5" />
            Connect Wallet
          </button>
        }
      />
    </div>
  );
}

// ─── Install Freighter ────────────────────────────────────────────────────────
function InstallFreighterState() {
  return (
    <div className="container-wide py-12">
      <EmptyState
        title="Freighter Extension Required"
        description="The Freighter wallet extension was not detected. Please install it to interact with LumenLock's Soroban contracts."
        icon={
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-danger-soft)' }}
          >
            <AlertCircle className="w-8 h-8" style={{ color: 'var(--color-danger)' }} />
          </div>
        }
        action={
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <Wallet className="w-4 h-4" />
            Install Freighter Wallet
          </a>
        }
      />
    </div>
  );
}

// ─── Stat Row ─────────────────────────────────────────────────────────────────
function StatItem({
  label,
  value,
  description,
  borderRight,
}: {
  label: string;
  value: string | number;
  description?: string;
  borderRight?: boolean;
}) {
  return (
    <div
      className="flex flex-col p-6"
      style={{ borderRight: borderRight ? '1px solid var(--color-border)' : undefined }}
    >
      <p className="type-caption mb-1" style={{ color: 'var(--color-ink-faint)' }}>
        {label}
      </p>
      <p
        className="font-semibold mb-0.5"
        style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontSize: '1.75rem', lineHeight: 1.2 }}
      >
        {value}
      </p>
      {description && (
        <p className="type-caption" style={{ color: 'var(--color-ink-faint)', textTransform: 'none', letterSpacing: 0 }}>
          {description}
        </p>
      )}
    </div>
  );
}

// ─── Listing Mini-card ────────────────────────────────────────────────────────
function MyListingCard({ listing }: { listing: ListingData }) {
  return (
    <div className="ll-card ll-card-hover p-5">
      <div className="flex items-start justify-between mb-2">
        <h3
          className="font-semibold truncate flex-1 mr-2"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)', fontSize: '1rem' }}
        >
          {listing.title}
        </h3>
        <StatusBadge status={listing.status} />
      </div>
      <p
        className="type-body-sm line-clamp-2 mb-4"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        {listing.description}
      </p>
      <div
        className="flex items-center justify-between pt-3"
        style={{ borderTop: '1px solid var(--color-border)' }}
      >
        <span
          className="font-semibold"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', fontSize: '1.05rem' }}
        >
          {formatAmount(listing.price)} TOKEN
        </span>
        <Link
          href={`/marketplace/${listing.listing_id}`}
          className="flex items-center gap-1 text-sm font-medium transition-colors"
          style={{ color: 'var(--color-trust)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust-hover)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
        >
          View <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { address, isConnected, connect, isFreighterInstalled } = useWallet();
  const { data: allListings, isLoading } = useActiveListings();
  const searchParams = useSearchParams();
  const showCreateForm = searchParams.get('action') === 'create';

  if (!isConnected) {
    if (isFreighterInstalled === false) {
      return <InstallFreighterState />;
    }
    return <WalletRequiredState onConnect={connect} />;
  }

  const myListings = allListings?.filter((l) => l.seller === address) ?? [];
  const activeListings = myListings.filter((l) => l.status === 'Active');
  const completedListings = myListings.filter((l) => l.status === 'Completed');

  return (
    <div className="container-wide py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <p className="type-caption mb-2" style={{ color: 'var(--color-accent)' }}>
            My Account
          </p>
          <h1
            className="type-display-lg mb-1"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
          >
            Dashboard
          </h1>
          <p
            className="type-mono-sm"
            style={{ color: 'var(--color-ink-muted)' }}
          >
            {formatAddress(address!)}
          </p>
        </div>
        <Link
          href="/marketplace?action=create"
          className="btn-primary w-fit"
          id="dashboard-create-listing-btn"
        >
          <Plus className="w-4.5 h-4.5" />
          Create Listing
        </Link>
      </div>

      {/* Create listing form */}
      {showCreateForm && (
        <div className="mb-10">
          <CreateListingFormPanel />
        </div>
      )}

      {/* Stats Row */}
      <div
        className="ll-card overflow-hidden mb-10"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}
      >
        <StatItem
          label="Active Listings"
          value={isLoading ? '—' : activeListings.length}
          description="Available for purchase"
          borderRight
        />
        <StatItem
          label="Completed Sales"
          value={isLoading ? '—' : completedListings.length}
          description="Fully settled"
        />
        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <StatItem
            label="Open Escrows"
            value="—"
            description="As buyer"
            borderRight
          />
          <StatItem
            label="Disputes"
            value="—"
            description="Pending resolution"
          />
        </div>
      </div>

      {/* My Listings */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="type-heading"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
          >
            My Listings
          </h2>
          <Link
            href="/marketplace"
            className="flex items-center gap-1 text-sm font-medium transition-colors"
            style={{ color: 'var(--color-trust)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
          >
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="ll-card p-5 space-y-3">
                <Skeleton height={16} width="75%" />
                <Skeleton height={12} width="50%" />
                <Skeleton height={10} width="88%" />
              </div>
            ))}
          </div>
        ) : myListings.length === 0 ? (
          <EmptyState
            title="No listings yet"
            description="You haven't created any listings. Post your first item for sale."
            action={
              <Link href="/marketplace?action=create" className="btn-primary">
                <Plus className="w-4.5 h-4.5" />
                Create Your First Listing
              </Link>
            }
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListings.map((listing) => (
              <MyListingCard key={listing.listing_id.toString()} listing={listing} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2
          className="type-heading mb-5"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
        >
          Quick Actions
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              href: '/activity',
              icon: RefreshCcw,
              label: 'Activity Feed',
              description: 'Real-time contract events',
            },
            {
              href: '/transactions',
              icon: ArrowUpRight,
              label: 'Transactions',
              description: 'View transaction history',
            },
            {
              href: '/analytics',
              icon: LayoutDashboard,
              label: 'Analytics',
              description: 'Marketplace statistics',
            },
          ].map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="ll-card ll-card-trust-hover p-6 group block"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors"
                style={{ backgroundColor: 'var(--color-trust-soft)', color: 'var(--color-trust)' }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <h3
                className="font-semibold mb-1 transition-colors"
                style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-ui)' }}
              >
                {label}
              </h3>
              <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
                {description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
