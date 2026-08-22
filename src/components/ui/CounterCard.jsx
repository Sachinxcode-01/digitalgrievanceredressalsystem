import React from 'react';
import MotionCard from './MotionCard';
import AnimatedCounter from './AnimatedCounter';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const CounterCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = 'vs last period',
  gradient = 'from-indigo-500/20 to-blue-500/10',
  iconColor = 'text-indigo-400',
  prefix = '',
  suffix = '',
  decimals = 0,
  className = '',
}) => {
  const isPositive = trend > 0;

  return (
    <MotionCard className={`p-6 relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300 ${className}`}>
      {/* Background Radial Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${gradient} rounded-full blur-2xl pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
      
      {/* Top Edge Sheen */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-linear-to-r from-transparent via-white/15 to-transparent group-hover:via-indigo-400/40 transition-colors" />

      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl bg-slate-800/80 border border-white/10 ${iconColor} shadow-inner group-hover:scale-110 transition-transform`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-3xl lg:text-4xl font-heading font-black text-white tracking-tight">
          <AnimatedCounter value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
        </div>

        {trend !== undefined && (
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      {trendLabel && <p className="text-[10px] font-medium text-slate-500 mt-2">{trendLabel}</p>}
    </MotionCard>
  );
};

export default CounterCard;
