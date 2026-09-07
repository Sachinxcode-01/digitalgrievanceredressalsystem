-- ============================================================================
-- RESOLVENOW DIGITAL GRIEVANCE SYSTEM — DATABASE MIGRATION V6.0
-- High-Throughput Production Indexing & Query Acceleration Suite
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Composite Indexes for Grievance Life Cycle & Officer Queues
-- ─────────────────────────────────────────────────────────────────────────────

-- Accelerates status filtering with time sorting on administrative dashboards
CREATE INDEX IF NOT EXISTS idx_grievances_status_created 
  ON public.grievances (status, created_at DESC);

-- Accelerates department-based triage and urgent ticket routing
CREATE INDEX IF NOT EXISTS idx_grievances_dept_urgency 
  ON public.grievances (department, urgency, status);

-- Accelerates assigned officer ticket views and workload distribution queries
CREATE INDEX IF NOT EXISTS idx_grievances_assigned_status 
  ON public.grievances (assigned_to, status);

-- Accelerates citizen/student dashboard queries (filtering personal tickets by status)
CREATE INDEX IF NOT EXISTS idx_grievances_user_status_created 
  ON public.grievances (user_id, status, created_at DESC);

-- Partial index for active SLA breach monitoring (ignoring already resolved/closed tickets)
CREATE INDEX IF NOT EXISTS idx_grievances_active_sla_breach 
  ON public.grievances (sla_due_at, status) 
  WHERE status NOT IN ('Resolved', 'Closed');

-- Partial index for emergency SOS tickets requiring immediate sub-2hr response
CREATE INDEX IF NOT EXISTS idx_grievances_active_emergencies 
  ON public.grievances (is_emergency, created_at DESC) 
  WHERE is_emergency = TRUE;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Child Table Relational & Timeline Join Optimization
-- ─────────────────────────────────────────────────────────────────────────────

-- Accelerates audit timeline milestone rendering on detail pages
CREATE INDEX IF NOT EXISTS idx_timeline_grievance_created 
  ON public.grievance_timeline (grievance_id, created_at DESC);

-- Accelerates ticket conversation thread loading with internal visibility filtering
CREATE INDEX IF NOT EXISTS idx_comments_grievance_visibility 
  ON public.ticket_comments (grievance_id, is_internal, created_at ASC);

-- Accelerates security & compliance audit log retrieval per grievance
CREATE INDEX IF NOT EXISTS idx_audit_logs_grievance_created 
  ON public.audit_logs (grievance_id, created_at DESC);

-- Partial index for unread notification count badges without full table scan
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications (user_id, created_at DESC) 
  WHERE is_read = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Analytical Verification Queries
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON INDEX public.idx_grievances_status_created IS 'Optimizes high-volume dashboard status and temporal sorting';
COMMENT ON INDEX public.idx_grievances_dept_urgency IS 'Optimizes department officer triage lists ordered by urgency';
COMMENT ON INDEX public.idx_grievances_active_sla_breach IS 'Accelerates automated cron SLA breach detection queries';
COMMENT ON INDEX public.idx_notifications_user_unread IS 'Supports instant unread notification count rendering';
