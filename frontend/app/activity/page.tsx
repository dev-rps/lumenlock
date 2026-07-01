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
  listing_status_updated: { label: 'Listing Updated',   icon: RefreshCcw,    bgColor: 'var(--color-surface-raised)', iconColor: 'var(--color-ink-faint)' },
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
    bgColor: 'var(--color-surface-raised)',
    iconColor: 'var(--color-ink-faint)',
  };
  const Icon = config.icon;
  const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://stellar.expert/explorer/testnet';

  return (
    <div
      className="flex items-start gap-4 group"
      style={{
        padding: 'var(--spacing-2) 0',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      {/* Icon slot */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          backgroundColor: config.bgColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: 16, height: 16, color: config.iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap" style={{ marginBottom: 'var(--spacing-1)' }}>
          <span className="type-body" style={{ color: 'var(--color-ink)' }}>
            {config.label}
          </span>
          <span className="type-mono-sm" style={{ color: 'var(--color-ink-faint)' }}>
            Ledger #{event.ledger}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="type-mono-sm" style={{ color: 'var(--color-ink-faint)' }}>
            {formatAddress(event.contractId)}
          </span>
          <span className="type-body-sm" style={{ color: 'var(--color-ink-faint)' }}>
            · {timeAgo(event.timestamp)}
          </span>
        </div>
      </div>

      {/* Explorer link (hover-reveal) */}
      {event.txHash && (
        <a
          href={`${explorerUrl}/tx/${event.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
          style={{ color: 'var(--color-ink-faint)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--color-accent)';
            e.currentTarget.style.backgroundColor = 'var(--color-accent-soft)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-ink-faint)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="View transaction on Stellar Explorer"
        >
          <ExternalLink style={{ width: 14, height: 14 }} />
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
    <div className="container-wide" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-end justify-between"
        style={{ gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-6)' }}
      >
        <div>
          <p className="type-caption" style={{ color: 'var(--color-accent)', marginBottom: 'var(--spacing-1)' }}>
            ON-CHAIN EVENTS
          </p>
          <h1 className="type-display-lg" style={{ color: 'var(--color-ink)', marginBottom: 'var(--spacing-1)' }}>
            Activity Feed
          </h1>
          {/* Live indicator */}
          <div className="flex items-center gap-2 mt-1">
            <div
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                backgroundColor: isLive ? 'var(--color-success)' : 'var(--color-ink-faint)',
                boxShadow: isLive ? '0 0 0 3px var(--color-success-soft)' : 'none',
                flexShrink: 0,
              }}
            />
            <span className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
              {isLive ? 'Live' : 'Paused'} · Ledger{' '}
              <span style={{ fontFamily: 'var(--font-mono)' }}>{lastLedger || '—'}</span>
            </span>
            <Wifi style={{ width: 14, height: 14, color: 'var(--color-ink-faint)' }} />
          </div>
        </div>

        <button
          onClick={() => setIsLive(!isLive)}
          className="btn-ghost w-fit"
          style={isLive ? {
            color: 'var(--color-success)',
            borderColor: 'rgba(34,197,94,0.3)',
            backgroundColor: 'var(--color-success-soft)',
          } : {}}
        >
          {isLive ? 'Pause Live' : 'Resume Live'}
        </button>
      </div>

      {/* Filter chips */}
      <div
        className="flex flex-wrap items-center"
        style={{ gap: 'var(--spacing-1)', marginBottom: 'var(--spacing-4)' }}
      >
        {filterOptions.map(({ value, label }) => {
          const active = filter === value;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
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

      {/* Event list */}
      <div className="ll-card" style={{ padding: 'var(--spacing-3)' }}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Events from the LumenLock contracts will appear here in real-time as they occur on-chain."
            icon={
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-trust-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Activity style={{ width: 28, height: 28, color: 'var(--color-trust)' }} />
              </div>
            }
            className="min-h-[320px] border-0 shadow-none bg-transparent"
          />
        ) : (
          <div>
            <p className="type-caption" style={{ color: 'var(--color-ink-faint)', marginBottom: 'var(--spacing-2)' }}>
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
