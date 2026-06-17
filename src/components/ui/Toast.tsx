'use client';

import { Toaster, toast } from 'sonner';

// ─── Toaster component (place once in your layout) ───────────────────────────

export const LuxuryToaster: React.FC = () => (
  <Toaster
    position="top-center"
    dir="rtl"
    richColors
    expand={false}
    duration={4000}
    toastOptions={{
      style: {
        fontFamily: "'Segoe UI', 'Arial Hebrew', Arial, sans-serif",
        direction: 'rtl',
        borderRadius: '14px',
        border: '1px solid #E8D5C4',
        boxShadow: '0 4px 24px rgba(44,44,44,0.10)',
        padding: '12px 16px',
        gap: '10px',
        fontSize: '14px',
      },
      classNames: {
        toast: 'font-medium',
        title: 'text-[#2C2C2C] font-semibold',
        description: 'text-[#8A7A72] text-sm',
      },
    }}
  />
);

// ─── showToast helpers ────────────────────────────────────────────────────────

export interface ToastOptions {
  description?: string;
  duration?: number;
  id?: string | number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const showToast = {
  success: (message: string, options?: ToastOptions) =>
    toast.success(message, {
      description: options?.description,
      duration: options?.duration,
      id: options?.id,
      action: options?.action
        ? { label: options.action.label, onClick: options.action.onClick }
        : undefined,
    }),

  error: (message: string, options?: ToastOptions) =>
    toast.error(message, {
      description: options?.description,
      duration: options?.duration ?? 6000,
      id: options?.id,
      action: options?.action
        ? { label: options.action.label, onClick: options.action.onClick }
        : undefined,
    }),

  info: (message: string, options?: ToastOptions) =>
    toast.info(message, {
      description: options?.description,
      duration: options?.duration,
      id: options?.id,
      action: options?.action
        ? { label: options.action.label, onClick: options.action.onClick }
        : undefined,
    }),

  warning: (message: string, options?: ToastOptions) =>
    toast.warning(message, {
      description: options?.description,
      duration: options?.duration,
      id: options?.id,
      action: options?.action
        ? { label: options.action.label, onClick: options.action.onClick }
        : undefined,
    }),

  /** Shows a loading toast; returns a toast id you can use to dismiss/update it */
  loading: (message: string, options?: Omit<ToastOptions, 'action'>) =>
    toast.loading(message, {
      description: options?.description,
      duration: options?.duration ?? Infinity,
      id: options?.id,
    }),

  /** Dismiss a toast by id */
  dismiss: (id?: string | number) => toast.dismiss(id),

  /** Update an existing toast (e.g. from loading -> success) */
  promise: toast.promise,
};
