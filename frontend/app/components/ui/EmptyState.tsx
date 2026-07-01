/**
 * EmptyState — Invitation-style empty state with SealIcon, message, and optional CTA.
 * Used across Marketplace, Dashboard, Activity, Transactions pages.
 */

import { SealIcon } from './SealIcon';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  /** Override the icon entirely */
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`ll-card flex flex-col items-center justify-center text-center ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        minHeight: '400px',
        padding: 'var(--spacing-6) var(--spacing-4)',
        gap: 'var(--spacing-2)',
      }}
    >
      <div>
        {icon ?? <SealIcon variant="static" size={72} />}
      </div>
      <h3
        className="type-heading"
        style={{
          color: 'var(--color-ink)',
          fontFamily: 'var(--font-display)',
        }}
      >
        {title}
      </h3>
      <p
        className="type-body-sm max-w-xs"
        style={{ color: 'var(--color-ink-muted)' }}
      >
        {description}
      </p>
      {action && <div style={{ marginTop: 'var(--spacing-1)' }}>{action}</div>}
    </div>
  );
}
