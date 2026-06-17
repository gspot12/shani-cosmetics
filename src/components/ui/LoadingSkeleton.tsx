import React from 'react';

// ─── Base Skeleton ────────────────────────────────────────────────────────────

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Explicit width (Tailwind class or inline style handled via className) */
  width?: string;
  /** Explicit height */
  height?: string;
  /** Rounded pill shape */
  circle?: boolean;
  /** Remove the shimmer animation */
  noAnimation?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width,
  height,
  circle = false,
  noAnimation = false,
  style,
  ...props
}) => (
  <div
    className={`
      bg-[#E8D5C4]/60
      ${circle ? 'rounded-full' : 'rounded-lg'}
      ${noAnimation ? '' : 'animate-pulse'}
      ${className}
    `}
    style={{ width, height, ...style }}
    aria-hidden="true"
    {...props}
  />
);

// ─── Composed skeletons for common UI patterns ────────────────────────────────

/** Skeleton for a single text line */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = '',
}) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="14px"
        className={`w-full ${i === lines - 1 && lines > 1 ? 'w-3/4' : ''}`}
      />
    ))}
  </div>
);

/** Skeleton for an avatar / profile image */
export const SkeletonAvatar: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const dims: Record<string, string> = { sm: '32px', md: '40px', lg: '56px' };
  const d = dims[size];
  return <Skeleton circle width={d} height={d} className={className} />;
};

/** Skeleton for a Card */
export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <div
    className={`
      luxury-card p-6 flex flex-col gap-4
      ${className}
    `}
  >
    <div className="flex items-center gap-3">
      <SkeletonAvatar size="md" />
      <div className="flex-1 flex flex-col gap-2">
        <Skeleton height="16px" className="w-1/2" />
        <Skeleton height="12px" className="w-1/3" />
      </div>
    </div>
    <SkeletonText lines={3} />
    <div className="flex gap-2 mt-1">
      <Skeleton height="32px" className="w-24 rounded-xl" />
      <Skeleton height="32px" className="w-20 rounded-xl" />
    </div>
  </div>
);

/** Skeleton for a table row */
export const SkeletonTableRow: React.FC<{
  cols?: number;
  className?: string;
}> = ({ cols = 4, className = '' }) => (
  <div className={`flex items-center gap-4 py-3 px-4 ${className}`}>
    {Array.from({ length: cols }).map((_, i) => (
      <Skeleton
        key={i}
        height="14px"
        className={i === 0 ? 'w-1/4' : 'flex-1'}
      />
    ))}
  </div>
);

/** Full page loading overlay */
export const SkeletonPage: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="flex flex-col gap-4 p-6">
    <Skeleton height="32px" className="w-48 mb-2" />
    {Array.from({ length: rows }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
