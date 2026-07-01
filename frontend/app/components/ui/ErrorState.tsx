/**
 * ErrorState — Clear error message with retry button.
 * onRetry re-triggers the existing data fetch (passed from the calling page).
 */

import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className = '',
}: ErrorStateProps) {
  return (
    <div
      className={`ll-card flex flex-col items-center justify-center text-center ${className}`}
      style={{
        padding: 'var(--spacing-8) var(--spacing-4)',
        minHeight: '320px',
        gap: 'var(--spacing-2)',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-danger-soft)',
        }}
      >
        <AlertCircle style={{ width: 28, height: 28, color: 'var(--color-danger)' }} />
      </div>
      <h3 className="type-heading" style={{ color: 'var(--color-ink)' }}>
        {title}
      </h3>
      {message && (
        <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)', maxWidth: '40ch' }}>
          {message}
        </p>
      )}
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost" style={{ marginTop: 'var(--spacing-1)' }}>
          Try again
        </button>
      )}
    </div>
  );
}
