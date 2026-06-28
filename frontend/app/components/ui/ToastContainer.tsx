'use client';

import { useToastStore, type ToastItem, type ToastType } from '../../state/toastStore';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const toastConfig: Record<
  ToastType,
  {
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    borderColor: string;
    iconColor: string;
    titleColor: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    borderColor: 'var(--color-success)',
    iconColor: 'var(--color-success)',
    titleColor: 'var(--color-success)',
  },
  error: {
    icon: XCircle,
    borderColor: 'var(--color-danger)',
    iconColor: 'var(--color-danger)',
    titleColor: 'var(--color-danger)',
  },
  warning: {
    icon: AlertCircle,
    borderColor: 'var(--color-warning)',
    iconColor: 'var(--color-warning)',
    titleColor: 'var(--color-warning)',
  },
  info: {
    icon: Info,
    borderColor: 'var(--color-trust)',
    iconColor: 'var(--color-trust)',
    titleColor: 'var(--color-trust)',
  },
};

function Toast({ toast }: { toast: ToastItem }) {
  const { removeToast } = useToastStore();
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  return (
    <div
      className="ll-card animate-fade-up flex items-start gap-3 p-4 w-80 max-w-full"
      style={{
        borderLeft: `3px solid ${config.borderColor}`,
        boxShadow: 'var(--shadow-dropdown)',
      }}
      role="alert"
      aria-live="polite"
    >
      <Icon
        className="w-5 h-5 shrink-0 mt-0.5"
        style={{ color: config.iconColor }}
      />
      <div className="flex-1 min-w-0">
        <h4
          className="font-semibold text-sm"
          style={{ color: 'var(--color-ink)', fontFamily: 'var(--font-ui)' }}
        >
          {toast.title}
        </h4>
        <p
          className="text-xs mt-1 leading-relaxed"
          style={{ color: 'var(--color-ink-muted)' }}
        >
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-1 rounded transition-colors"
        style={{ color: 'var(--color-ink-faint)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-ink)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-faint)')}
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const { toasts } = useToastStore();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 max-h-[80vh] overflow-y-auto pointer-events-auto">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
