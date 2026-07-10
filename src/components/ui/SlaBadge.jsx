import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, Timer } from 'lucide-react';

/**
 * Total SLA window (hours) implied by a ticket's urgency, used when an explicit
 * sla_due_at isn't present. Mirrors the server defaults (High 24 / Medium 72 / Low 120).
 */
const urgencyHours = (urgency) => (urgency === 'High' ? 24 : urgency === 'Medium' ? 72 : 120);

/**
 * Derives the SLA status of a ticket:
 *   completed | overdue | near (due soon) | ontrack
 * Prefers the server's sla_due_at; falls back to an urgency-derived deadline.
 */
export const getSlaStatus = (ticket) => {
  if (!ticket) return null;

  if (['Resolved', 'Closed', 'Rejected'].includes(ticket.status)) {
    return { key: 'completed', label: ticket.status === 'Resolved' ? 'Resolved' : 'Closed' };
  }

  const totalHours = urgencyHours(ticket.urgency);
  let dueAt = ticket.sla_due_at ? new Date(ticket.sla_due_at) : null;
  if (!dueAt && ticket.created_at) {
    dueAt = new Date(new Date(ticket.created_at).getTime() + totalHours * 3600 * 1000);
  }
  if (!dueAt || Number.isNaN(dueAt.getTime())) return null;

  const msLeft = dueAt.getTime() - Date.now();
  if (msLeft <= 0) return { key: 'overdue', label: 'Overdue', dueAt };

  const hoursLeft = msLeft / 3600000;
  // "Near due" = within 24h or the final 25% of the SLA window, whichever is smaller.
  if (hoursLeft <= Math.min(24, totalHours * 0.25)) {
    return { key: 'near', label: `Due in ${Math.ceil(hoursLeft)}h`, dueAt };
  }

  const daysLeft = Math.floor(hoursLeft / 24);
  return {
    key: 'ontrack',
    label: daysLeft >= 1 ? `${daysLeft}d left` : `${Math.ceil(hoursLeft)}h left`,
    dueAt
  };
};

const STYLES = {
  completed: 'text-success bg-success/10 border-success/20',
  overdue: 'text-error bg-error/10 border-error/20',
  near: 'text-warning bg-warning/10 border-warning/20',
  ontrack: 'text-primary-bright bg-primary/10 border-primary/20'
};

const ICONS = {
  completed: CheckCircle2,
  overdue: AlertTriangle,
  near: Timer,
  ontrack: Clock
};

/**
 * Compact SLA status pill for grievance lists/tables and cards.
 * Reusable across user + admin dashboards and the public tracking page.
 */
export const SlaBadge = ({ ticket, className = '' }) => {
  const status = getSlaStatus(ticket);
  if (!status) return null;
  const Icon = ICONS[status.key];
  return (
    <span
      className={`status-badge ${STYLES[status.key]} ${status.key === 'overdue' ? 'animate-pulse' : ''} ${className}`}
      title={status.dueAt ? `SLA due ${status.dueAt.toLocaleString()}` : status.label}
    >
      <Icon size={11} />
      {status.label}
    </span>
  );
};

export default SlaBadge;
