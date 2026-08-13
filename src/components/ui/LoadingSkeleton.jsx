import React from 'react';
import { Skeleton, SkeletonText, SkeletonCard, SkeletonStatGrid, SkeletonList } from './Skeleton';

export const LoadingSkeleton = ({ variant = 'card', count = 1, className = '' }) => {
  if (variant === 'text') return <SkeletonText lines={count} className={className} />;
  if (variant === 'stats') return <SkeletonStatGrid count={count} className={className} />;
  if (variant === 'list') return <SkeletonList rows={count} className={className} />;
  
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export { Skeleton, SkeletonText, SkeletonCard, SkeletonStatGrid, SkeletonList };
export default LoadingSkeleton;
