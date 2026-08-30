import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Clock, AlertTriangle, ArrowRight, UserCheck, 
  FileText, Shield, MessageSquare, Send, Sparkles, Scale
} from 'lucide-react';
import SlaRiskBadge from '../ui/SlaRiskBadge';
import SlaRadialCountdown from '../ui/SlaRadialCountdown';

export const GrievanceWorkflowTimeline = ({ ticket }) => {
  if (!ticket) return null;

  const isEscalated = ticket.status === 'Escalated' || ticket.status === 'Disputed';
  const isResolved = ticket.status === 'Resolved' || ticket.status === 'Closed';

  const steps = [
    {
      id: 'submitted',
      title: 'Grievance Submitted',
      description: `Filed by ${ticket.user_name || ticket.user_email || 'Citizen'} • Auto-hashed with SHA-256 for audit immutability.`,
      timestamp: ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Just now',
      completed: true,
      icon: FileText,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    },
    {
      id: 'triage',
      title: 'AI Smart Triage & Multi-Tenancy Routing',
      description: `Categorized under "${ticket.category || 'General'}" (${ticket.urgency || 'Medium'} Urgency). Routed to ${ticket.department || 'Nodal Authority'}.`,
      timestamp: ticket.created_at ? new Date(new Date(ticket.created_at).getTime() + 2 * 60000).toLocaleString() : 'Automated',
      completed: true,
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    },
    {
      id: 'assigned',
      title: ticket.escalation_tier ? `Escalated: ${ticket.escalation_tier}` : 'Officer Investigation',
      description: ticket.escalation_tier 
        ? `Transferred to ${ticket.escalated_to || 'Department Directorate'} for priority dispute/breach resolution.`
        : (ticket.assigned_to ? `Assigned to department coordinator for active inquiry.` : 'Awaiting assignment to nodal officer.'),
      timestamp: ticket.tier_escalated_at ? new Date(ticket.tier_escalated_at).toLocaleString() : (ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : 'Active State'),
      completed: ['Assigned', 'In Progress', 'Under Review', 'Escalated', 'Disputed', 'Resolved', 'Closed'].includes(ticket.status),
      icon: isEscalated ? Scale : UserCheck,
      color: isEscalated 
        ? 'text-amber-400 bg-amber-500/15 border-amber-500/40' 
        : (['Assigned', 'In Progress', 'Under Review', 'Resolved', 'Closed'].includes(ticket.status) ? 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' : 'text-slate-500 bg-slate-900 border-white/10'),
    },
    {
      id: 'investigation',
      title: ticket.status === 'Disputed' ? 'Dispute Appeal Review' : 'Final Resolution & Redressal Statement',
      description: ticket.resolution_notes ? `Verified Statement: "${ticket.resolution_notes}"` : (isResolved ? 'Resolution verified by administrative panel.' : 'Pending final redressal statement from nodal authority.'),
      timestamp: ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : (ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : 'Pending'),
      completed: isResolved,
      icon: CheckCircle2,
      color: isResolved ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' : 'text-slate-500 bg-slate-900 border-white/10',
    }
  ];

  return (
    <div className="p-6 rounded-3xl bg-surface border border-border/80 shadow-xl text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border/60 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-400">Live Audit Flow</span>
            {ticket.escalation_tier && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase">
                {ticket.escalation_tier}
              </span>
            )}
          </div>
          <h4 className="text-xl font-heading font-black text-foreground mt-0.5">#{ticket.ticket_id || ticket.id}</h4>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SlaRadialCountdown createdAt={ticket.created_at} slaDueAt={ticket.sla_due_at} status={ticket.status} size={84} strokeWidth={6} />
        </div>
      </div>

      <div className="relative pl-6 space-y-6">
        {/* Luminous Animated Beam Connecting Line */}
        <div className="absolute left-3.75 top-3 bottom-3 w-0.5 bg-border/40 luminous-beam-track rounded-full" />

        {steps.map((step, idx) => {
          const StepIcon = step.icon;
          return (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="relative flex items-start gap-4"
            >
              <div className={`absolute -left-7.75 top-0 p-1.5 rounded-full border shadow-sm ${step.color}`}>
                <StepIcon className="w-4 h-4" />
              </div>

              <div className="flex-1 bg-surface/60 p-4 rounded-2xl border border-border/60 backdrop-blur-sm space-y-1 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h5 className="text-xs font-bold font-heading text-foreground">{step.title}</h5>
                  <span className="text-[10px] text-muted-foreground font-mono">{step.timestamp}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default GrievanceWorkflowTimeline;
