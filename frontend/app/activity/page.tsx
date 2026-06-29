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
  ExternalLink,
  Wifi,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { EmptyState } from '../components/ui/EmptyState';

const eventConfig: Record<
  ContractEventType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    bgColor: string;
    iconColor: string;
  }
> = {
  escrow_opened:          { label: 'Escrow Opened',     icon: Package,       bgColor: 'var(--color-trust-soft)',   iconColor: 'var(--color-trust)' },
  escrow_funded:          { label: 'Escrow Funded',     icon: Wallet,        bgColor: 'var(--color-trust-soft)',   iconColor: 'var(--color-trust)' },
  buyer_confirmed:        { label: 'Buyer Confirmed',   icon: CheckCircle2,  bgColor: 'var(--color-success-soft)', iconColor: 'var(--color-success)' },
  seller_confirmed:       { label: 'Seller Confirmed',  icon: CheckCircle2,  bgColor: 'var(--color-success-soft)', iconColor: 'var(--color-success)' },
  funds_released:         { label: 'Funds Released',    icon: ArrowUpDown,   bgColor: 'var(--color-success-soft)', iconColor: 'var(--color-success)' },
  refund_claimed:         { label: 'Refund Claimed',    icon: RefreshCcw,    bgColor: 'var(--color-warning-soft)', iconColor: 'var(--color-warning)' },
  dispute_raised:         { label: 'Dispute Raised',    icon: AlertTriangle, bgColor: 'var(--color-danger-soft)',  iconColor: 'var(--color-danger)' },
  dispute_resolved:       { label: 'Dispute Resolved',  icon: Gavel,         bgColor: 'var(--color-warning-soft)', iconColor: 'var(--color-warning)' },
  listing_created:        { label: 'Listing Created',   icon: Package,       bgColor: 'var(--color-accent-soft)',  iconColor: 'var(--color-accent)' },
  listing_status_updated: { label: 'Listing Updated',   icon: RefreshCcw,    bgColor: 'var(--color-surface-sunken)', iconColor: 'var(--color-ink-faint)' },
};

function timeAgo(dateVal: Date | string): string {
  const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

function EventRow({ event }: { event: ContractEvent }) {
  const config = eventConfig[event.type] ?? {
    label: event.type,
    icon: Activity,
    bgColor: 'var(--color-surface-sunken)',
    iconColor: 'var(--color-ink-faint)',
  };
  const Icon = config.icon;
  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';

  return (
    <div
      className="flex items-start gap-4 group"
      style={{
        padding: '1rem 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Timeline: icon + vertical line connector */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: config.bgColor }}
        >
          <Icon className="w-4 h-4" style={{ color: config.iconColor }} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span
            className="font-medium text-sm"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-ui)' }}
          >
            {config.label}
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}
          >
            Ledger #{event.ledger}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs"
            style={{ color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}
          >
            {formatAddress(event.contractId)}
          </span>
          <span className="type-caption" style={{ color: 'var(--color-ink-faint)', textTransform: 'none', letterSpacing: 0 }}>
            · {timeAgo(event.timestamp)}
          </span>
        </div>
      </div>

      {/* Explorer link (appears on hover) */}
      {event.txHash && (
        <a
          href={`${explorerUrl}/tx/${event.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          style={{ color: 'var(--color-ink-faint)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-trust)';
            e.currentTarget.style.backgroundColor = 'var(--color-trust-soft)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-ink-faint)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="View transaction on Stellar Explorer"
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
  const [, setTick] = useState(0);

  // Force re-render every 5s to update "time ago" display
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const filtered = events.filter((e) => filter === 'all' || e.type === filter);

  const filterOptions: Array<{ value: ContractEventType | 'all'; label: string }> = [
    { value: 'all',              label: 'All Events' },
    { value: 'escrow_opened',   label: 'Opened' },
    { value: 'escrow_funded',   label: 'Funded' },
    { value: 'buyer_confirmed', label: 'Confirmed' },
    { value: 'funds_released',  label: 'Released' },
    { value: 'dispute_raised',  label: 'Disputes' },
    { value: 'listing_created', label: 'Listings' },
  ];

  return (
    <div className="container-wide py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <p className="type-caption mb-2" style={{ color: 'var(--color-accent)' }}>
            On-chain events
          </p>
          <h1
            className="type-display-lg mb-2"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
          >
            Activity Feed
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isLive ? 'var(--color-success)' : 'var(--color-ink-faint)',
                boxShadow: isLive ? '0 0 0 3px var(--color-success-soft)' : 'none',
              }}
            />
            <span className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
              {isLive ? 'Live' : 'Paused'} · Ledger{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>{lastLedger || '—'}</span>
            </span>
            <Wifi className="w-3.5 h-3.5" style={{ color: 'var(--color-ink-faint)' }} />
          </div>
        </div>
        <button
          onClick={() => setIsLive(!isLive)}
          className="btn-ghost w-fit"
          style={
            isLive
              ? {
                  color: 'var(--color-success)',
                  borderColor: 'rgba(31,138,77,0.3)',
                  backgroundColor: 'var(--color-success-soft)',
                }
              : {}
          }
        >
          {isLive ? 'Pause Live' : 'Resume Live'}
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {filterOptions.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-150"
            style={{
              backgroundColor: filter === value ? 'var(--color-trust-soft)' : 'var(--color-surface)',
              color: filter === value ? 'var(--color-trust)' : 'var(--color-ink-muted)',
              border: `1px solid ${filter === value ? 'rgba(43,58,143,0.25)' : 'var(--color-border)'}`,
              fontFamily: 'var(--font-ui)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Event list */}
      <div className="ll-card p-6">
        {filtered.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Events from the LumenLock contracts will appear here in real-time as they occur on-chain."
            icon={
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-trust-soft)' }}
              >
                <Activity className="w-7 h-7" style={{ color: 'var(--color-trust)' }} />
              </div>
            }
          />
        ) : (
          <div>
            <p className="type-caption mb-4" style={{ color: 'var(--color-ink-faint)' }}>
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
