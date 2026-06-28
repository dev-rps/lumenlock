/**
 * StatusBadge — Escrow/listing status badge.
 * Maps status strings → token color classes (never color alone — always text + color).
 * Used across Marketplace, Dashboard, Activity, Transactions pages.
 */

import type { ListingStatus, EscrowState, TxStatus } from '../../types';

type BadgeVariant = ListingStatus | EscrowState | TxStatus | 'idle';

const BADGE_CLASS_MAP: Record<string, string> = {
  // Listing status
  Active:    'badge-active',
  Locked:    'badge-locked',
  Completed: 'badge-completed',
  Refunded:  'badge-refunded',
  Disputed:  'badge-disputed',

  // Escrow state
  Created:           'badge-created',
  Funded:            'badge-funded',
  Released:          'badge-released',
  PartiallyReleased: 'badge-partially-released',
  Resolved:          'badge-resolved',

  // Tx status
  idle:       '',
  pending:    'badge-pending',
  processing: 'badge-processing',
  confirmed:  'badge-confirmed',
  failed:     'badge-failed',
};

const BADGE_LABEL_MAP: Record<string, string> = {
  Active:    'Active',
  Locked:    'Locked',
  Completed: 'Completed',
  Refunded:  'Refunded',
  Disputed:  'Disputed',

  Created:           'Pending Funding',
  Funded:            'Awaiting Confirmation',
  Released:          'Settled',
  PartiallyReleased: 'In Progress',
  Resolved:          'Resolved',

  idle:       'Idle',
  pending:    'Pending',
  processing: 'Processing',
  confirmed:  'Confirmed',
  failed:     'Failed',
};

interface StatusBadgeProps {
  status: BadgeVariant;
  /** Override the display label */
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const cls = BADGE_CLASS_MAP[status] ?? '';
  const displayLabel = label ?? BADGE_LABEL_MAP[status] ?? status;
  if (!cls) return null;

  return (
    <span className={`badge-base ${cls} ${className}`}>
      {displayLabel}
    </span>
  );
}
