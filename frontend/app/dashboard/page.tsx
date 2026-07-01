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

// ─── Skeleton fallback ────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="container-wide" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      <div className="flex items-end justify-between" style={{ marginBottom: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Skeleton height={12} width={80} />
          <Skeleton height={40} width={200} />
          <Skeleton height={14} width={150} />
        </div>
        <Skeleton height={40} width={140} style={{ borderRadius: 9999 }} />
      </div>
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="ll-card" style={{ padding: 'var(--spacing-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton height={10} width={80} />
            <Skeleton height={32} width={60} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Wallet Required ──────────────────────────────────────────────────────────
function WalletRequiredState({ onConnect }: { onConnect: () => void }) {
  return (
    <div
      className="container-wide flex flex-col items-center justify-center text-center"
      style={{ minHeight: '60vh', gap: 'var(--spacing-3)', paddingTop: 'var(--spacing-8)' }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'var(--color-trust-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Wallet style={{ width: 28, height: 28, color: 'var(--color-trust)' }} />
      </div>
      <h2 className="type-heading" style={{ color: 'var(--color-ink)' }}>
        Connect Your Wallet
      </h2>
      <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)', maxWidth: '40ch' }}>
        Connect a Stellar wallet to view your listings, escrows, and transaction history.
      </p>
      <button
        onClick={onConnect}
        className="btn-primary"
        id="dashboard-connect-wallet-btn"
      >
        <Wallet style={{ width: 16, height: 16 }} />
        Connect Wallet
      </button>
    </div>
  );
}

// ─── Install Freighter ────────────────────────────────────────────────────────
function InstallFreighterState() {
  return (
    <div
      className="container-wide flex flex-col items-center justify-center text-center"
      style={{ minHeight: '60vh', gap: 'var(--spacing-3)', paddingTop: 'var(--spacing-8)' }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          backgroundColor: 'var(--color-danger-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AlertCircle style={{ width: 28, height: 28, color: 'var(--color-danger)' }} />
      </div>
      <h2 className="type-heading" style={{ color: 'var(--color-ink)' }}>
        Freighter Extension Required
      </h2>
      <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)', maxWidth: '42ch' }}>
        The Freighter wallet extension was not detected. Please install it to interact with LumenLock&apos;s Soroban contracts.
      </p>
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary"
      >
        <Wallet style={{ width: 16, height: 16 }} />
        Install Freighter Wallet
      </a>
    </div>
  );
}

// ─── Stat Cell ────────────────────────────────────────────────────────────────
function StatCell({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  description?: string;
  icon?: React.ComponentType<{ style?: React.CSSProperties }>;
}) {
  return (
    <div className="ll-card flex flex-col" style={{ padding: 'var(--spacing-3)' }}>
      {Icon && (
        <div
          className="card-slot-marker"
          style={{ backgroundColor: 'var(--color-surface-raised)', marginBottom: 'var(--spacing-2)' }}
        >
          <Icon style={{ width: 18, height: 18, color: 'var(--color-accent)' }} />
        </div>
      )}
      <span
        style={{
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-mono)',
          fontSize: '1.75rem',
          fontWeight: 600,
          lineHeight: 1.2,
          marginBottom: 4,
          display: 'block',
        }}
      >
        {value}
      </span>
      <p className="type-caption" style={{ color: 'var(--color-ink-faint)' }}>
        {label}
      </p>
      {description && (
        <p
          className="type-body-sm"
          style={{ color: 'var(--color-ink-faint)', fontSize: '0.75rem', marginTop: 2 }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

// ─── Listing Row ──────────────────────────────────────────────────────────────
function MyListingCard({ listing }: { listing: ListingData }) {
  return (
    <div className="ll-card ll-card-hover" style={{ padding: 'var(--spacing-2) var(--spacing-3)' }}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3
            className="type-body font-semibold truncate"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
          >
            {listing.title}
          </h3>
          <p className="type-body-sm line-clamp-1" style={{ color: 'var(--color-ink-muted)' }}>
            {listing.description}
          </p>
        </div>
        <span className="type-mono" style={{ color: 'var(--color-ink)', flexShrink: 0 }}>
          {formatAmount(listing.price)}
        </span>
        <StatusBadge status={listing.status} />
        <Link
          href={`/marketplace/${listing.listing_id}`}
          className="flex items-center gap-1 shrink-0"
          style={{
            color: 'var(--color-accent)',
            fontSize: '0.875rem',
            fontWeight: 500,
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent-bright)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
        >
          View <ArrowUpRight style={{ width: 14, height: 14 }} />
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
    <div className="container-wide" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-end justify-between"
        style={{ gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-6)' }}
      >
        <div>
          <p className="type-caption" style={{ color: 'var(--color-accent)', marginBottom: 'var(--spacing-1)' }}>
            MY ACCOUNT
          </p>
          <h1 className="type-display-lg" style={{ color: 'var(--color-ink)', marginBottom: 'var(--spacing-1)' }}>
            Dashboard
          </h1>
          <p className="type-mono-sm" style={{ color: 'var(--color-ink-faint)' }}>
            {formatAddress(address!)}
          </p>
        </div>
        <Link
          href="/marketplace?action=create"
          className="btn-primary w-fit"
          id="dashboard-create-listing-btn"
        >
          <Plus style={{ width: 16, height: 16 }} />
          Create Listing
        </Link>
      </div>

      {/* Create listing form */}
      {showCreateForm && (
        <div style={{ marginBottom: 'var(--spacing-6)' }}>
          <CreateListingFormPanel />
        </div>
      )}

      {/* Stats Grid */}
      <div
        className="card-grid"
        style={{
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--spacing-2)',
          marginBottom: 'var(--spacing-6)',
        }}
      >
        <StatCell
          label="Active Listings"
          value={isLoading ? '—' : activeListings.length}
          description="Available for purchase"
          icon={Package}
        />
        <StatCell
          label="Completed Sales"
          value={isLoading ? '—' : completedListings.length}
          description="Fully settled"
          icon={CheckCircle2}
        />
        <StatCell
          label="Open Escrows"
          value="—"
          description="As buyer"
        />
        <StatCell
          label="Disputes"
          value="—"
          description="Pending resolution"
        />
      </div>

      {/* My Listings */}
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-3)' }}>
          <h2 className="type-heading" style={{ color: 'var(--color-ink)' }}>
            My Listings
          </h2>
          <Link
            href="/marketplace"
            className="flex items-center gap-1"
            style={{ color: 'var(--color-accent)', fontSize: '0.875rem', fontWeight: 500, textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent-bright)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
          >
            View All <ArrowUpRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="ll-card" style={{ padding: 'var(--spacing-2) var(--spacing-3)' }}>
                <Skeleton height={16} width="75%" />
              </div>
            ))}
          </div>
        ) : myListings.length === 0 ? (
          <EmptyState
            title="No listings yet"
            description="You haven't created any listings. Post your first item for sale."
            action={
              <Link href="/marketplace?action=create" className="btn-primary">
                <Plus style={{ width: 16, height: 16 }} />
                Create Your First Listing
              </Link>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
            {myListings.map((listing) => (
              <MyListingCard key={listing.listing_id.toString()} listing={listing} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: 'var(--spacing-6)' }}>
        <h2 className="type-heading" style={{ color: 'var(--color-ink)', marginBottom: 'var(--spacing-3)' }}>
          Quick Actions
        </h2>
        <div className="card-grid quick-actions-grid" style={{ gap: 'var(--spacing-2)' }}>
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
              className="ll-card ll-card-trust-hover flex flex-col"
              style={{ padding: 'var(--spacing-3)', textDecoration: 'none', gap: 'var(--spacing-2)' }}
            >
              <div
                className="card-slot-marker"
                style={{ backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-accent)' }}
              >
                <Icon style={{ width: 18, height: 18 }} />
              </div>
              <div className="card-slot-title">
                <h3 className="type-heading" style={{ color: 'var(--color-ink)', fontSize: '1rem' }}>
                  {label}
                </h3>
              </div>
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
