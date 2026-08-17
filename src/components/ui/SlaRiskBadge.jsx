import React from 'react';
import { AlertTriangle, Clock, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export const SlaRiskBadge = ({ createdAt, slaDueAt, status, compact = false }) => {
  // Resolved or Closed tickets are completed
  if (['Resolved', 'Closed', 'Rejected'].includes(status)) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {!compact && 'SLA Met'}
      </span>
    );
  }

  // Calculate remaining time
  const createdTime = createdAt ? new Date(createdAt).getTime() : Date.now();
  const defaultDue = createdTime + 72 * 3600 * 1000; // 72 hours default
  const dueTime = slaDueAt ? new Date(slaDueAt).getTime() : defaultDue;
  const now = Date.now();
  const diffHours = (dueTime - now) / (1000 * 3600);

  if (diffHours < 0) {
    const overdueHours = Math.abs(Math.round(diffHours));
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 sla-pulse-red">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
        <span>{compact ? `${overdueHours}h overdue` : `SLA Breached (${overdueHours}h overdue)`}</span>
      </span>
    );
  }

  if (diffHours <= 6) {
    const remainingHours = Math.max(1, Math.round(diffHours));
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 sla-pulse-amber">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        <span>{compact ? `${remainingHours}h left` : `Critical (<${remainingHours}h SLA left)`}</span>
      </span>
    );
  }

  if (diffHours <= 24) {
    const remainingHours = Math.round(diffHours);
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
        <Clock className="w-3.5 h-3.5 text-yellow-500" />
        <span>{compact ? `${remainingHours}h remaining` : `Urgent SLA (${remainingHours}h remaining)`}</span>
      </span>
    );
  }

  const remainingDays = Math.round(diffHours / 24);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
      <span>{compact ? `${remainingDays}d SLA` : `SLA On Track (${remainingDays}d left)`}</span>
    </span>
  );
};

export default SlaRiskBadge;
