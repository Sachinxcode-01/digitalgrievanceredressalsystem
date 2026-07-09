import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../../lib/motion';

/**
 * Friendly empty state: floating icon (or the ResolveNow mark), title, message,
 * and an optional call-to-action. Use for empty lists, no-results, and zero-data views.
 *
 * Props: icon (lucide component), title, message, action (ReactNode), className
 */
export const EmptyState = ({ icon: Icon, title, message, action, className = '' }) => (
  <motion.div
    variants={fadeInUp}
    initial="hidden"
    animate="show"
    className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}
  >
    <div className="w-16 h-16 rounded-2xl bg-muted/40 border border-border flex items-center justify-center mb-5 animate-float">
      {Icon ? (
        <Icon className="w-7 h-7 text-muted-foreground" />
      ) : (
        <img src="/favicon.svg" alt="ResolveNow" className="w-8 h-8 opacity-70" />
      )}
    </div>
    <h3 className="text-base font-bold text-foreground">{title}</h3>
    {message && <p className="mt-1.5 text-sm text-muted-foreground max-w-sm leading-relaxed">{message}</p>}
    {action && <div className="mt-5">{action}</div>}
  </motion.div>
);

export default EmptyState;
