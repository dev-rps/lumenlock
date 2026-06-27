'use client';

import { useActivityStore } from '../state/txStore';
import type { ContractEvent, ContractEventType } from '../types';
import { formatAddress } from '../types';
import {
  Activity,
  Package,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  Gavel,
  RefreshCcw,
  ArrowUpDown,
  Clock,
  ExternalLink,
  Wifi,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const eventConfig: Record<ContractEventType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  escrow_opened: { label: 'Escrow Opened', icon: Package, color: 'text-cyan-400' },
  escrow_funded: { label: 'Escrow Funded', icon: Wallet, color: 'text-violet-400' },
  buyer_confirmed: { label: 'Buyer Confirmed', icon: CheckCircle2, color: 'text-emerald-400' },
  seller_confirmed: { label: 'Seller Confirmed', icon: CheckCircle2, color: 'text-blue-400' },
  funds_released: { label: 'Funds Released', icon: ArrowUpDown, color: 'text-emerald-400' },
  refund_claimed: { label: 'Refund Claimed', icon: RefreshCcw, color: 'text-amber-400' },
  dispute_raised: { label: 'Dispute Raised', icon: AlertTriangle, color: 'text-red-400' },
  dispute_resolved: { label: 'Dispute Resolved', icon: Gavel, color: 'text-orange-400' },
  listing_created: { label: 'Listing Created', icon: Package, color: 'text-violet-400' },
  listing_status_updated: { label: 'Listing Updated', icon: RefreshCcw, color: 'text-zinc-400' },
};

function EventRow({ event }: { event: ContractEvent }) {
  const config = eventConfig[event.type] || { label: event.type, icon: Activity, color: 'text-zinc-400' };
  const Icon = config.icon;
  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-start gap-4 py-4 border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors px-4 -mx-4 rounded-lg group animate-fade-in">
      <div className={`w-9 h-9 rounded-xl bg-${config.color.replace('text-', '')}/10 flex items-center justify-center shrink-0 mt-0.5`}>
        <Icon className={`w-4.5 h-4.5 ${config.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-zinc-200 text-sm">{config.label}</span>
          <span className="text-xs text-zinc-600 font-mono">
            Ledger #{event.ledger}
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5 font-mono">
          {formatAddress(event.contractId)} · {timeAgo(event.timestamp)}
        </p>
      </div>
      {event.txHash && (
        <a
          href={`${explorerUrl}/tx/${event.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-lg text-zinc-600 hover:text-violet-400 hover:bg-violet-400/10 transition-all opacity-0 group-hover:opacity-100"
          aria-label="View on explorer"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const { events, lastLedger } = useActivityStore();
  const [filter, setFilter] = useState<ContractEventType | 'all'>('all');
  const [isLive, setIsLive] = useState(true);
  const [tick, setTick] = useState(0);

  // Force re-render every 5s to update "time ago" display
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const filtered = events.filter(
    (e) => filter === 'all' || e.type === filter,
  );

  const filterOptions: Array<{ value: ContractEventType | 'all'; label: string }> = [
    { value: 'all', label: 'All Events' },
    { value: 'escrow_opened', label: 'Opened' },
    { value: 'escrow_funded', label: 'Funded' },
    { value: 'buyer_confirmed', label: 'Confirmed' },
    { value: 'funds_released', label: 'Released' },
    { value: 'dispute_raised', label: 'Disputes' },
    { value: 'listing_created', label: 'Listings' },
  ];

  return (
    <div className="container-wide py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold">Activity Feed</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-sm text-zinc-400">
              {isLive ? 'Live' : 'Paused'} · Ledger {lastLedger || '—'}
            </span>
            <Wifi className="w-3.5 h-3.5 text-zinc-600" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
              isLive
                ? 'border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20'
                : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {isLive ? 'Pause' : 'Resume'} Live
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {filterOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === value
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Event List */}
      <div className="glass-card p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">No events yet</h3>
            <p className="text-sm text-zinc-600">
              Events from the LumenLock contracts will appear here in real-time.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-xs text-zinc-600 mb-4 font-medium uppercase tracking-wide">
              {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            </p>
            {filtered.map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
