import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, ThumbsUp, Users, ShieldAlert, Zap, Share2, 
  Check, Clock, ArrowUpRight, Sparkles, AlertTriangle 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { grievanceService } from '../../services/grievanceService';

export const CommunityPetitionWidget = ({ 
  grievance, 
  currentUserId,
  onUpvoteSuccess = () => {} 
}) => {
  const [upvoteCount, setUpvoteCount] = useState(grievance?.upvote_count || 1);
  const [isUpvoted, setIsUpvoted] = useState(
    Array.isArray(grievance?.upvoted_by) && currentUserId
      ? grievance.upvoted_by.includes(currentUserId)
      : false
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!grievance) return null;

  // Calculate Threshold & Escalation Level
  const getThresholdInfo = (count) => {
    if (count >= 12) {
      return { 
        level: 'Emergency Outage', 
        next: 20, 
        progress: 100, 
        sla: '12h Emergency SLA',
        color: 'text-red-400 bg-red-500/15 border-red-500/30'
      };
    }
    if (count >= 7) {
      return { 
        level: 'Critical Campus Cluster', 
        next: 12, 
        progress: Math.min(100, (count / 12) * 100), 
        sla: '24h Accelerated SLA',
        color: 'text-rose-400 bg-rose-500/15 border-rose-500/30'
      };
    }
    if (count >= 3) {
      return { 
        level: 'High Community Weight', 
        next: 7, 
        progress: Math.min(100, (count / 7) * 100), 
        sla: '24h Priority SLA',
        color: 'text-amber-400 bg-amber-500/15 border-amber-500/30'
      };
    }
    return { 
      level: 'Standard Issue', 
      next: 3, 
      progress: Math.min(100, (count / 3) * 100), 
      sla: '48h Standard SLA',
      color: 'text-blue-400 bg-blue-500/15 border-blue-500/30'
    };
  };

  const threshold = getThresholdInfo(upvoteCount);

  const handleUpvote = async () => {
    if (isUpvoted) {
      toast('You have already endorsed this collective petition.', { icon: 'ℹ️' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Trigger festive confetti burst
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#f97316', '#ef4444', '#f59e0b', '#38bdf8']
        });
      } catch (e) {
        console.debug('Confetti suppressed:', e);
      }

      const res = await grievanceService.upvote(grievance.id || grievance.ticket_id);
      const newCount = res.grievance?.upvote_count || (upvoteCount + 1);
      setUpvoteCount(newCount);
      setIsUpvoted(true);

      if (res.escalated || newCount >= 3) {
        toast.success(`🔥 Endorsed! Petition priority escalated to ${res.grievance?.urgency || 'High'}!`);
      } else {
        toast.success(`+1 added! Issue now supported by ${newCount} students.`);
      }

      onUpvoteSuccess(res.grievance || { ...grievance, upvote_count: newCount });
    } catch (err) {
      console.warn('Upvote error:', err.message);
      setUpvoteCount(prev => prev + 1);
      setIsUpvoted(true);
      toast.success('+1 recorded locally.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = () => {
    const trackingUrl = `${window.location.origin}/track?token=${encodeURIComponent(grievance.ticket_id || grievance.id)}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(true);
    toast.success('Petition tracking link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-linear-to-b from-slate-900/90 to-slate-950/95 border border-amber-500/30 p-5 sm:p-6 shadow-xl shadow-amber-500/5">
      {/* Background ambient lighting */}
      <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
            <Flame size={20} className={upvoteCount >= 3 ? 'animate-pulse text-orange-400' : ''} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-foreground tracking-tight">
                Collective Community Petition
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${threshold.color}`}>
                {threshold.level}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Multiple students reporting this issue accelerates institutional resolution.
            </p>
          </div>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="btn-ghost p-2 text-xs flex items-center gap-1.5 border border-border/60 hover:border-amber-500/40 text-muted-foreground hover:text-foreground shrink-0 rounded-xl"
          title="Share petition with classmates"
        >
          {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
          <span className="hidden sm:inline text-[11px] font-bold">{copiedLink ? 'Link Copied' : 'Share'}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 relative z-10">
        {/* Metric 1: Supporter Count */}
        <div className="p-3 bg-background/60 border border-border/60 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
            Total Supporters
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-black text-amber-400 font-mono">
              {upvoteCount}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {upvoteCount === 1 ? 'student' : 'students'}
            </span>
          </div>
        </div>

        {/* Metric 2: Accelerated SLA */}
        <div className="p-3 bg-background/60 border border-border/60 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
            Active SLA Target
          </span>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground truncate">
            <Clock size={13} className="text-primary-bright shrink-0" />
            <span className="truncate">{threshold.sla}</span>
          </div>
        </div>

        {/* Metric 3: Department Cluster Alert */}
        <div className="col-span-2 sm:col-span-1 p-3 bg-background/60 border border-border/60 rounded-xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
            Cluster Severity
          </span>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-foreground">
            {upvoteCount >= 7 ? (
              <span className="text-red-400 flex items-center gap-1">
                <AlertTriangle size={13} /> Campus Outage
              </span>
            ) : upvoteCount >= 3 ? (
              <span className="text-amber-400 flex items-center gap-1">
                <Zap size={13} /> High Priority
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <Sparkles size={13} /> Standard
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Progress towards Next Urgency Level */}
      <div className="space-y-1.5 mb-5 relative z-10">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-muted-foreground uppercase tracking-wider">
            {upvoteCount >= 12 
              ? 'Max Escalation Level Reached' 
              : `${threshold.next - upvoteCount} more endorsements for next escalation tier`}
          </span>
          <span className="text-amber-400 font-mono">{Math.round(threshold.progress)}%</span>
        </div>
        <div className="h-2 bg-slate-950/80 rounded-full overflow-hidden border border-border/40">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${threshold.progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full bg-linear-to-r from-amber-500 via-orange-500 to-red-500 rounded-full"
          />
        </div>
      </div>

      {/* Supporter Avatar Cluster & Action Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/50 relative z-10">
        {/* Avatar Cluster */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground w-full sm:w-auto">
          <div className="flex -space-x-2 overflow-hidden">
            {[...Array(Math.min(4, upvoteCount))].map((_, i) => (
              <div
                key={i}
                className="h-6 w-6 rounded-full ring-2 ring-slate-900 bg-linear-to-tr from-amber-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-xs"
              >
                {String.fromCharCode(65 + (i * 3))}
              </div>
            ))}
          </div>
          <span className="text-[11px]">
            <b>{upvoteCount}</b> {upvoteCount === 1 ? 'person endorses' : 'people endorse'} this fix
          </span>
        </div>

        {/* Action Button: +1 I'm Facing This Too */}
        <button
          onClick={handleUpvote}
          disabled={isSubmitting || isUpvoted}
          className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
            isUpvoted
              ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 cursor-default'
              : 'bg-linear-to-r from-orange-500 via-amber-500 to-orange-600 hover:opacity-95 text-white shadow-orange-500/20 active:scale-95'
          }`}
        >
          {isUpvoted ? (
            <>
              <Check size={14} />
              <span>You Endorsed This (+1)</span>
            </>
          ) : (
            <>
              <Flame size={14} className="text-amber-200 animate-bounce" />
              <span>+1 I'm Facing This Too</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CommunityPetitionWidget;
