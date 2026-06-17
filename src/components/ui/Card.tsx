import React from 'react';

// ─── Card ────────────────────────────────────────────────────────────────────

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Removes the default padding from CardContent */
  noPadding?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', noPadding: _noPadding, children, ...props }, ref) => (
    <div
      ref={ref}
      className={`
        luxury-card
        bg-white
        border border-[#E8D5C4]
        rounded-2xl
        shadow-[0_2px_20px_rgba(44,44,44,0.06)]
        overflow-hidden
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

// ─── CardHeader ──────────────────────────────────────────────────────────────

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`px-6 pt-6 pb-4 border-b border-[#E8D5C4]/60 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

// ─── CardTitle ───────────────────────────────────────────────────────────────

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className = '', as: Tag = 'h3', children, ...props }, ref) => (
    <Tag
      ref={ref}
      className={`text-lg font-semibold text-[#2C2C2C] leading-tight ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
);
CardTitle.displayName = 'CardTitle';

// ─── CardDescription ─────────────────────────────────────────────────────────

export interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  CardDescriptionProps
>(({ className = '', children, ...props }, ref) => (
  <p
    ref={ref}
    className={`mt-1 text-sm text-[#8A7A72] leading-relaxed ${className}`}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = 'CardDescription';

// ─── CardContent ─────────────────────────────────────────────────────────────

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={`px-6 py-5 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

// ─── CardFooter ──────────────────────────────────────────────────────────────

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Align footer content */
  align?: 'start' | 'center' | 'end' | 'between';
}

const alignMap: Record<NonNullable<CardFooterProps['align']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', align = 'end', children, ...props }, ref) => (
    <div
      ref={ref}
      className={`
        px-6 py-4
        border-t border-[#E8D5C4]/60
        flex items-center gap-3
        bg-[#FAF7F4]/50
        ${alignMap[align]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';
