'use client';

import { useWallet } from '../hooks/useWallet';
import { useActiveListings } from '../hooks/useListings';
import {
  formatAmount,
  formatAddress,
  getEscrowStateColor,
  getEscrowStateLabel,
  getTimeRemaining,
  SUPPORTED_TOKENS,
  type EscrowRecord,
  type ListingData,
} from '../types';
import {
  LayoutDashboard,
  Plus,
  Package,
  ShoppingCart,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCcw,
  Wallet,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

function WalletRequiredState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-card p-12 text-center max-w-md">
        <Wallet className="w-16 h-16 text-violet-400 mx-auto mb-4 animate-float" />
        <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
        <p className="text-zinc-400 mb-6">
          Connect a Stellar wallet to view your listings, escrows, and transaction history.
        </p>
        <button
          onClick={onConnect}
          className="flex items-center gap-2 mx-auto px-6 py-3 rounded-xl brand-gradient text-white font-medium hover:opacity-90 transition-all"
          id="dashboard-connect-wallet-btn"
        >
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </button>
      </div>
    </div>
  );
}

function InstallFreighterState() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="glass-card p-12 text-center max-w-md border-red-500/20 bg-red-950/10">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-bold mb-2">Freighter Extension Required</h2>
        <p className="text-zinc-400 mb-6 leading-relaxed text-sm">
          The Freighter wallet extension was not detected on your browser. Please install the extension to interact with the LumenLock Soroban contracts.
        </p>
        <a
          href="https://www.freighter.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl brand-gradient text-white font-medium hover:opacity-90 transition-all shadow-lg text-sm"
        >
          <Wallet className="w-4 h-4" />
          Install Freighter Wallet
        </a>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description?: string;
}) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500 font-medium">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {description && <p className="text-xs text-zinc-600 mt-1">{description}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-${color.replace('text-', '')}/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { address, isConnected, status, connect, isFreighterInstalled } = useWallet();
  const { data: allListings, isLoading } = useActiveListings();

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-zinc-400 mt-1 font-mono text-sm">
            {formatAddress(address!)}
          </p>
        </div>
        <Link
          href="/marketplace?action=create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg brand-gradient text-white text-sm font-medium hover:opacity-90 transition-all w-fit"
          id="dashboard-create-listing-btn"
        >
          <Plus className="w-4 h-4" />
          Create Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard
          title="Active Listings"
          value={isLoading ? '...' : activeListings.length}
          icon={Package}
          color="text-violet-400"
          description="Available for purchase"
        />
        <StatCard
          title="Completed Sales"
          value={isLoading ? '...' : completedListings.length}
          icon={CheckCircle2}
          color="text-emerald-400"
          description="Fully settled"
        />
        <StatCard
          title="Open Escrows"
          value="—"
          icon={ShoppingCart}
          color="text-cyan-400"
          description="As buyer"
        />
        <StatCard
          title="Disputes"
          value="—"
          icon={AlertCircle}
          color="text-red-400"
          description="Pending resolution"
        />
      </div>

      {/* My Listings */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">My Listings</h2>
          <Link
            href="/marketplace"
            className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
          >
            View All <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-5 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-8 w-full" />
              </div>
            ))}
          </div>
        ) : myListings.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400">You have no listings yet.</p>
            <Link
              href="/marketplace?action=create"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Create Your First Listing
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myListings.map((listing) => (
              <div key={listing.listing_id.toString()} className="glass-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-medium text-zinc-200 truncate">{listing.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ml-2 ${
                      listing.status === 'Active' ? 'status-active' : 'status-completed'
                    }`}
                  >
                    {listing.status}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 line-clamp-2 mb-3">{listing.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold gradient-text">
                    {formatAmount(listing.price)} TOKEN
                  </p>
                  <Link
                    href={`/marketplace/${listing.listing_id}`}
                    className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                  >
                    View <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link
            href="/activity"
            className="glass-card p-6 hover:border-zinc-600 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 flex items-center justify-center mb-3">
              <RefreshCcw className="w-5 h-5 text-cyan-400" />
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-cyan-300 transition-colors">Activity Feed</h3>
            <p className="text-sm text-zinc-500">Real-time contract events</p>
          </Link>
          <Link
            href="/transactions"
            className="glass-card p-6 hover:border-zinc-600 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-400/10 flex items-center justify-center mb-3">
              <ArrowUpRight className="w-5 h-5 text-violet-400" />
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-violet-300 transition-colors">Transactions</h3>
            <p className="text-sm text-zinc-500">View transaction history</p>
          </Link>
          <Link
            href="/analytics"
            className="glass-card p-6 hover:border-zinc-600 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center mb-3">
              <LayoutDashboard className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-semibold mb-1 group-hover:text-emerald-300 transition-colors">Analytics</h3>
            <p className="text-sm text-zinc-500">Marketplace statistics</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
