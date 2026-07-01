'use client';

import { useTxStore } from '../state/txStore';
import type { TxRecord, TxStatus } from '../types';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  ArrowLeftRight,
} from 'lucide-react';
import { useState } from 'react';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';

// ─── Status icons ─────────────────────────────────────────────────────────────
const statusIcon: Record<TxStatus, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  idle:       Clock,
  pending:    Clock,
  processing: Loader2,
  confirmed:  CheckCircle2,
  failed:     XCircle,
};

function timeStr(dateVal: Date | string): string {
  const date = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Transaction Row (desktop) ────────────────────────────────────────────────
function TxRow({ tx, onCopy, copied }: {
  tx: TxRecord;
  onCopy: (id: string, hash: string) => void;
  copied: string | null;
}) {
  const StatusIcon = statusIcon[tx.status];
  const isProcessing = tx.status === 'processing';

  return (
    <div
      className="grid gap-4 items-center transition-colors"
      style={{
        gridTemplateColumns: '1fr 2fr auto auto',
        padding: 'var(--spacing-2) var(--spacing-3)',
        borderBottom: '1px solid var(--color-border)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-raised)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Date */}
      <span className="type-mono-sm" style={{ color: 'var(--color-ink-faint)' }}>
        {timeStr(tx.createdAt)}
      </span>

      {/* Description + hash */}
      <div className="min-w-0">
        <p
          className="type-body-sm font-medium truncate"
          style={{ color: 'var(--color-ink)', marginBottom: 2 }}
        >
          {tx.description}
        </p>
        {tx.hash && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="type-mono-sm" style={{ color: 'var(--color-ink-faint)' }}>
              {tx.hash.slice(0, 12)}…{tx.hash.slice(-6)}
            </span>
            <button
              onClick={() => onCopy(tx.id, tx.hash!)}
              className="p-0.5 rounded transition-colors"
              style={{ color: 'var(--color-ink-faint)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
              aria-label="Copy transaction hash"
            >
              {copied === tx.id ? (
                <Check style={{ width: 12, height: 12, color: 'var(--color-success)' }} />
              ) : (
                <Copy style={{ width: 12, height: 12 }} />
              )}
            </button>
            {tx.explorerUrl && (
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-0.5 transition-colors"
                style={{ color: 'var(--color-accent)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent-bright)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
              >
                Explorer <ExternalLink style={{ width: 11, height: 11 }} />
              </a>
            )}
          </div>
        )}
        {tx.error && (
          <p
            className="text-xs mt-1 px-2 py-0.5 rounded"
            style={{ color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-soft)' }}
          >
            {tx.error}
          </p>
        )}
      </div>

      {/* Status badge */}
      <StatusBadge status={tx.status} />

      {/* Status icon */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-surface-raised)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <StatusIcon
          className={isProcessing ? 'animate-spin' : ''}
          style={{
            width: 15,
            height: 15,
            color: tx.status === 'confirmed'
              ? 'var(--color-success)'
              : tx.status === 'failed'
              ? 'var(--color-danger)'
              : tx.status === 'pending'
              ? 'var(--color-warning)'
              : 'var(--color-ink-faint)',
          }}
        />
      </div>
    </div>
  );
}

// ─── Mobile stacked card ──────────────────────────────────────────────────────
function TxCard({ tx, onCopy, copied }: {
  tx: TxRecord;
  onCopy: (id: string, hash: string) => void;
  copied: string | null;
}) {
  return (
    <div className="ll-card" style={{ padding: 'var(--spacing-2) var(--spacing-3)', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="flex items-start justify-between gap-3">
        <p className="type-body-sm font-medium flex-1" style={{ color: 'var(--color-ink)' }}>
          {tx.description}
        </p>
        <StatusBadge status={tx.status} />
      </div>

      {tx.hash && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="type-mono-sm" style={{ color: 'var(--color-ink-faint)' }}>
            {tx.hash.slice(0, 16)}…{tx.hash.slice(-8)}
          </span>
          <button
            onClick={() => onCopy(tx.id, tx.hash!)}
            className="p-0.5 rounded"
            style={{ color: 'var(--color-ink-faint)' }}
            aria-label="Copy transaction hash"
          >
            {copied === tx.id ? (
              <Check style={{ width: 12, height: 12, color: 'var(--color-success)' }} />
            ) : (
              <Copy style={{ width: 12, height: 12 }} />
            )}
          </button>
          {tx.explorerUrl && (
            <a
              href={tx.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-0.5"
              style={{ color: 'var(--color-accent)' }}
            >
              Explorer <ExternalLink style={{ width: 11, height: 11 }} />
            </a>
          )}
        </div>
      )}

      {tx.error && (
        <p
          className="text-xs px-2 py-1 rounded"
          style={{ color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-soft)' }}
        >
          {tx.error}
        </p>
      )}

      <p className="type-mono-sm" style={{ color: 'var(--color-ink-faint)' }}>
        {timeStr(tx.createdAt)}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const { transactions, clearCompleted } = useTxStore();
  const [copied, setCopied] = useState<string | null>(null);

  const pendingCount = transactions.filter(
    (t) => t.status === 'pending' || t.status === 'processing',
  ).length;

  const handleCopy = (id: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="container-wide" style={{ paddingTop: 'var(--spacing-8)', paddingBottom: 'var(--spacing-8)' }}>
      {/* Header */}
      <div
        className="flex flex-col md:flex-row md:items-end justify-between"
        style={{ gap: 'var(--spacing-3)', marginBottom: 'var(--spacing-6)' }}
      >
        <div>
          <p className="type-caption" style={{ color: 'var(--color-accent)', marginBottom: 'var(--spacing-1)' }}>
            ON-CHAIN ACTIVITY
          </p>
          <h1 className="type-display-lg" style={{ color: 'var(--color-ink)', marginBottom: 'var(--spacing-1)' }}>
            Transaction Center
          </h1>
          <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
            {pendingCount > 0 ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" style={{ width: 14, height: 14, color: 'var(--color-accent)' }} />
                {pendingCount} transaction{pendingCount > 1 ? 's' : ''} in progress
              </span>
            ) : (
              `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>
        <button
          onClick={clearCompleted}
          className="btn-ghost w-fit"
          id="clear-completed-txs-btn"
        >
          <Trash2 style={{ width: 15, height: 15 }} />
          Clear Completed
        </button>
      </div>

      {/* Content */}
      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Your transaction history will appear here after you interact with the marketplace."
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
              <ArrowLeftRight style={{ width: 28, height: 28, color: 'var(--color-trust)' }} />
            </div>
          }
          className="min-h-[400px]"
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="ll-card overflow-hidden hidden md:block">
            {/* Table header */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: '1fr 2fr auto auto',
                padding: 'var(--spacing-1) var(--spacing-3)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              {['Date', 'Description / Hash', 'Status', ''].map((col) => (
                <span key={col} className="type-caption" style={{ color: 'var(--color-ink-faint)' }}>
                  {col}
                </span>
              ))}
            </div>
            {/* Rows */}
            <div>
              {transactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} onCopy={handleCopy} copied={copied} />
              ))}
            </div>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
            {transactions.map((tx) => (
              <TxCard key={tx.id} tx={tx} onCopy={handleCopy} copied={copied} />
            ))}
          </div>
        </>
      )}

      {/* Info note */}
      {transactions.length > 0 && (
        <div
          className="ll-card flex items-start gap-3"
          style={{
            padding: 'var(--spacing-2) var(--spacing-3)',
            marginTop: 'var(--spacing-3)',
            backgroundColor: 'var(--color-surface-raised)',
            borderColor: 'var(--color-border-strong)',
          }}
        >
          <Loader2 style={{ width: 15, height: 15, flexShrink: 0, marginTop: 2, color: 'var(--color-accent)' }} />
          <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
            Transactions are polled every 2 seconds after submission until confirmed or failed.
            Confirmed transactions include a link to the Stellar Explorer.
          </p>
        </div>
      )}
    </div>
  );
}
