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

// ─── Transaction Row (desktop) ────────────────────────────────────────────────
function TxRow({ tx, onCopy, copied }: {
  tx: TxRecord;
  onCopy: (id: string, hash: string) => void;
  copied: string | null;
}) {
  const StatusIcon = statusIcon[tx.status];
  const isProcessing = tx.status === 'processing';

  const timeStr = (date: Date) =>
    date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div
      className="grid gap-4 items-center px-4 py-3.5 transition-colors rounded-lg"
      style={{
        gridTemplateColumns: '1fr 2fr auto auto',
        borderBottom: '1px solid var(--color-border)',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface-sunken)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Date */}
      <span
        className="text-xs"
        style={{ color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}
      >
        {timeStr(tx.createdAt)}
      </span>

      {/* Description + hash + error */}
      <div className="min-w-0">
        <p
          className="text-sm font-medium truncate mb-0.5"
          style={{ color: 'var(--color-ink)' }}
        >
          {tx.description}
        </p>
        {tx.hash && (
          <div className="flex items-center gap-2">
            <span
              className="text-xs"
              style={{ color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}
            >
              {tx.hash.slice(0, 12)}…{tx.hash.slice(-6)}
            </span>
            <button
              onClick={() => onCopy(tx.id, tx.hash!)}
              className="p-0.5 rounded transition-colors"
              style={{ color: 'var(--color-ink-faint)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
              aria-label="Copy transaction hash"
            >
              {copied === tx.id ? (
                <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            {tx.explorerUrl && (
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-0.5 transition-colors"
                style={{ color: 'var(--color-trust)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-trust-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-trust)')}
              >
                Explorer <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
        {tx.error && (
          <p
            className="text-xs mt-1 px-2 py-0.5 rounded"
            style={{
              color: 'var(--color-danger)',
              backgroundColor: 'var(--color-danger-soft)',
            }}
          >
            {tx.error}
          </p>
        )}
      </div>

      {/* Status badge */}
      <StatusBadge status={tx.status} />

      {/* Status icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-surface-sunken)' }}
      >
        <StatusIcon
          className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`}
          style={{
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
  const timeStr = (date: Date) =>
    date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="ll-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium flex-1" style={{ color: 'var(--color-ink)' }}>
          {tx.description}
        </p>
        <StatusBadge status={tx.status} />
      </div>

      {tx.hash && (
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs"
            style={{ color: 'var(--color-ink-faint)', fontFamily: 'var(--font-mono)' }}
          >
            {tx.hash.slice(0, 16)}…{tx.hash.slice(-8)}
          </span>
          <button
            onClick={() => onCopy(tx.id, tx.hash!)}
            className="p-0.5 rounded"
            style={{ color: 'var(--color-ink-faint)' }}
            aria-label="Copy transaction hash"
          >
            {copied === tx.id ? (
              <Check className="w-3 h-3" style={{ color: 'var(--color-success)' }} />
            ) : (
              <Copy className="w-3 h-3" />
            )}
          </button>
          {tx.explorerUrl && (
            <a
              href={tx.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-0.5"
              style={{ color: 'var(--color-trust)' }}
            >
              Explorer <ExternalLink className="w-3 h-3" />
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

      <p className="type-caption" style={{ color: 'var(--color-ink-faint)', textTransform: 'none', letterSpacing: 0 }}>
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
    <div className="container-wide py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <p className="type-caption mb-2" style={{ color: 'var(--color-accent)' }}>
            On-chain activity
          </p>
          <h1
            className="type-display-lg mb-1"
            style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
          >
            Transaction Center
          </h1>
          <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
            {pendingCount > 0 ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-trust)' }} />
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
          <Trash2 className="w-4 h-4" />
          Clear Completed
        </button>
      </div>

      {/* Desktop table */}
      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Your transaction history will appear here after you interact with the marketplace."
          icon={
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-trust-soft)' }}
            >
              <ArrowLeftRight className="w-7 h-7" style={{ color: 'var(--color-trust)' }} />
            </div>
          }
        />
      ) : (
        <>
          {/* Desktop table layout */}
          <div className="ll-card overflow-hidden hidden md:block">
            {/* Table header */}
            <div
              className="grid gap-4 px-4 py-3"
              style={{
                gridTemplateColumns: '1fr 2fr auto auto',
                backgroundColor: 'var(--color-surface-sunken)',
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
            <div className="p-2">
              {transactions.map((tx) => (
                <TxRow key={tx.id} tx={tx} onCopy={handleCopy} copied={copied} />
              ))}
            </div>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-3">
            {transactions.map((tx) => (
              <TxCard key={tx.id} tx={tx} onCopy={handleCopy} copied={copied} />
            ))}
          </div>
        </>
      )}

      {/* Info note */}
      {transactions.length > 0 && (
        <div
          className="mt-6 ll-card p-4 flex items-start gap-3"
          style={{
            backgroundColor: 'var(--color-trust-soft)',
            borderColor: 'rgba(43,58,143,0.15)',
          }}
        >
          <Loader2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--color-trust)' }} />
          <p className="type-body-sm" style={{ color: 'var(--color-trust)' }}>
            Transactions are polled every 2 seconds after submission until confirmed or failed.
            Confirmed transactions include a link to the Stellar Explorer.
          </p>
        </div>
      )}
    </div>
  );
}
