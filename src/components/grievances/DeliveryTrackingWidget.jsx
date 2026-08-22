import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Clock, ShieldAlert, Check, Sparkles, UserCheck, 
  ArrowRight, Copy, FileText, AlertTriangle, Trash2, ExternalLink
} from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import UrgencyBadge from '../ui/UrgencyBadge';
import toast from 'react-hot-toast';

export const DeliveryTrackingWidget = ({ ticket, role = 'student', onCancel, onExportPdf, onStatusUpdate }) => {
  if (!ticket) return null;

  const publicTrackingUrl = `${window.location.origin}/public-status?ticketId=${ticket.ticket_id}`;

  const copyTrackingLink = () => {
    navigator.clipboard?.writeText(publicTrackingUrl)
      .then(() => toast.success('Public tracking link copied!'))
      .catch(() => toast.error('Could not copy link'));
  };

  // Define 6 delivery-style stages
  const stages = [
    { key: 'Submitted', title: 'Submitted', subtitle: 'Grievance Registered', icon: FileText },
    { key: 'AI Analyzed', title: 'AI Triaged', subtitle: 'Category & SLA Mapped', icon: Sparkles },
    { key: 'Assigned', title: 'Officer Dispatched', subtitle: ticket.department || 'Department Allocated', icon: UserCheck },
    { key: 'In Progress', title: 'In Transit / Action', subtitle: 'Investigation Active', icon: Clock },
    { key: 'Escalated', title: 'Escalated / Review', subtitle: 'Senior Clearance', icon: AlertTriangle, conditional: ticket.status === 'Escalated' },
    { key: 'Resolved', title: 'Delivered / Resolved', subtitle: 'Redressal Complete', icon: CheckCircle2 }
  ];

  // Helper to determine current stage index
  const getStageIndex = (status) => {
    switch (status) {
      case 'Draft':
      case 'Submitted':
      case 'New':
        return 0;
      case 'Pending':
        return 1;
      case 'Assigned':
        return 2;
      case 'In Progress':
      case 'Under Review':
        return 3;
      case 'Escalated':
        return 4;
      case 'Resolved':
      case 'Closed':
        return 5;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(ticket.status);
  const isTerminal = ticket.status === 'Resolved' || ticket.status === 'Closed' || ticket.status === 'Rejected';
  const isCancellable = ['Submitted', 'Draft', 'New', 'Pending'].includes(ticket.status);

  // SLA Calculation
  const getSLAInfo = () => {
    if (isTerminal) return { text: 'Redressal Complete', status: 'completed' };
    const urgency = ticket.urgency || 'Medium';
    const hours = urgency === 'High' ? 24 : urgency === 'Medium' ? 72 : 120;
    const dueAt = ticket.sla_due_at ? new Date(ticket.sla_due_at) : new Date(new Date(ticket.created_at).getTime() + hours * 3600000);
    const diff = dueAt - new Date();

    if (diff <= 0) return { text: 'SLA Overdue', status: 'breached' };
    const remHours = Math.floor(diff / 3600000);
    const remMins = Math.floor((diff % 3600000) / 60000);
    return { text: `${remHours}h ${remMins}m remaining`, status: diff < 24 * 3600000 ? 'near_due' : 'normal' };
  };

  const slaInfo = getSLAInfo();

  return (
    <div className="bg-surface/80 backdrop-blur-xl border border-border/80 rounded-3xl p-6 shadow-lg space-y-6 text-left relative overflow-hidden">
      
      {/* Real-time Delivery Status Pulse Ribbon */}
      <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-2xl px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          <span className="font-bold text-foreground">
            {ticket.status === 'Resolved' ? 'Redressal Delivered & Case Closed' :
             ticket.status === 'In Progress' ? 'Officer In Action / Active Investigation' :
             ticket.status === 'Assigned' ? 'Dispatched to Department Officer' :
             ticket.status === 'Pending User Response' ? 'Awaiting Citizen Clarification' :
             'Registered & Routing in Progress'}
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          Live Tracking • Updates in Real-Time
        </span>
      </div>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-black text-primary bg-primary/10 px-2.5 py-1 rounded-md border border-primary/20">
              #{ticket.ticket_id}
            </span>
            <StatusBadge status={ticket.status} />
            <UrgencyBadge level={ticket.urgency} />
          </div>
          <h3 className="text-lg font-heading font-black text-foreground mt-2 truncate max-w-xl">
            {ticket.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* SLA Badge */}
          <div className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold uppercase tracking-wider ${
            slaInfo.status === 'completed' ? 'bg-success/10 text-success border-success/30' :
            slaInfo.status === 'breached' ? 'bg-error/10 text-error border-error/30 animate-pulse' :
            slaInfo.status === 'near_due' ? 'bg-warning/10 text-warning border-warning/30' :
            'bg-primary/10 text-primary border-primary/30'
          }`}>
            {slaInfo.text}
          </div>

          {onExportPdf && (
            <button 
              onClick={() => onExportPdf(ticket)}
              className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 cursor-pointer"
            >
              <FileText size={14} />
              <span>Dossier PDF</span>
            </button>
          )}

          {isCancellable && onCancel && (
            <button 
              onClick={() => onCancel(ticket)}
              className="px-3 py-1.5 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Cancel Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Delivery Tracker Stage Line */}
      <div className="py-4 px-2">
        <div className="relative flex items-center justify-between">
          
          {/* Background Track Line */}
          <div className="absolute left-6 right-6 top-5 h-1 bg-border/60 -z-0" />
          
          {/* Active Progress Bar Fill */}
          <motion.div 
            className="absolute left-6 top-5 h-1 bg-linear-to-r from-primary to-accent -z-0"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {stages.map((stage, idx) => {
            const isCompleted = idx < currentIndex || (idx === stages.length - 1 && isTerminal);
            const isCurrent = idx === currentIndex && !isTerminal;
            const Icon = stage.icon;

            return (
              <div key={stage.key} className="flex flex-col items-center relative z-10 group">
                {/* Step Circle Node */}
                <motion.div 
                  whileHover={{ scale: 1.15 }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-md ${
                    isCompleted 
                      ? 'bg-primary text-white border-primary shadow-primary/30' 
                      : isCurrent
                        ? 'bg-background text-primary border-primary ring-4 ring-primary/20 shadow-primary/40'
                        : 'bg-background text-muted-foreground/40 border-border/80'
                  }`}
                >
                  {isCompleted ? (
                    <Check size={18} className="stroke-[3]" />
                  ) : isCurrent ? (
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  ) : (
                    <Icon size={16} />
                  )}
                </motion.div>

                {/* Stage Label */}
                <div className="mt-2 text-center max-w-[90px]">
                  <p className={`text-[11px] font-bold tracking-tight leading-snug ${
                    isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground/60'
                  }`}>
                    {stage.title}
                  </p>
                  <p className="text-[9px] text-muted-foreground truncate font-medium">
                    {stage.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info & Public Tracking Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background/50 rounded-2xl p-4 border border-border/50 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <UserCheck size={18} />
          </div>
          <div>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Assigned Redressal Unit</p>
            <p className="text-foreground font-bold">{ticket.department || 'General Administration'}</p>
            {ticket.assigned_to && (
              <p className="text-[10px] text-indigo-400 font-mono">Officer ID: {ticket.assigned_to}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 bg-surface/90 px-3 py-2 rounded-xl border border-border">
          <div className="truncate">
            <p className="text-muted-foreground text-[9px] font-bold uppercase tracking-wider">Live Public Tracking Link</p>
            <p className="text-primary font-mono text-[10px] truncate">{publicTrackingUrl}</p>
          </div>
          <button 
            onClick={copyTrackingLink}
            className="p-1.5 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
            title="Copy tracking URL"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
