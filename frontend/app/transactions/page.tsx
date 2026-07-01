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

// ─── Responsive Premium Transaction Card ──────────────────────────────────────
function TxCard({ tx, onCopy, copied }: {
  tx: TxRecord;
  onCopy: (id: string, hash: string) => void;
  copied: string | null;
}) {
  const StatusIcon = statusIcon[tx.status];
  const isProcessing = tx.status === 'processing';

  return (
    <div
      className="ll-card flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200"
      style={{
        padding: 'var(--spacing-3)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-accent-border)';
        e.currentTarget.style.boxShadow = 'var(--shadow-raised)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {/* Left side: Icon + Main Info */}
      <div className="flex items-start gap-4 flex-1 min-w-0">
        {/* Status Icon Indicator Container */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            backgroundColor: tx.status === 'confirmed'
              ? 'var(--color-success-soft)'
              : tx.status === 'failed'
              ? 'var(--color-danger-soft)'
              : 'var(--color-surface-raised)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <StatusIcon
            className={isProcessing ? 'animate-spin' : ''}
            style={{
              width: 18,
              height: 18,
              color: tx.status === 'confirmed'
                ? 'var(--color-success)'
                : tx.status === 'failed'
                ? 'var(--color-danger)'
                : tx.status === 'pending'
                ? 'var(--color-warning)'
                : 'var(--color-ink-muted)',
            }}
          />
        </div>

        {/* Content detail */}
        <div className="min-w-0 flex-1">
          <h3
            className="type-body font-semibold truncate"
            style={{ color: 'var(--color-ink)', fontSize: '0.95rem' }}
          >
            {tx.description}
          </h3>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className="type-mono-sm" style={{ color: 'var(--color-ink-faint)' }}>
              {timeStr(tx.createdAt)}
            </span>
            {tx.hash && (
              <>
                <span className="type-body-sm" style={{ color: 'var(--color-ink-faint)' }}>•</span>
                <div className="flex items-center gap-1">
                  <span className="type-mono-sm" style={{ color: 'var(--color-ink-muted)' }}>
                    {tx.hash.slice(0, 10)}…{tx.hash.slice(-6)}
                  </span>
                  <button
                    onClick={() => onCopy(tx.id, tx.hash!)}
                    className="p-1 rounded transition-colors"
                    style={{ color: 'var(--color-ink-faint)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
                    aria-label="Copy transaction hash"
                  >
                    {copied === tx.id ? (
                      <Check style={{ width: 13, height: 13, color: 'var(--color-success)' }} />
                    ) : (
                      <Copy style={{ width: 13, height: 13 }} />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
          {tx.error && (
            <p
              className="text-xs px-2 py-1 rounded-md"
              style={{
                color: 'var(--color-danger)',
                backgroundColor: 'var(--color-danger-soft)',
                marginTop: 'var(--spacing-1)',
                display: 'inline-block',
              }}
            >
              {tx.error}
            </p>
          )}
        </div>
      </div>

      {/* Right side: Badge + Explorer Action */}
      <div className="flex items-center gap-3 justify-between md:justify-end border-t md:border-t-0 border-[var(--color-border)] pt-3 md:pt-0 shrink-0">
        <StatusBadge status={tx.status} />
        {tx.explorerUrl && (
          <a
            href={tx.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost flex items-center gap-1"
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: 'var(--radius-pill)' }}
          >
            Explorer
            <ExternalLink style={{ width: 12, height: 12 }} />
          </a>
        )}
      </div>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
          {transactions.map((tx) => (
            <TxCard key={tx.id} tx={tx} onCopy={handleCopy} copied={copied} />
          ))}
        </div>
      )}

      {/* Info note */}
      {transactions.length > 0 && (
        <div
          className="ll-card flex items-start gap-3"
          style={{
            padding: 'var(--spacing-2) var(--spacing-3)',
            marginTop: 'var(--spacing-4)',
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
