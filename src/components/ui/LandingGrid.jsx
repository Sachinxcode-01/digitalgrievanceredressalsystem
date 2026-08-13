import React from 'react';

export const LandingGrid = ({
  children,
  cols = 3, // 2, 3, 4, 5
  className = '',
}) => {
  const colMap = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  };

  return (
    <div className={`grid ${colMap[cols] || colMap[3]} gap-6 w-full ${className}`}>
      {children}
    </div>
  );
};

export default LandingGrid;
