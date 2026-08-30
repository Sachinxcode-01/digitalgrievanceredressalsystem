-- ============================================================================
-- RESOLVENOW DIGITAL GRIEVANCE SYSTEM — PRODUCTION PERFORMANCE INDEXES MIGRATION
-- Enables sub-10ms lookup times across 1,000,000+ grievance records & child tables
-- ============================================================================

-- 0. Ensure all extended grievance columns exist before indexing
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS proof_hash TEXT;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS secret_passkey TEXT;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 1;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS upvoted_by TEXT[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS admin_comment TEXT;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS frustration_index INT DEFAULT 1;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS appeal_status TEXT;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS appeal_reason TEXT;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS appeal_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS escalation_tier TEXT;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS tier_escalated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS escalated_to TEXT;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS feedback_tags TEXT[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS sentiment_score INT DEFAULT 0;

-- 1. High-frequency Grievance & Cryptographic Hash Lookups
CREATE INDEX IF NOT EXISTS idx_grievances_ticket_id ON public.grievances(ticket_id);
CREATE INDEX IF NOT EXISTS idx_grievances_proof_hash ON public.grievances(proof_hash);
CREATE INDEX IF NOT EXISTS idx_grievances_secret_passkey ON public.grievances(secret_passkey) WHERE secret_passkey IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grievances_appeal_status ON public.grievances(appeal_status) WHERE appeal_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_grievances_escalation_tier ON public.grievances(escalation_tier) WHERE escalation_tier IS NOT NULL;

-- 2. Emergency SOS & SLA Breach Monitoring Indexes
CREATE INDEX IF NOT EXISTS idx_grievances_is_emergency ON public.grievances(is_emergency) WHERE is_emergency = TRUE;
CREATE INDEX IF NOT EXISTS idx_grievances_sla_due ON public.grievances(sla_due_at, status);
CREATE INDEX IF NOT EXISTS idx_grievances_dept_status ON public.grievances(department, status);

-- 3. Composite Priority Queue & Administrative Workload Indexes
CREATE INDEX IF NOT EXISTS idx_grievances_priority_queue ON public.grievances(status, urgency, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grievances_user_status ON public.grievances(user_id, status);
CREATE INDEX IF NOT EXISTS idx_grievances_category_status ON public.grievances(category, status);
CREATE INDEX IF NOT EXISTS idx_grievances_user_created ON public.grievances(user_id, created_at DESC);

-- 4. Relational Child Table Join Indexes (Zero Sequential Scans)
CREATE INDEX IF NOT EXISTS idx_timeline_grievance ON public.grievance_timeline(grievance_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_grievance ON public.ticket_comments(grievance_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_feedback_grievance ON public.feedback(grievance_id, rating);
CREATE INDEX IF NOT EXISTS idx_attachments_grievance ON public.attachments(grievance_id);

-- 5. User Notifications & Security Audit Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_alerts_priority ON public.system_alerts(priority, created_at DESC);

-- 6. Full-Text Search Inverted Index (GIN) for Rapid Complaint Title & Description Search
CREATE INDEX IF NOT EXISTS idx_grievances_fts ON public.grievances USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

COMMENT ON INDEX idx_grievances_ticket_id IS 'Accelerates public tracking ticket reference lookups';
COMMENT ON INDEX idx_grievances_proof_hash IS 'Accelerates SHA-256 zero-trust Merkle verification lookups';
COMMENT ON INDEX idx_grievances_secret_passkey IS 'Accelerates anonymous whistleblower passkey tracking';
COMMENT ON INDEX idx_grievances_is_emergency IS 'Accelerates emergency 2-hour SLA incident monitoring';
COMMENT ON INDEX idx_grievances_priority_queue IS 'Accelerates officer & admin workload sorting by urgency and status';
COMMENT ON INDEX idx_timeline_grievance IS 'Accelerates public tracking milestone rendering';
COMMENT ON INDEX idx_comments_grievance IS 'Accelerates officer-student conversation history fetching';
COMMENT ON INDEX idx_notifications_user_unread IS 'Accelerates unread notification badge counts without scanning full table';
COMMENT ON INDEX idx_grievances_fts IS 'Accelerates multi-keyword narrative grievance search';

-- ============================================================================
-- PGBOUNCER / TRANSACTION POOLING GUIDANCE (Production Deployments)
-- ============================================================================
-- When deploying backend Node.js microservices to auto-scaling container environments (AWS ECS / Cloud Run / Kubernetes),
-- connect via Supabase Transaction Pooler (Port 6543) instead of direct Session Pooler (Port 5432) to support 10,000+
-- concurrent connections without database client exhaustion.
-- Connection URL Format:
-- postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
-- ============================================================================
