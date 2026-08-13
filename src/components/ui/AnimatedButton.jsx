import React from 'react';
import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  "inline-flex items-center justify-center font-bold text-xs uppercase tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden select-none group",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 border border-indigo-400/30 focus:ring-indigo-500 rounded-full",
        glow:
          "bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 text-white shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 border border-cyan-400/30 focus:ring-cyan-400 rounded-full",
        secondary:
          "bg-slate-900/90 text-slate-200 border border-white/10 hover:bg-slate-800 hover:text-white focus:ring-slate-500 shadow-sm rounded-full",
        outline:
          "bg-transparent border border-white/15 text-slate-300 hover:bg-slate-800/60 hover:text-white hover:border-white/30 focus:ring-slate-500 rounded-full",
        ghost:
          "bg-transparent text-slate-400 hover:bg-slate-800/40 hover:text-white focus:ring-slate-500 rounded-2xl",
        danger:
          "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 border border-rose-500/30 focus:ring-rose-500 rounded-full",
        success:
          "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 border border-emerald-500/30 focus:ring-emerald-500 rounded-full",
      },
      size: {
        xs: "px-3 py-1.5 text-[10px] gap-1.5",
        sm: "px-4 py-2 text-xs gap-2",
        md: "px-5 py-2.5 text-xs gap-2.5",
        lg: "px-6 py-3 text-xs gap-3",
        icon: "p-2.5 rounded-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export const AnimatedButton = ({
  children,
  className = '',
  variant,
  size,
  isLoading = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  disabled,
  onClick,
  type = 'button',
  ...props
}) => {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`${buttonVariants({ variant, size })} ${className}`}
      {...props}
    >
      {/* Background Hover Shimmer Sweep */}
      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        <>
          {LeftIcon && (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 -ml-1 transition-transform group-hover:scale-110">
              <LeftIcon className="w-3.5 h-3.5" />
            </div>
          )}
          
          <span>{children}</span>

          {RightIcon && (
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 -mr-1 transition-transform group-hover:translate-x-0.5 group-hover:scale-110">
              <RightIcon className="w-3.5 h-3.5" />
            </div>
          )}
        </>
      )}
    </motion.button>
  );
};

export default AnimatedButton;
