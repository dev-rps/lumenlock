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
    <div className={`ll-card flex flex-col items-center justify-center py-20 px-8 text-center ${className}`}>
      <div className="mb-6">
        {icon ?? <SealIcon variant="static" size={72} />}
      </div>
      <h3
        className="type-heading mb-2"
        style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
      >
        {title}
      </h3>
      <p className="type-body-sm mb-8 max-w-xs" style={{ color: 'var(--color-ink-muted)' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
