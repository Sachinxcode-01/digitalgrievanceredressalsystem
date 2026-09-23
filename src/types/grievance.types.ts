/**
 * Grievance Domain Contracts & Types
 */

export type GrievanceUrgency = 'low' | 'medium' | 'high' | 'critical';

export type GrievanceStatus =
  | 'Pending'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected'
  | 'Escalated';

export interface GrievanceTimelineEvent {
  id: string;
  grievance_id: string;
  action: string;
  details?: string;
  created_at: string;
  actor_name?: string;
  actor_role?: string;
}

export interface GrievanceAttachment {
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
}

export interface Grievance {
  id: string;
  ticket_id: string;
  title: string;
  description: string;
  category: string;
  urgency: GrievanceUrgency;
  status: GrievanceStatus;
  created_at: string;
  updated_at: string;
  user_id: string;
  assigned_to?: string | null;
  assigned_officer_name?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  sla_deadline?: string | null;
  is_escalated?: boolean;
  escalation_level?: number;
  satisfaction_rating?: number | null;
  feedback_notes?: string | null;
  attachments?: GrievanceAttachment[];
  timeline?: GrievanceTimelineEvent[];
}

export interface CreateGrievanceDTO {
  title: string;
  description: string;
  category: string;
  urgency?: GrievanceUrgency;
  department_id?: string;
  attachments?: string[];
  isAnonymous?: boolean;
}
