import React from 'react';
import { Button, type ButtonProps } from './Button';

// ─── Default icons ────────────────────────────────────────────────────────────

const DefaultIcon: React.FC = () => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="56" height="56" rx="16" fill="#E8D5C4" fillOpacity="0.5" />
    <path
      d="M18 28C18 22.477 22.477 18 28 18s10 4.477 10 10-4.477 10-10 10S18 33.523 18 28Z"
      stroke="#C9A8A8"
      strokeWidth="2"
    />
    <path
      d="M28 24v4M28 32h.01"
      stroke="#B8960C"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// ─── EmptyState ───────────────────────────────────────────────────────────────

export interface EmptyStateAction
  extends Omit<ButtonProps, 'children' | 'loading'> {
  label: string;
  loading?: boolean;
}

export interface EmptyStateProps {
  /** Custom icon node. Defaults to a decorative placeholder icon. */
  icon?: React.ReactNode;
  /** Primary heading */
  title: string;
  /** Explanatory paragraph */
  description?: string;
  /** One or more call-to-action buttons */
  actions?: EmptyStateAction[];
  /** Additional container class names */
  className?: string;
  /** Compact variant with less vertical padding */
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actions = [],
  className = '',
  compact = false,
}) => (
  <div
    className={`
      flex flex-col items-center justify-center text-center
      ${compact ? 'py-10 px-4' : 'py-20 px-6'}
      ${className}
    `}
    role="status"
    aria-live="polite"
  >
    {/* Icon */}
    <div className={`${compact ? 'mb-3' : 'mb-5'} opacity-90`}>
      {icon ?? <DefaultIcon />}
    </div>

    {/* Title */}
    <h3
      className={`font-semibold text-[#2C2C2C] ${compact ? 'text-base mb-1' : 'text-xl mb-2'}`}
    >
      {title}
    </h3>

    {/* Description */}
    {description && (
      <p
        className={`text-[#8A7A72] leading-relaxed max-w-sm ${compact ? 'text-sm mb-4' : 'text-sm mb-6'}`}
      >
        {description}
      </p>
    )}

    {/* Actions */}
    {actions.length > 0 && (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {actions.map(({ label, loading, ...btnProps }, i) => (
          <Button key={i} loading={loading} {...btnProps}>
            {label}
          </Button>
        ))}
      </div>
    )}
  </div>
);

// ─── Convenience presets ──────────────────────────────────────────────────────

const NoAppointmentsIcon: React.FC = () => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="56" height="56" rx="16" fill="#E8D5C4" fillOpacity="0.5" />
    <rect x="15" y="19" width="26" height="22" rx="4" stroke="#C9A8A8" strokeWidth="2" />
    <path d="M15 25h26" stroke="#C9A8A8" strokeWidth="2" />
    <path d="M21 15v6M35 15v6" stroke="#B8960C" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 32h12M22 36h8" stroke="#C9A8A8" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const NoClientsIcon: React.FC = () => (
  <svg
    width="56"
    height="56"
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect width="56" height="56" rx="16" fill="#E8D5C4" fillOpacity="0.5" />
    <circle cx="28" cy="23" r="7" stroke="#C9A8A8" strokeWidth="2" />
    <path
      d="M14 41c0-7.732 6.268-10 14-10s14 2.268 14 10"
      stroke="#B8960C"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export const NoAppointments: React.FC<Omit<EmptyStateProps, 'title' | 'icon'> & { title?: string }> = ({
  title = 'אין תורים להצגה',
  description = 'עדיין אין תורים קבועים. הוסיפי תור חדש כדי להתחיל.',
  ...props
}) => <EmptyState icon={<NoAppointmentsIcon />} title={title} description={description} {...props} />;

export const NoClients: React.FC<Omit<EmptyStateProps, 'title' | 'icon'> & { title?: string }> = ({
  title = 'אין לקוחות',
  description = 'טרם נוספו לקוחות למערכת.',
  ...props
}) => <EmptyState icon={<NoClientsIcon />} title={title} description={description} {...props} />;
