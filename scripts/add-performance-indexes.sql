-- ============================================================================
-- RESOLVENOW DIGITAL GRIEVANCE SYSTEM — PRODUCTION PERFORMANCE INDEXES MIGRATION
-- Enables sub-10ms lookup times across 1,000,000+ grievance records
-- ============================================================================

-- 1. High-frequency Ticket & Cryptographic Hash Lookups
CREATE INDEX IF NOT EXISTS idx_grievances_ticket_id ON public.grievances(ticket_id);
CREATE INDEX IF NOT EXISTS idx_grievances_proof_hash ON public.grievances(proof_hash);
CREATE INDEX IF NOT EXISTS idx_grievances_secret_passkey ON public.grievances(secret_passkey) WHERE secret_passkey IS NOT NULL;

-- 2. Emergency SOS & SLA Breach Monitoring Indexes
CREATE INDEX IF NOT EXISTS idx_grievances_is_emergency ON public.grievances(is_emergency) WHERE is_emergency = TRUE;
CREATE INDEX IF NOT EXISTS idx_grievances_sla_due ON public.grievances(sla_due_at, status);
CREATE INDEX IF NOT EXISTS idx_grievances_dept_status ON public.grievances(department, status);

-- 3. Composite Priority Queue & Administrative Workload Indexes
CREATE INDEX IF NOT EXISTS idx_grievances_priority_queue ON public.grievances(status, urgency, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grievances_user_status ON public.grievances(user_id, status);
CREATE INDEX IF NOT EXISTS idx_grievances_category_status ON public.grievances(category, status);

-- 4. Student & User Filter Indexes
CREATE INDEX IF NOT EXISTS idx_grievances_user_created ON public.grievances(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_in_app_notif_user_read ON public.in_app_notifications(user_id, is_read);

-- 5. Full-Text Search Inverted Index (GIN) for Rapid Complaint Title & Description Search
CREATE INDEX IF NOT EXISTS idx_grievances_fts ON public.grievances USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

COMMENT ON INDEX idx_grievances_ticket_id IS 'Accelerates public tracking ticket reference lookups';
COMMENT ON INDEX idx_grievances_proof_hash IS 'Accelerates SHA-256 zero-trust Merkle verification lookups';
COMMENT ON INDEX idx_grievances_secret_passkey IS 'Accelerates anonymous whistleblower passkey tracking';
COMMENT ON INDEX idx_grievances_is_emergency IS 'Accelerates emergency 2-hour SLA incident monitoring';
COMMENT ON INDEX idx_grievances_priority_queue IS 'Accelerates officer & admin workload sorting by urgency and status';
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
