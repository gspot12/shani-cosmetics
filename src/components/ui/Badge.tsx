import React from 'react';

// ─── Appointment status type (mirrors the domain model) ──────────────────────

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'rescheduled';

// ─── Badge variants ───────────────────────────────────────────────────────────

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'gold'
  | 'rose';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Optionally render a small colored dot before the label */
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default:
    'bg-[#E8D5C4]/60 text-[#4A4A4A] border border-[#E8D5C4]',
  success:
    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning:
    'bg-amber-50 text-amber-700 border border-amber-200',
  error:
    'bg-red-50 text-red-600 border border-red-200',
  info:
    'bg-sky-50 text-sky-700 border border-sky-200',
  gold:
    'bg-[#B8960C]/10 text-[#B8960C] border border-[#B8960C]/30',
  rose:
    'bg-[#C9A8A8]/20 text-[#B8868A] border border-[#C9A8A8]/40',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[#8A7A72]',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-sky-500',
  gold: 'bg-[#B8960C]',
  rose: 'bg-[#C9A8A8]',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = 'default', size = 'md', dot = false, className = '', children, ...props },
    ref
  ) => (
    <span
      ref={ref}
      className={`
        inline-flex items-center font-medium rounded-full
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className={`inline-block rounded-full flex-shrink-0 w-1.5 h-1.5 ${dotColors[variant]}`}
        />
      )}
      {children}
    </span>
  )
);
Badge.displayName = 'Badge';

// ─── AppointmentStatusBadge ───────────────────────────────────────────────────

const statusConfig: Record<
  AppointmentStatus,
  { variant: BadgeVariant; label: string }
> = {
  pending: { variant: 'warning', label: 'ממתין לאישור' },
  confirmed: { variant: 'success', label: 'מאושר' },
  cancelled: { variant: 'error', label: 'בוטל' },
  completed: { variant: 'info', label: 'הושלם' },
  no_show: { variant: 'default', label: 'לא הגיע/ה' },
  rescheduled: { variant: 'gold', label: 'נקבע מחדש' },
};

export interface AppointmentStatusBadgeProps
  extends Omit<BadgeProps, 'variant' | 'children'> {
  status: AppointmentStatus;
}

export const AppointmentStatusBadge: React.FC<AppointmentStatusBadgeProps> = ({
  status,
  dot = true,
  ...props
}) => {
  const config = statusConfig[status] ?? { variant: 'default' as BadgeVariant, label: status };
  return (
    <Badge variant={config.variant} dot={dot} {...props}>
      {config.label}
    </Badge>
  );
};
