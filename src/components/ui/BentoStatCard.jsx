import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const BentoStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = null, // e.g. { value: '+14%', isPositive: true }
  accentColor = 'indigo', // 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan'
  beacon = false,
  className = ''
}) => {
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const accentStyles = {
    indigo: {
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      beaconColor: 'bg-indigo-400',
      glow: 'rgba(99, 102, 241, 0.15)'
    },
    emerald: {
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      beaconColor: 'bg-emerald-400',
      glow: 'rgba(16, 185, 129, 0.15)'
    },
    amber: {
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      beaconColor: 'bg-amber-400',
      glow: 'rgba(245, 158, 11, 0.15)'
    },
    rose: {
      iconBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      beaconColor: 'bg-rose-400',
      glow: 'rgba(244, 63, 94, 0.15)'
    },
    cyan: {
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      beaconColor: 'bg-cyan-400',
      glow: 'rgba(6, 182, 212, 0.15)'
    }
  };

  const activeAccent = accentStyles[accentColor] || accentStyles.indigo;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      style={{
        '--mouse-x': `${mousePos.x}px`,
        '--mouse-y': `${mousePos.y}px`
      }}
      className={`bento-glow-card p-5 flex flex-col justify-between text-left relative group ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {beacon && (
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${activeAccent.beaconColor} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${activeAccent.beaconColor}`} />
            </span>
          )}
          {Icon && (
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${activeAccent.iconBg}`}>
              <Icon size={16} />
            </div>
          )}
        </div>
      </div>

      <div className="my-3">
        <h3 className="text-3xl font-heading font-black text-foreground tracking-tight">
          {value}
        </h3>
      </div>

      <div className="flex items-center justify-between text-xs pt-2 border-t border-border/40">
        <span className="text-[11px] text-muted-foreground truncate max-w-[65%]">
          {subtitle}
        </span>
        {trend && (
          <div className={`flex items-center gap-1 font-mono text-[11px] font-bold ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BentoStatCard;
