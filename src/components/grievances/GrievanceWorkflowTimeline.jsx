import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, Clock, AlertTriangle, ArrowRight, UserCheck, 
  FileText, Shield, MessageSquare, Send, Sparkles
} from 'lucide-react';
import SlaRiskBadge from '../ui/SlaRiskBadge';

export const GrievanceWorkflowTimeline = ({ ticket }) => {
  if (!ticket) return null;

  const steps = [
    {
      id: 'submitted',
      title: 'Grievance Submitted',
      description: `Filed by ${ticket.user_name || ticket.user_email || 'Student'} in ${ticket.category || 'General'}`,
      timestamp: ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Just now',
      completed: true,
      icon: FileText,
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    },
    {
      id: 'triage',
      title: 'AI Triage & Categorization',
      description: `Urgency assessed as ${ticket.priority || 'Medium'} priority (Auto-routed to ${ticket.department || 'Nodal Authority'})`,
      timestamp: ticket.created_at ? new Date(new Date(ticket.created_at).getTime() + 5 * 60000).toLocaleString() : 'Automated',
      completed: true,
      icon: Sparkles,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/30',
    },
    {
      id: 'assigned',
      title: 'Officer Assigned',
      description: ticket.assigned_officer ? `Assigned to Officer ${ticket.assigned_officer}` : 'Pending assignment to department nodal officer',
      timestamp: ticket.assigned_at ? new Date(ticket.assigned_at).toLocaleString() : (['Assigned', 'In Progress', 'Resolved', 'Closed'].includes(ticket.status) ? 'In Progress' : 'Awaiting Action'),
      completed: ['Assigned', 'In Progress', 'Under Review', 'Resolved', 'Closed'].includes(ticket.status),
      icon: UserCheck,
      color: ['Assigned', 'In Progress', 'Under Review', 'Resolved', 'Closed'].includes(ticket.status) ? 'text-amber-500 bg-amber-500/10 border-amber-500/30' : 'text-muted-foreground bg-muted border-border',
    },
    {
      id: 'investigation',
      title: 'Investigation & Resolution Note',
      description: ticket.resolution_notes ? ticket.resolution_notes : (['Resolved', 'Closed'].includes(ticket.status) ? 'Resolution verified by administrative panel' : 'Under active review by department authority'),
      timestamp: ticket.updated_at ? new Date(ticket.updated_at).toLocaleString() : 'In Progress',
      completed: ['Resolved', 'Closed'].includes(ticket.status),
      icon: CheckCircle2,
      color: ['Resolved', 'Closed'].includes(ticket.status) ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' : 'text-muted-foreground bg-muted border-border',
    }
  ];

  return (
    <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-xl layer-3d">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border/60 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">Ticket Timeline & SLA</span>
          <h4 className="text-lg font-bold text-foreground mt-0.5">#{ticket.ticket_id || ticket.id}</h4>
        </div>
        <SlaRiskBadge createdAt={ticket.created_at} slaDueAt={ticket.sla_due_at} status={ticket.status} />
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-3.75 before:top-3 before:bottom-3 before:w-0.5 before:bg-border/60">
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

              <div className="flex-1 bg-muted/40 p-3.5 rounded-xl border border-border/40">
                <div className="flex items-center justify-between gap-2">
                  <h5 className="text-sm font-semibold text-foreground">{step.title}</h5>
                  <span className="text-[11px] text-muted-foreground font-mono">{step.timestamp}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
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
