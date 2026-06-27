'use client';

import { useToastStore, type ToastItem, type ToastType } from '../../state/toastStore';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

const toastConfig: Record<ToastType, { icon: React.ComponentType<{ className?: string }>; color: string; border: string; bg: string }> = {
  success: { icon: CheckCircle2, color: 'text-green-400', border: 'border-green-500/20', bg: 'bg-green-950/80' },
  error: { icon: XCircle, color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-950/80' },
  warning: { icon: AlertCircle, color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-950/80' },
  info: { icon: Info, color: 'text-cyan-400', border: 'border-cyan-500/20', bg: 'bg-cyan-950/80' },
};

function Toast({ toast }: { toast: ToastItem }) {
  const { removeToast } = useToastStore();
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  return (
    <div className={`
      flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl w-80 max-w-full
      animate-fade-in transition-all duration-300
      ${config.bg} ${config.border}
    `}>
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.color}`} />
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-zinc-100 text-sm">{toast.title}</h4>
        <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-zinc-500 hover:text-zinc-300 transition-colors p-0.5 rounded-lg hover:bg-zinc-800/50"
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
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-h-[80vh] overflow-y-auto pointer-events-auto">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
