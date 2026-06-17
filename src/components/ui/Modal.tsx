'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Modal heading */
  title?: React.ReactNode;
  /** Subtitle / description text */
  description?: React.ReactNode;
  /** Content inside the modal body */
  children?: React.ReactNode;
  /** Footer content (action buttons, etc.) */
  footer?: React.ReactNode;
  /** Width variant */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Hide the default close (×) button */
  hideClose?: boolean;
  /** Called when the user explicitly clicks the close button */
  onClose?: () => void;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-[95vw]',
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  hideClose = false,
  onClose,
}) => {
  const handleClose = () => {
    onClose?.();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay
          className={[
            'fixed inset-0 z-50',
            'bg-black/40 backdrop-blur-sm',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          ].join(' ')}
        />

        {/* Content */}
        <Dialog.Content
          dir="rtl"
          className={[
            'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'w-[calc(100%-2rem)]',
            sizeClasses[size],
            'bg-white rounded-2xl shadow-2xl',
            'border border-[#E8D5C4]',
            'flex flex-col max-h-[90vh]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            'duration-200',
          ].join(' ')}
        >
          {/* Header */}
          {(title || !hideClose) && (
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-[#E8D5C4]/60 flex-shrink-0">
              <div className="flex-1 min-w-0">
                {title && (
                  <Dialog.Title className="text-lg font-semibold text-[#2C2C2C] leading-tight">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="mt-1 text-sm text-[#8A7A72] leading-relaxed">
                    {description}
                  </Dialog.Description>
                )}
              </div>

              {!hideClose && (
                <Dialog.Close asChild>
                  <button
                    onClick={handleClose}
                    aria-label="סגור"
                    className={[
                      'flex-shrink-0 rounded-lg p-1.5 -mt-0.5 -ml-0.5',
                      'text-[#8A7A72] hover:text-[#2C2C2C]',
                      'hover:bg-[#E8D5C4]/40 transition-colors duration-150',
                      'focus:outline-none focus:ring-2 focus:ring-[#B8960C]/30',
                    ].join(' ')}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </Dialog.Close>
              )}
            </div>
          )}

          {/* Scrollable body */}
          {children && (
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          )}

          {/* Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-[#E8D5C4]/60 bg-[#FAF7F4]/50 flex items-center justify-end gap-3 flex-shrink-0 rounded-b-2xl">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;
