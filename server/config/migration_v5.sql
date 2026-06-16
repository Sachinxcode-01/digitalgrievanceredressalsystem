-- Migration Version 5.0: Enterprise Hardening and Production Features

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Status Check Constraints & Indexes
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Support 10-state lifecycle in public.grievances status
ALTER TABLE public.grievances DROP CONSTRAINT IF EXISTS grievances_status_check;
ALTER TABLE public.grievances ADD CONSTRAINT grievances_status_check 
  CHECK (status = ANY (ARRAY[
    'Draft'::text, 
    'Submitted'::text, 
    'Under Review'::text, 
    'Assigned'::text, 
    'In Progress'::text, 
    'Pending User Response'::text, 
    'Escalated'::text, 
    'Resolved'::text, 
    'Closed'::text, 
    'Reopened'::text
  ]));

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_grievances_assigned_to ON public.grievances (assigned_to);
CREATE INDEX IF NOT EXISTS idx_grievances_sla_due_at ON public.grievances (sla_due_at);
CREATE INDEX IF NOT EXISTS idx_grievance_timeline_grievance_id ON public.grievance_timeline (grievance_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Announcements Table
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(50) DEFAULT 'all',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS announcements_read_all ON public.announcements;
CREATE POLICY announcements_read_all ON public.announcements 
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS announcements_write_admin ON public.announcements;
CREATE POLICY announcements_write_admin ON public.announcements 
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super admin')
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Comments Hardening (Internal Comments)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.ticket_comments ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;

DROP POLICY IF EXISTS "Users can read comments on their grievances" ON public.ticket_comments;
CREATE POLICY "Users can read comments on their grievances" ON public.ticket_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'super admin', 'faculty', 'staff')
    ) OR (
      is_internal = FALSE AND EXISTS (
        SELECT 1 FROM public.grievances g 
        WHERE g.id = ticket_comments.grievance_id AND g.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert comments on their grievances" ON public.ticket_comments;
CREATE POLICY "Users can insert comments on their grievances" ON public.ticket_comments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'super admin', 'faculty', 'staff')
    ) OR (
      is_internal = FALSE AND EXISTS (
        SELECT 1 FROM public.grievances g 
        WHERE g.id = grievance_id AND g.user_id = auth.uid()
      )
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: Row Level Security Hardening
-- ─────────────────────────────────────────────────────────────────────────────

-- Users Table
DROP POLICY IF EXISTS allow_anonymous_select ON public.users;

-- OTP Codes Table
DROP POLICY IF EXISTS "Allow anonymous select" ON public.otp_codes;
DROP POLICY IF EXISTS "Allow anonymous delete" ON public.otp_codes;

-- OTP Verifications Table
DROP POLICY IF EXISTS "Allow anonymous select" ON public.otp_verifications;
DROP POLICY IF EXISTS "Allow anonymous delete" ON public.otp_verifications;

-- Sessions Table
DROP POLICY IF EXISTS session_select_all ON public.sessions;
DROP POLICY IF EXISTS session_update_all ON public.sessions;
DROP POLICY IF EXISTS session_delete_all ON public.sessions;

CREATE POLICY sessions_owner_all ON public.sessions 
  FOR ALL USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'super admin'
  ));

-- Email Logs Table
DROP POLICY IF EXISTS email_logs_select_all ON public.email_logs;
DROP POLICY IF EXISTS email_logs_update_all ON public.email_logs;
DROP POLICY IF EXISTS email_logs_delete_all ON public.email_logs;

CREATE POLICY email_logs_read_admin ON public.email_logs 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super admin')
  ));

-- System Settings
DROP POLICY IF EXISTS system_settings_read_all ON public.system_settings;
CREATE POLICY system_settings_read_auth ON public.system_settings 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Roles & Permissions Configuration
DROP POLICY IF EXISTS roles_read_all ON public.roles;
CREATE POLICY roles_read_auth ON public.roles 
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS permissions_read_all ON public.permissions;
CREATE POLICY permissions_read_auth ON public.permissions 
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS role_perms_read_all ON public.role_permissions;
CREATE POLICY role_perms_read_auth ON public.role_permissions 
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS user_roles_read_all ON public.user_roles;
CREATE POLICY user_roles_read_auth ON public.user_roles 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- User Profiles
DROP POLICY IF EXISTS profile_read_all ON public.user_profiles;
CREATE POLICY profile_read_auth ON public.user_profiles 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Departments
DROP POLICY IF EXISTS departments_read_all ON public.departments;
CREATE POLICY departments_read_auth ON public.departments 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- SLA Rules
DROP POLICY IF EXISTS sla_rules_read_all ON public.sla_rules;
CREATE POLICY sla_rules_read_auth ON public.sla_rules 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Escalation Rules
DROP POLICY IF EXISTS escalation_rules_read_all ON public.escalation_rules;
CREATE POLICY escalation_rules_read_auth ON public.escalation_rules 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Email Templates
DROP POLICY IF EXISTS email_templates_read_all ON public.email_templates;
CREATE POLICY email_templates_read_auth ON public.email_templates 
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- SMS Templates
DROP POLICY IF EXISTS sms_templates_read_all ON public.sms_templates;
CREATE POLICY sms_templates_read_auth ON public.sms_templates 
  FOR SELECT USING (auth.uid() IS NOT NULL);
