import React from 'react';
import { motion } from 'framer-motion';

export const StatusBadge = ({ status = 'Pending', className = '' }) => {
  const normStatus = (status || '').toLowerCase().replace(/[^a-z]/g, '');

  const getConfig = () => {
    switch (normStatus) {
      case 'autoresolved':
        return {
          label: '⚡ AUTO-RESOLVED',
          badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-emerald-500/20 shadow-md ring-1 ring-emerald-500/30',
          dotClass: 'bg-emerald-300 animate-pulse',
        };
      case 'emergencysos':
      case 'emergency':
        return {
          label: '🚨 EMERGENCY SOS',
          badgeClass: 'bg-red-500/20 text-red-300 border-red-500/50 shadow-red-500/30 shadow-lg ring-1 ring-red-500/40',
          dotClass: 'bg-red-400 animate-ping',
        };
      case 'resolved':
      case 'closed':
        return {
          label: 'RESOLVED',
          badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10',
          dotClass: 'bg-emerald-400',
        };
      case 'inprogress':
      case 'underreview':
      case 'activesync':
      case 'assigned':
        return {
          label: 'IN PROGRESS',
          badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10',
          dotClass: 'bg-amber-400 animate-pulse',
        };
      case 'escalated':
      case 'urgent':
        return {
          label: 'ESCALATED',
          badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-500/10',
          dotClass: 'bg-rose-400 animate-ping',
        };
      case 'rejected':
      case 'cancelled':
        return {
          label: 'REJECTED',
          badgeClass: 'bg-slate-800 text-slate-400 border-slate-700',
          dotClass: 'bg-slate-500',
        };
      case 'pending':
      case 'submitted':
      default:
        return {
          label: 'PENDING',
          badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-indigo-500/10',
          dotClass: 'bg-indigo-400 animate-pulse',
        };
    }
  };

  const config = getConfig();

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 border text-[10px] font-mono font-bold uppercase tracking-wider rounded-full shadow-sm select-none backdrop-blur-md ${config.badgeClass} ${className}`}
    >
      <motion.span
        className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`}
      />
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
