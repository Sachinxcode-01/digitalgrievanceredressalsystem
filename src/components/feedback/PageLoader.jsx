import React from 'react';

/**
 * Enterprise PageLoader component.
 * Used as fallback across lazy-loaded route boundaries.
 */
export const PageLoader = ({ message = 'Loading Secure Module...' }) => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 px-4">
    <div className="relative w-12 h-12">
      <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
    <p className="text-slate-400 font-medium animate-pulse uppercase tracking-widest text-xs select-none">
      {message}
    </p>
  </div>
);

export default PageLoader;
