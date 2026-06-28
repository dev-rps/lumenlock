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
    <div className={`ll-card flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'var(--color-danger-soft)' }}
      >
        <AlertCircle className="w-7 h-7" style={{ color: 'var(--color-danger)' }} />
      </div>
      <h3
        className="type-heading mb-2"
        style={{ color: 'var(--color-ink)' }}
      >
        {title}
      </h3>
      {message && (
        <p className="type-body-sm mb-6 max-w-sm" style={{ color: 'var(--color-ink-muted)' }}>
          {message}
        </p>
      )}
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost">
          Try again
        </button>
      )}
    </div>
  );
}
