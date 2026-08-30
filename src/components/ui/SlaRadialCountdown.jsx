import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export const SlaRadialCountdown = ({ createdAt, slaDueAt, status, size = 110, strokeWidth = 8 }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isBreached: false,
    percentRemaining: 100,
    label: ''
  });

  const isResolved = status === 'Resolved' || status === 'Closed';

  useEffect(() => {
    if (isResolved || !slaDueAt) return;

    const calculateTime = () => {
      const now = Date.now();
      const start = new Date(createdAt).getTime();
      const due = new Date(slaDueAt).getTime();
      const totalDuration = Math.max(1, due - start);
      const remaining = due - now;

      if (remaining <= 0) {
        const overdueHours = Math.abs(Math.floor(remaining / (1000 * 60 * 60)));
        setTimeLeft({
          hours: overdueHours,
          minutes: Math.abs(Math.floor((remaining / (1000 * 60)) % 60)),
          seconds: Math.abs(Math.floor((remaining / 1000) % 60)),
          isBreached: true,
          percentRemaining: 0,
          label: `Breached by ${overdueHours}h`
        });
      } else {
        const percent = Math.min(100, Math.max(0, (remaining / totalDuration) * 100));
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining / (1000 * 60)) % 60);
        const seconds = Math.floor((remaining / 1000) % 60);

        setTimeLeft({
          hours,
          minutes,
          seconds,
          isBreached: false,
          percentRemaining: percent,
          label: `${hours}h ${minutes}m left`
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [createdAt, slaDueAt, isResolved]);

  if (isResolved) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold">
        <ShieldCheck size={14} />
        <span>SLA Fulfilled & Resolved</span>
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft.percentRemaining / 100) * circumference;

  let colorClass = '#10b981'; // Emerald
  if (timeLeft.isBreached) {
    colorClass = '#ef4444'; // Red
  } else if (timeLeft.percentRemaining < 25) {
    colorClass = '#f43f5e'; // Rose
  } else if (timeLeft.percentRemaining < 50) {
    colorClass = '#f59e0b'; // Amber
  }

  return (
    <div className="inline-flex flex-col items-center p-3.5 rounded-2xl bg-surface/80 border border-border/80 shadow-sm backdrop-blur-md">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-slate-800/40"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colorClass}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          {timeLeft.isBreached ? (
            <>
              <AlertTriangle size={16} className="text-rose-400 animate-bounce" />
              <span className="text-[10px] font-mono font-black text-rose-400 uppercase mt-0.5">SLA OVERDUE</span>
              <span className="text-[9px] font-mono text-slate-400">+{timeLeft.hours}h</span>
            </>
          ) : (
            <>
              <span className="text-sm font-mono font-black text-foreground">
                {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[8px] font-mono font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Remaining</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-2 text-center">
        <span className={`inline-block text-[10px] font-mono font-bold uppercase tracking-wider ${timeLeft.isBreached ? 'text-rose-400 font-black' : 'text-slate-400'}`}>
          {timeLeft.label}
        </span>
      </div>
    </div>
  );
};

export default SlaRadialCountdown;
