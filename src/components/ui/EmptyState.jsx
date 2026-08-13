import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = ShieldAlert,
  title = 'No Records Found',
  message = 'There are no active items to display at this moment.',
  action,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center py-16 px-6 relative overflow-hidden rounded-2xl bg-slate-900/40 border border-white/10 ${className}`}
    >
      {/* Background Radial Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Animated Icon / Logo */}
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/80 border border-indigo-500/20 text-indigo-400 mb-5 shadow-xl shadow-indigo-500/10"
      >
        <Icon className="w-8 h-8" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-ping" />
      </motion.div>

      <h3 className="text-lg font-heading font-bold text-white tracking-wide">{title}</h3>
      {message && <p className="mt-2 text-xs text-slate-400 max-w-md leading-relaxed">{message}</p>}
      {action && <div className="mt-6 z-10">{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
