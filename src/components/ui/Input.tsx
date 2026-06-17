import React from 'react';

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Hebrew label displayed above the input */
  label?: string;
  /** Error message shown below the input (also styles the border red) */
  error?: string;
  /** Helper / hint text shown below the input when there is no error */
  helperText?: string;
  /** Icon rendered on the right side (RTL start) */
  startIcon?: React.ReactNode;
  /** Icon rendered on the left side (RTL end) */
  endIcon?: React.ReactNode;
  /** Visual size variant */
  inputSize?: 'sm' | 'md' | 'lg';
  /** Makes the full container take 100% width */
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startIcon,
      endIcon,
      inputSize = 'md',
      fullWidth = true,
      className = '',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id ?? (label ? `input-${label.replace(/\s+/g, '-')}` : undefined);

    const sizeClasses: Record<string, string> = {
      sm: 'h-8 text-sm px-3',
      md: 'h-10 text-sm px-4',
      lg: 'h-12 text-base px-4',
    };

    const baseInputClasses = [
      'w-full rounded-xl border transition-all duration-200 outline-none',
      'bg-white text-[#2C2C2C] placeholder:text-[#8A7A72]',
      'focus:ring-2 focus:ring-offset-0',
      disabled ? 'opacity-50 cursor-not-allowed bg-[#FAF7F4]' : '',
      error
        ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
        : 'border-[#E8D5C4] focus:border-[#B8960C] focus:ring-[#B8960C]/20',
      startIcon ? 'pr-10' : '',
      endIcon ? 'pl-10' : '',
      sizeClasses[inputSize],
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#2C2C2C]"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {/* RTL: start icon appears on the right */}
          {startIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A7A72] pointer-events-none">
              {startIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`${baseInputClasses} ${className}`}
            {...props}
          />

          {/* RTL: end icon appears on the left */}
          {endIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7A72] pointer-events-none">
              {endIcon}
            </span>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-500 mt-0.5" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p className="text-xs text-[#8A7A72] mt-0.5">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
