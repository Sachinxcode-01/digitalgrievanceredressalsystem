import React from 'react';
import { motion } from 'framer-motion';
import { staggerItem } from '../../lib/motion';
import { AnimatedCounter } from './AnimatedCounter';

/**
 * Premium dashboard stat tile: glass card, tone-colored icon chip, animated counter,
 * optional trend indicator and hint. Meant to be used inside a `staggerContainer`.
 *
 * Props:
 *   label, value, icon (lucide component), tone, hint, trend (number %),
 *   decimals, prefix, suffix, onClick
 */
const TONES = {
  primary: 'text-primary-bright bg-primary/10 border-primary/20',
  success: 'text-success bg-success/10 border-success/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  error: 'text-error bg-error/10 border-error/20',
  accent: 'text-accent bg-accent/10 border-accent/20',
  neutral: 'text-muted-foreground bg-muted/40 border-border'
};

export const StatCard = ({
  label,
  value = 0,
  icon: Icon,
  tone = 'primary',
  hint,
  trend,
  decimals = 0,
  prefix = '',
  suffix = '',
  onClick
}) => {
  const toneClass = TONES[tone] || TONES.primary;

  return (
    <motion.div
      variants={staggerItem}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick(e) : undefined}
      className={`glass-card card-3d group p-5 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <AnimatedCounter
              value={value}
              decimals={decimals}
              prefix={prefix}
              suffix={suffix}
              className="text-3xl font-black tracking-tight text-foreground"
            />
            {trend !== undefined && trend !== null && (
              <span className={`text-[11px] font-bold ${trend >= 0 ? 'text-success' : 'text-error'}`}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
              </span>
            )}
          </div>
          {hint && <p className="mt-1 text-[11px] text-muted-foreground truncate">{hint}</p>}
        </div>

        {Icon && (
          <div
            className={`shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${toneClass}`}
          >
            <Icon size={18} />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StatCard;
