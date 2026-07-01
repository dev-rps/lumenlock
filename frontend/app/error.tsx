'use client';

import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center flex flex-col items-center" style={{ gap: 'var(--spacing-3)', maxWidth: '40ch' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'var(--color-danger-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle style={{ width: 28, height: 28, color: 'var(--color-danger)' }} />
        </div>
        <h2 className="type-heading" style={{ color: 'var(--color-ink)' }}>
          Something went wrong
        </h2>
        <p className="type-body-sm" style={{ color: 'var(--color-ink-muted)' }}>
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="btn-primary"
          id="error-reset-btn"
          style={{ marginTop: 'var(--spacing-1)' }}
        >
          <RefreshCcw style={{ width: 15, height: 15 }} />
          Try Again
        </button>
      </div>
    </div>
  );
}
