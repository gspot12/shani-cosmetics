'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from './Button';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmDialogVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dialog heading */
  title: string;
  /** Body message */
  message: React.ReactNode;
  /** Label for the confirm button (default: "אישור") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "ביטול") */
  cancelLabel?: string;
  /** Controls the colour of the confirm button */
  variant?: ConfirmDialogVariant;
  /** Whether the confirm action is in a loading state */
  loading?: boolean;
  /** Called when the user clicks the confirm button */
  onConfirm: () => void;
  /** Called when the user cancels (optional – close is handled automatically) */
  onCancel?: () => void;
}

// ─── Icon per variant ─────────────────────────────────────────────────────────

const VariantIcon: React.FC<{ variant: ConfirmDialogVariant }> = ({ variant }) => {
  if (variant === 'danger')
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
    );

  if (variant === 'warning')
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    );

  // info
  return (
    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-sky-50 mb-4">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </div>
  );
};

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = 'אישור',
  cancelLabel = 'ביטול',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={[
            'fixed inset-0 z-50 bg-black/40 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          ].join(' ')}
        />

        <Dialog.Content
          dir="rtl"
          className={[
            'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100%-2rem)] max-w-sm',
            'bg-white rounded-2xl shadow-2xl border border-[#E8D5C4]',
            'p-6 flex flex-col items-center text-center',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'duration-200',
          ].join(' ')}
        >
          <VariantIcon variant={variant} />

          <Dialog.Title className="text-lg font-semibold text-[#2C2C2C] mb-2">
            {title}
          </Dialog.Title>

          <Dialog.Description asChild>
            <div className="text-sm text-[#8A7A72] leading-relaxed mb-6">
              {message}
            </div>
          </Dialog.Description>

          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              size="md"
              className="flex-1"
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelLabel}
            </Button>

            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              size="md"
              className="flex-1"
              onClick={handleConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfirmDialog;
