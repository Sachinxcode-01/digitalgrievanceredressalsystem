-- =============================================================================
-- RESOLVENOW DIGITAL GRIEVANCE SYSTEM — COMPLETE SUPABASE DATABASE SETUP SCRIPT
-- Contains DDL definitions for all 11 required tables, indexes, RLS policies,
-- triggers, and storage bucket security.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. USERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    mobile_number VARCHAR(50) UNIQUE,
    clerk_user_id VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'staff', 'officer', 'admin', 'super admin')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'locked')),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    failed_login_attempts INT DEFAULT 0,
    lockout_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. USER PROFILES / PROFILES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    profile_picture TEXT,
    department VARCHAR(100),
    notification_preferences JSONB DEFAULT '{"email": true, "sms": true}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DEPARTMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    head_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assignment_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. OFFICERS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    designation VARCHAR(100),
    specialization VARCHAR(100),
    max_active_tickets INT DEFAULT 20,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. GRIEVANCES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    email VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    department VARCHAR(100) DEFAULT 'Facilities & Maintenance',
    urgency VARCHAR(50) DEFAULT 'Medium' CHECK (urgency IN ('Low', 'Medium', 'High', 'Critical')),
    frustration_index INT DEFAULT 1,
    status VARCHAR(50) DEFAULT 'Submitted' CHECK (status IN (
        'Draft', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 
        'Pending User Response', 'Escalated', 'Resolved', 'Closed', 'Reopened'
    )),
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    location VARCHAR(255),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    attachment_url TEXT,
    proof_hash TEXT,
    secret_passkey TEXT,
    is_emergency BOOLEAN DEFAULT FALSE,
    admin_comment TEXT,
    upvote_count INT DEFAULT 1,
    upvoted_by TEXT[] DEFAULT '{}',
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    escalated_at TIMESTAMP WITH TIME ZONE,
    escalated_reason TEXT,
    sla_due_at TIMESTAMP WITH TIME ZONE,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Idempotent column upgrades in case table was created previously
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS proof_hash TEXT;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS secret_passkey TEXT;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS is_emergency BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS admin_comment TEXT;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS upvote_count INT DEFAULT 1;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS upvoted_by TEXT[] DEFAULT '{}';
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS sla_due_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE IF EXISTS public.grievances ADD COLUMN IF NOT EXISTS frustration_index INT DEFAULT 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. GRIEVANCE TIMELINE TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.grievance_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID REFERENCES public.grievances(id) ON DELETE CASCADE NOT NULL,
    status VARCHAR(50) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    performed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. AUDIT LOGS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. NOTIFICATIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    link VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. FEEDBACK TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID REFERENCES public.grievances(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. REPORTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    generated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    filters JSONB DEFAULT '{}'::jsonb,
    summary_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. ATTACHMENTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grievance_id UUID REFERENCES public.grievances(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES FOR PERFORMANCE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_clerk ON public.users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_grievances_user ON public.grievances(user_id);
CREATE INDEX IF NOT EXISTS idx_grievances_ticket ON public.grievances(ticket_id);
CREATE INDEX IF NOT EXISTS idx_grievances_proof_hash ON public.grievances(proof_hash);
CREATE INDEX IF NOT EXISTS idx_grievances_status ON public.grievances(status);
CREATE INDEX IF NOT EXISTS idx_grievances_priority_queue ON public.grievances(status, urgency, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grievances_sla_due ON public.grievances(sla_due_at, status);
CREATE INDEX IF NOT EXISTS idx_grievances_fts ON public.grievances USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_timeline_grievance ON public.grievance_timeline(grievance_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_grievance ON public.ticket_comments(grievance_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_feedback_grievance ON public.feedback(grievance_id, rating);
CREATE INDEX IF NOT EXISTS idx_attachments_grievance ON public.attachments(grievance_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grievance_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Allow authentications / public read for safe tracking
DROP POLICY IF EXISTS grievances_read_policy ON public.grievances;
CREATE POLICY grievances_read_policy ON public.grievances FOR SELECT USING (true);

DROP POLICY IF EXISTS grievances_insert_policy ON public.grievances;
CREATE POLICY grievances_insert_policy ON public.grievances FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS grievances_update_policy ON public.grievances;
CREATE POLICY grievances_update_policy ON public.grievances FOR UPDATE USING (true);

DROP POLICY IF EXISTS timeline_read_policy ON public.grievance_timeline;
CREATE POLICY timeline_read_policy ON public.grievance_timeline FOR SELECT USING (true);

DROP POLICY IF EXISTS timeline_insert_policy ON public.grievance_timeline;
CREATE POLICY timeline_insert_policy ON public.grievance_timeline FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS profiles_read_policy ON public.user_profiles;
CREATE POLICY profiles_read_policy ON public.user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS profiles_write_policy ON public.user_profiles;
CREATE POLICY profiles_write_policy ON public.user_profiles FOR ALL USING (true);

DROP POLICY IF EXISTS notifications_user_policy ON public.notifications;
CREATE POLICY notifications_user_policy ON public.notifications FOR ALL USING (true);

DROP POLICY IF EXISTS feedback_policy ON public.feedback;
CREATE POLICY feedback_policy ON public.feedback FOR ALL USING (true);

DROP POLICY IF EXISTS audit_policy ON public.audit_logs;
CREATE POLICY audit_policy ON public.audit_logs FOR ALL USING (true);

DROP POLICY IF EXISTS attachments_policy ON public.attachments;
CREATE POLICY attachments_policy ON public.attachments FOR ALL USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- SUPABASE STORAGE BUCKET SETUP
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Attachments" ON storage.objects;
CREATE POLICY "Public Read Attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments');

DROP POLICY IF EXISTS "Authenticated Insert Attachments" ON storage.objects;
CREATE POLICY "Authenticated Insert Attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments');
