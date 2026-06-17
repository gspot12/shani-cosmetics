'use client';

import React from 'react';
import * as RadixSelect from '@radix-ui/react-select';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface SelectGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps {
  /** Current value (controlled) */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Called when value changes */
  onValueChange?: (value: string) => void;
  /** Flat list of options OR grouped options */
  options?: SelectOption[];
  /** Grouped options (takes priority over `options`) */
  groups?: SelectGroup[];
  /** Placeholder shown when nothing is selected */
  placeholder?: string;
  /** Label rendered above the select */
  label?: string;
  /** Error message */
  error?: string;
  /** Helper text shown when there is no error */
  helperText?: string;
  /** Disable the entire select */
  disabled?: boolean;
  /** Take full width of container */
  fullWidth?: boolean;
  /** Additional class for the trigger button */
  className?: string;
  /** Select name for forms */
  name?: string;
  /** Whether to show a clear/reset button when a value is selected */
  clearable?: boolean;
  /** Called when the user clears the selection */
  onClear?: () => void;
}

// ─── Chevron icon ─────────────────────────────────────────────────────────────

const ChevronDown: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Select ───────────────────────────────────────────────────────────────────

export const Select: React.FC<SelectProps> = ({
  value,
  defaultValue,
  onValueChange,
  options = [],
  groups = [],
  placeholder = 'בחר/י...',
  label,
  error,
  helperText,
  disabled = false,
  fullWidth = true,
  className = '',
  name,
}) => {
  const hasGroups = groups.length > 0;
  const inputId = label ? `select-${label.replace(/\s+/g, '-')}` : undefined;

  const triggerClasses = [
    'inline-flex items-center justify-between gap-2',
    'h-10 px-4 rounded-xl border transition-all duration-200',
    'text-sm text-right outline-none',
    'bg-white',
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    error
      ? 'border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-200'
      : 'border-[#E8D5C4] hover:border-[#C9A8A8] focus:border-[#B8960C] focus:ring-2 focus:ring-[#B8960C]/20',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const renderOption = (opt: SelectOption) => (
    <RadixSelect.Item
      key={opt.value}
      value={opt.value}
      disabled={opt.disabled}
      className={[
        'flex items-center justify-between gap-2',
        'px-3 py-2 text-sm rounded-lg cursor-pointer outline-none select-none',
        'text-[#2C2C2C]',
        opt.disabled
          ? 'opacity-40 cursor-not-allowed'
          : [
              'hover:bg-[#E8D5C4]/50',
              'data-[highlighted]:bg-[#E8D5C4]/60 data-[highlighted]:text-[#2C2C2C]',
              'data-[state=checked]:text-[#B8960C] data-[state=checked]:font-medium',
            ].join(' '),
      ].join(' ')}
    >
      <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="text-[#B8960C]">
        <CheckIcon />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`} dir="rtl">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#2C2C2C]">
          {label}
        </label>
      )}

      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
        name={name}
        dir="rtl"
      >
        <RadixSelect.Trigger id={inputId} className={triggerClasses}>
          <RadixSelect.Value
            placeholder={
              <span className="text-[#8A7A72]">{placeholder}</span>
            }
          />
          <RadixSelect.Icon className="text-[#8A7A72] flex-shrink-0">
            <ChevronDown />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            dir="rtl"
            position="popper"
            sideOffset={4}
            align="end"
            className={[
              'z-50 min-w-[var(--radix-select-trigger-width)]',
              'bg-white border border-[#E8D5C4] rounded-2xl shadow-lg',
              'overflow-hidden',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
              'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
              'duration-150',
            ].join(' ')}
          >
            <RadixSelect.ScrollUpButton className="flex items-center justify-center h-7 text-[#8A7A72] cursor-default">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </RadixSelect.ScrollUpButton>

            <RadixSelect.Viewport className="p-1.5">
              {hasGroups
                ? groups.map((group) => (
                    <RadixSelect.Group key={group.label}>
                      <RadixSelect.Label className="px-3 py-1.5 text-xs font-semibold text-[#8A7A72] uppercase tracking-wide">
                        {group.label}
                      </RadixSelect.Label>
                      {group.options.map(renderOption)}
                      <RadixSelect.Separator className="h-px bg-[#E8D5C4]/60 my-1" />
                    </RadixSelect.Group>
                  ))
                : options.map(renderOption)}
            </RadixSelect.Viewport>

            <RadixSelect.ScrollDownButton className="flex items-center justify-center h-7 text-[#8A7A72] cursor-default">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </RadixSelect.ScrollDownButton>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

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
};

export default Select;
