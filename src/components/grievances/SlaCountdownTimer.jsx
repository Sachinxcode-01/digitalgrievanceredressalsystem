import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export const SlaCountdownTimer = ({ 
  createdAt, 
  slaHours = 48, 
  status = 'Pending', 
  priority = 'Medium',
  escalationLevel = 1,
  className = '' 
}) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
    isBreached: false,
    percentRemaining: 100,
    totalSecondsRemaining: 0
  });

  const isResolved = ['Resolved', 'Closed', 'AUTO_RESOLVED', 'RESOLVED', 'CLOSED'].includes(status);

  useEffect(() => {
    if (!createdAt || isResolved) return;

    const calculateTime = () => {
      const created = new Date(createdAt).getTime();
      if (isNaN(created)) return;

      // Adjust SLA hours for priority or emergency
      let targetHours = slaHours;
      if (priority === 'High') targetHours = Math.min(slaHours, 24);
      if (priority === 'Emergency') targetHours = 2;

      const slaMs = targetHours * 60 * 60 * 1000;
      const deadline = created + slaMs;
      const now = Date.now();
      const diffMs = deadline - now;

      const isBreached = diffMs <= 0;
      const absDiff = Math.abs(diffMs);

      const hours = Math.floor(absDiff / (1000 * 60 * 60));
      const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

      const percent = Math.max(0, Math.min(100, Math.round((diffMs / slaMs) * 100)));

      setTimeLeft({
        hours,
        minutes,
        seconds,
        isBreached,
        percentRemaining: percent,
        totalSecondsRemaining: Math.floor(diffMs / 1000)
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt, slaHours, status, priority, isResolved]);

  if (isResolved) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold ${className}`}>
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>SLA Fulfilled & Resolved</span>
      </div>
    );
  }

  const { hours, minutes, seconds, isBreached, percentRemaining } = timeLeft;
  const pad = (n) => String(n).padStart(2, '0');

  // Urgency color schemes
  if (isBreached) {
    return (
      <motion.div 
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-mono font-bold shadow-md shadow-rose-500/10 ${className}`}
      >
        <AlertTriangle className="w-4 h-4 animate-bounce" />
        <span>SLA BREACHED: -{pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
        {escalationLevel > 1 && (
          <span className="px-1.5 py-0.5 rounded-md bg-rose-500 text-slate-950 font-sans text-[10px] font-black uppercase">
            Tier-{escalationLevel} Escalated
          </span>
        )}
      </motion.div>
    );
  }

  const isUrgent = percentRemaining < 25;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md transition-all ${
      isUrgent
        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
        : 'bg-primary-bright/10 border-primary-bright/30 text-primary-bright'
    } ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          isUrgent ? 'bg-amber-400' : 'bg-primary-bright'
        }`} />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          isUrgent ? 'bg-amber-500' : 'bg-primary-bright'
        }`} />
      </span>

      <Clock className="w-3.5 h-3.5" />
      <span className="font-mono text-xs font-bold">
        SLA: {pad(hours)}h {pad(minutes)}m {pad(seconds)}s left
      </span>

      {priority === 'High' && (
        <span className="flex items-center gap-0.5 text-[10px] font-sans font-bold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
          <Zap className="w-3 h-3" /> FastTrack
        </span>
      )}
    </div>
  );
};

export default SlaCountdownTimer;
