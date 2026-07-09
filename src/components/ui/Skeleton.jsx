import React from 'react';

/**
 * Shimmering skeleton loaders (uses the `.skeleton` utility from index.css).
 * Use while data is loading instead of spinners for a premium, layout-stable feel.
 */
export const Skeleton = ({ className = '', style }) => (
  <div className={`skeleton ${className}`} style={style} />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="skeleton h-3" style={{ width: `${92 - i * 14}%` }} />
    ))}
  </div>
);

export const SkeletonCard = ({ className = '' }) => (
  <div className={`glass-card p-5 ${className}`}>
    <div className="flex items-center gap-3">
      <div className="skeleton w-11 h-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-1/2" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  </div>
);

/** Grid of stat-tile skeletons that matches the StatCard layout. */
export const SkeletonStatGrid = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="glass-card p-5">
        <div className="skeleton h-3 w-2/3 mb-4" />
        <div className="skeleton h-8 w-1/2" />
      </div>
    ))}
  </div>
);

/** Vertical list of row skeletons (grievance lists, tables). */
export const SkeletonList = ({ rows = 5, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="glass-card p-4 flex items-center gap-4">
        <div className="skeleton w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-3/4" />
          <div className="skeleton h-2.5 w-1/2" />
        </div>
        <div className="skeleton h-6 w-16 rounded-full shrink-0" />
      </div>
    ))}
  </div>
);

export default Skeleton;
