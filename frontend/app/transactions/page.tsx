'use client';

import { useTxStore } from '../state/txStore';
import type { TxRecord, TxStatus } from '../types';
import {
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Trash2,
  RefreshCcw,
  Copy,
} from 'lucide-react';

const statusConfig: Record<TxStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}> = {
  idle: { label: 'Idle', icon: Clock, color: 'text-zinc-400', bg: 'bg-zinc-400/10' },
  pending: { label: 'Pending', icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  processing: { label: 'Processing', icon: Loader2, color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  failed: { label: 'Failed', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
};

function TxRow({ tx }: { tx: TxRecord }) {
  const status = statusConfig[tx.status];
  const StatusIcon = status.icon;
  const isProcessing = tx.status === 'processing';

  const copyHash = () => {
    if (tx.hash) navigator.clipboard.writeText(tx.hash);
  };

  const timeStr = (date: Date) =>
    date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="flex items-start gap-4 py-5 border-b border-zinc-800/50 last:border-0">
      {/* Status Icon */}
      <div className={`w-10 h-10 rounded-xl ${status.bg} flex items-center justify-center shrink-0`}>
        <StatusIcon
          className={`w-5 h-5 ${status.color} ${isProcessing ? 'animate-spin' : ''}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-medium text-zinc-200 text-sm">{tx.description}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color} ${status.bg}`}>
            {status.label}
          </span>
        </div>

        {tx.hash && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-zinc-600 font-mono">
              {tx.hash.slice(0, 16)}...{tx.hash.slice(-8)}
            </p>
            <button
              onClick={copyHash}
              className="p-1 rounded text-zinc-700 hover:text-zinc-400 transition-colors"
              title="Copy hash"
            >
              <Copy className="w-3 h-3" />
            </button>
            {tx.explorerUrl && (
              <a
                href={tx.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors"
              >
                Explorer <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {tx.error && (
          <p className="text-xs text-red-400 mt-1 bg-red-400/10 px-2 py-1 rounded">
            {tx.error}
          </p>
        )}

        <p className="text-xs text-zinc-600 mt-1">{timeStr(tx.createdAt)}</p>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { transactions, clearCompleted } = useTxStore();
  const pendingCount = transactions.filter(
    (t) => t.status === 'pending' || t.status === 'processing',
  ).length;

  return (
    <div className="container-wide py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold">Transaction Center</h1>
          <p className="text-zinc-400 mt-1">
            {pendingCount > 0 ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                {pendingCount} transaction{pendingCount > 1 ? 's' : ''} in progress
              </span>
            ) : (
              `${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`
            )}
          </p>
        </div>
        <button
          onClick={clearCompleted}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-all text-sm w-fit"
          id="clear-completed-txs-btn"
        >
          <Trash2 className="w-4 h-4" />
          Clear Completed
        </button>
      </div>

      {/* Transaction Legend */}
      <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
        {Object.entries(statusConfig).filter(([k]) => k !== 'idle').map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="flex items-center gap-1.5 whitespace-nowrap">
              <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
              <span className="text-xs text-zinc-500">{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Transactions List */}
      <div className="glass-card p-6">
        {transactions.length === 0 ? (
          <div className="text-center py-16">
            <ArrowLeftRight className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-zinc-400 mb-2">No transactions yet</h3>
            <p className="text-sm text-zinc-600">
              Your transaction history will appear here after you interact with the marketplace.
            </p>
          </div>
        ) : (
          transactions.map((tx) => <TxRow key={tx.id} tx={tx} />)
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 glass-card p-4 border-cyan-500/20 bg-cyan-500/5">
        <p className="text-sm text-cyan-300 flex items-start gap-2">
          <RefreshCcw className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Transactions are polled every 2 seconds after submission until confirmed or failed.
            Confirmed transactions include a link to the Stellar Explorer.
          </span>
        </p>
      </div>
    </div>
  );
}
