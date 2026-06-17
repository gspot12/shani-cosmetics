'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium rounded-xl transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'select-none cursor-pointer',
  ],
  {
    variants: {
      variant: {
        primary: [
          'text-white',
          'bg-gradient-to-l from-[#B8960C] to-[#D4AF37]',
          'hover:from-[#A07A08] hover:to-[#C09A20]',
          'focus:ring-[#B8960C]',
          'shadow-sm hover:shadow-md',
          'active:scale-[0.98]',
        ],
        secondary: [
          'text-[#2C2C2C]',
          'bg-gradient-to-l from-[#C9A8A8] to-[#E8D5C4]',
          'hover:from-[#B8868A] hover:to-[#D4B8A8]',
          'focus:ring-[#C9A8A8]',
          'shadow-sm hover:shadow-md',
          'active:scale-[0.98]',
        ],
        outline: [
          'text-[#B8960C]',
          'bg-transparent',
          'border-2 border-[#B8960C]',
          'hover:bg-[#B8960C] hover:text-white',
          'focus:ring-[#B8960C]',
          'active:scale-[0.98]',
        ],
        ghost: [
          'text-[#4A4A4A]',
          'bg-transparent',
          'hover:bg-[#E8D5C4]/50',
          'focus:ring-[#C9A8A8]',
          'active:scale-[0.98]',
        ],
        danger: [
          'text-white',
          'bg-red-500',
          'hover:bg-red-600',
          'focus:ring-red-400',
          'shadow-sm hover:shadow-md',
          'active:scale-[0.98]',
        ],
      },
      size: {
        sm: 'text-sm px-3 py-1.5 h-8',
        md: 'text-sm px-5 py-2.5 h-10',
        lg: 'text-base px-7 py-3 h-12',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Spinner: React.FC<{ size: 'sm' | 'md' | 'lg' }> = ({ size }) => {
  const dim = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <svg
      className={`${dim} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant,
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`${buttonVariants({ variant, size })} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <Spinner size={size ?? 'md'} />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!loading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
