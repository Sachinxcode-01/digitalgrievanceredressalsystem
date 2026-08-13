import React from 'react';

export const ResponsiveTextBlock = ({
  eyebrow,
  title,
  subtitle,
  center = true,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${center ? 'text-center' : 'text-left'} ${className}`}>
      {eyebrow && (
        <div>
          <span className="inline-block text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-indigo-400 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30">
            {eyebrow}
          </span>
        </div>
      )}

      {title && (
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-heading font-black text-white tracking-tight leading-tight">
          {title}
        </h2>
      )}

      {subtitle && (
        <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default ResponsiveTextBlock;
