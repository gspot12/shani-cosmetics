'use client';

import React from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TabItem {
  value: string;
  label: React.ReactNode;
  /** Optional icon shown before the label */
  icon?: React.ReactNode;
  /** Badge / count to show after the label */
  badge?: React.ReactNode;
  /** Disable this specific tab */
  disabled?: boolean;
}

export interface TabsProps {
  /** Currently active tab value */
  value: string;
  /** Called when the user switches tabs */
  onValueChange: (value: string) => void;
  /** Tab definitions */
  tabs: TabItem[];
  /** Tab content panels — keyed by value */
  children?: React.ReactNode;
  /** Additional class for the root element */
  className?: string;
  /** Additional class for the tab list */
  listClassName?: string;
  /** Visual style variant */
  variant?: 'underline' | 'pill' | 'card';
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export const Tabs: React.FC<TabsProps> = ({
  value,
  onValueChange,
  tabs,
  children,
  className = '',
  listClassName = '',
  variant = 'underline',
}) => {
  const listBase = 'flex items-center gap-1';

  const listVariantClasses: Record<string, string> = {
    underline: 'border-b border-[#E8D5C4]',
    pill: 'bg-[#E8D5C4]/30 rounded-2xl p-1',
    card: 'bg-[#FAF7F4] rounded-xl p-1 border border-[#E8D5C4]',
  };

  const triggerBase =
    'flex items-center gap-1.5 font-medium text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B8960C]/40 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

  const triggerVariantClasses: Record<string, string> = {
    underline: [
      'px-1 pb-3 pt-1 border-b-2 border-transparent -mb-px',
      'text-[#8A7A72]',
      'hover:text-[#2C2C2C]',
      'data-[state=active]:border-[#B8960C] data-[state=active]:text-[#B8960C]',
    ].join(' '),
    pill: [
      'px-4 py-2 rounded-xl',
      'text-[#4A4A4A]',
      'hover:text-[#2C2C2C] hover:bg-white/60',
      'data-[state=active]:bg-white data-[state=active]:text-[#2C2C2C] data-[state=active]:shadow-sm',
    ].join(' '),
    card: [
      'px-4 py-2 rounded-lg',
      'text-[#8A7A72]',
      'hover:text-[#2C2C2C]',
      'data-[state=active]:bg-white data-[state=active]:text-[#B8960C] data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-[#E8D5C4]',
    ].join(' '),
  };

  return (
    <RadixTabs.Root
      dir="rtl"
      value={value}
      onValueChange={onValueChange}
      className={`flex flex-col ${className}`}
    >
      <RadixTabs.List
        className={`${listBase} ${listVariantClasses[variant]} ${listClassName}`}
        aria-label="ניווט בלשוניות"
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={`${triggerBase} ${triggerVariantClasses[variant]}`}
          >
            {tab.icon && (
              <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="mr-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full bg-[#B8960C]/15 text-[#B8960C]">
                {tab.badge}
              </span>
            )}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {children}
    </RadixTabs.Root>
  );
};

// ─── TabPanel (re-export Radix Content with styling) ─────────────────────────

export interface TabPanelProps extends RadixTabs.TabsContentProps {
  /** Extra padding variant */
  padded?: boolean;
}

export const TabPanel: React.FC<TabPanelProps> = ({
  className = '',
  padded = true,
  children,
  ...props
}) => (
  <RadixTabs.Content
    className={[
      'flex-1 outline-none',
      'data-[state=active]:animate-in data-[state=inactive]:animate-out',
      'data-[state=active]:fade-in-0 data-[state=inactive]:fade-out-0',
      'duration-150',
      padded ? 'pt-5' : '',
      className,
    ].join(' ')}
    {...props}
  >
    {children}
  </RadixTabs.Content>
);
