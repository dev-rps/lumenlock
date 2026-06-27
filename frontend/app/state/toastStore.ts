/**
 * Toast Notification Store — Zustand global state
 *
 * Manages premium transient notifications (toasts) displayed to the user.
 * Supports success, error, info, and warning states with auto-dismiss.
 */

import { create } from 'zustand';
import { nanoid } from './nanoid';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (type: ToastType, title: string, message: string, duration?: number) => string;
  removeToast: (id: string) => void;
  success: (title: string, message: string, duration?: number) => void;
  error: (title: string, message: string, duration?: number) => void;
  info: (title: string, message: string, duration?: number) => void;
  warning: (title: string, message: string, duration?: number) => void;
}

export const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],

  addToast: (type, title, message, duration = 4000) => {
    const id = nanoid();
    const item: ToastItem = { id, type, title, message, duration };
    set((state) => ({ toasts: [...state.toasts, item] }));

    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }

    return id;
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  success: (title, message, duration) => get().addToast('success', title, message, duration),
  error: (title, message, duration) => get().addToast('error', title, message, duration),
  info: (title, message, duration) => get().addToast('info', title, message, duration),
  warning: (title, message, duration) => get().addToast('warning', title, message, duration),
}));
