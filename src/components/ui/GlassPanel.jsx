import React from 'react';
import { motion } from 'framer-motion';

export const GlassPanel = ({
  children,
  className = '',
  intensity = 'medium', // 'light', 'medium', 'heavy'
  borderGlow = true,
  doubleBezel = false,
  onClick,
  ...props
}) => {
  const intensityMap = {
    light: 'bg-slate-900/40 backdrop-blur-md border-white/5',
    medium: 'bg-slate-900/70 backdrop-blur-xl border-white/10 shadow-2xl shadow-black/50',
    heavy: 'bg-slate-950/90 backdrop-blur-2xl border-white/15 shadow-2xl shadow-black/80',
  };

  if (doubleBezel) {
    return (
      <motion.div
        onClick={onClick}
        className={`
          relative rounded-[2rem] p-1.5 bg-white/5 border border-white/10 
          transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
          ${borderGlow ? 'hover:border-indigo-500/40 hover:shadow-indigo-500/10' : ''}
          ${className}
        `}
        {...props}
      >
        <div className="relative rounded-[calc(2rem-0.375rem)] bg-slate-950/90 backdrop-blur-xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden">
          {/* Top highlight line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
          <div className="relative z-10">{children}</div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onClick={onClick}
      className={`
        relative rounded-3xl border p-6 overflow-hidden 
        transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${intensityMap[intensity] || intensityMap.medium}
        ${borderGlow ? 'hover:border-indigo-500/30' : ''}
        ${className}
      `}
      {...props}
    >
      {/* Top subtle highlight line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

export default GlassPanel;
