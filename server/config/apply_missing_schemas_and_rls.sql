-- 1. Apply Schema V2 (Roles, Permissions, Activity Logs) if tables are missing
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role_id)
);

CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed basic roles and permissions if not seeded
INSERT INTO roles (name, description) VALUES
('student', 'Default student access clearance. Submit grievances and view personal updates.'),
('faculty', 'Faculty-level officer. Resolve academic and departmental issues.'),
('staff', 'Staff officer. Handle infrastructure, facilities, or support grievances.'),
('admin', 'Grievance officer. Administer tickets, view general analytics, manage operations.'),
('super admin', 'System Administrator. Control global policies, manage roles, and review audit trails.')
ON CONFLICT (name) DO NOTHING;

INSERT INTO permissions (name, description) VALUES
('view_dashboard', 'Allows access to basic student/officer dashboard.'),
('submit_grievance', 'Allows submitting a redressal request.'),
('manage_grievances', 'Allows updating status, assigning categories, and adding comments.'),
('manage_users', 'Allows administrators to create, edit, suspend, or delete users.'),
('manage_roles', 'Allows creating roles and configuring permissions check-grids.'),
('view_analytics', 'Allows accessing executive telemetry and server health summaries.'),
('view_audit_logs', 'Allows checking security firewall logs and admin activities.'),
('manage_settings', 'Allows super admins to adjust MFA, rates, and lockouts.')
ON CONFLICT (name) DO NOTHING;

-- Map roles & permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'student' AND p.name IN ('view_dashboard', 'submit_grievance')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'faculty' AND p.name IN ('view_dashboard', 'submit_grievance', 'manage_grievances')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'staff' AND p.name IN ('view_dashboard', 'submit_grievance', 'manage_grievances')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name IN ('view_dashboard', 'submit_grievance', 'manage_grievances', 'manage_users', 'view_analytics', 'view_audit_logs')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super admin'
ON CONFLICT DO NOTHING;

-- Map users to roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = u.role
ON CONFLICT DO NOTHING;

-- Enable RLS on RBAC tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- RBAC policies
CREATE POLICY roles_read_all ON roles FOR SELECT USING (true);
CREATE POLICY permissions_read_all ON permissions FOR SELECT USING (true);
CREATE POLICY role_perms_read_all ON role_permissions FOR SELECT USING (true);
CREATE POLICY user_roles_read_all ON user_roles FOR SELECT USING (true);

-- Allow system to insert logs anonymously
CREATE POLICY sec_events_insert_system ON security_events FOR INSERT WITH CHECK (true);
CREATE POLICY admin_logs_insert_system ON admin_activity_logs FOR INSERT WITH CHECK (true);


-- 2. Apply Schema V3 (System Settings, Departments, SLAs, Templates) if tables are missing
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    head_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assignment_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    resolution_time_hours INTEGER NOT NULL,
    warning_time_hours INTEGER DEFAULT 12 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    sla_rule_id UUID REFERENCES sla_rules(id) ON DELETE CASCADE NOT NULL,
    trigger_delay_hours INTEGER NOT NULL,
    escalate_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    body VARCHAR(500) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed V3 data
INSERT INTO system_settings (key, value, category, description) VALUES
('institution_name', '"ResolveNow University"', 'general', 'The display name of the institution using the redressal portal.'),
('logo_url', '""', 'general', 'The logo image URL of the institution.'),
('contact_phone', '"+1 (555) 123-4567"', 'general', 'General contact telephone number.'),
('support_email', '"support@resolvenow.system"', 'general', 'Primary support email address.'),
('timezone', '"Asia/Kolkata"', 'general', 'Default institutional reporting timezone.'),
('date_format', '"MM/DD/YYYY"', 'general', 'Default date format for UI tables.'),
('language', '"en"', 'general', 'Default portal language.'),
('otp_expiry_seconds', '300', 'auth', 'OTP validation code lifetime in seconds.'),
('session_expiry_minutes', '60', 'auth', 'Duration of session inactivity timeout.'),
('password_policy', '{"minLength": 8, "requireNumbers": true, "requireSpecial": true}', 'auth', 'Password complexity parameters.'),
('max_login_attempts', '5', 'auth', 'Failed login attempts allowed before lockout.'),
('lockout_duration_minutes', '30', 'auth', 'Lockout duration after exceeding failed logins.'),
('enable_google_login', 'false', 'auth', 'Toggle Google SSO login.'),
('force_email_verification', 'true', 'auth', 'Require verified email before active triage access.'),
('smtp_host', '"smtp.ethereal.email"', 'email', 'SMTP server domain host.'),
('smtp_port', '587', 'email', 'SMTP server handshake port.'),
('smtp_username', '""', 'email', 'SMTP server username.'),
('smtp_password', '""', 'email', 'SMTP server password.'),
('smtp_ssl', 'false', 'email', 'Use SSL/TLS for SMTP handshake.'),
('sender_name', '"ResolveNow Core Dispatch"', 'email', 'Display sender name for automated dispatches.'),
('sender_email', '"no-reply@resolvenow.system"', 'email', 'Dispatched from email address.'),
('sms_provider', '"android-gateway"', 'sms', 'Active SMS delivery service provider.'),
('sms_api_url', '"http://10.105.47.157:8080/api/v1"', 'sms', 'SMS Gateway host address.'),
('sms_login', '"sms"', 'sms', 'SMS Gateway credential login.'),
('sms_password', '"FeemKLig"', 'sms', 'SMS Gateway password.'),
('gemini_api_key', '""', 'ai', 'Google Gemini AI development access key.'),
('gemini_model', '"gemini-1.5-flash"', 'ai', 'Model variant selection.'),
('enable_ai_categorization', 'true', 'ai', 'Auto-classify incoming grievances via Gemini.'),
('enable_sentiment_analysis', 'true', 'ai', 'Detect frustration index metrics.'),
('enable_urgency_detection', 'true', 'ai', 'Assess urgency based on incident statements.'),
('enable_ai_suggestions', 'true', 'ai', 'Draft solutions for officers automatically.'),
('enable_email_notifications', 'true', 'notification', 'Enable email delivery for operations.'),
('enable_sms_notifications', 'true', 'notification', 'Enable SMS notifications for critical OTP dispatches.'),
('enable_push_notifications', 'false', 'notification', 'Toggle desktop browser push notifications.'),
('enable_in_app_notifications', 'true', 'notification', 'Enable in-app bell notifications.'),
('rate_limit_max', '100', 'security', 'Max requests allowed in a 15-minute window per IP.'),
('session_device_tracking', 'true', 'security', 'Audit active browser agent device footprints.'),
('enable_audit_logging', 'true', 'security', 'Record all admin database mutations.'),
('enable_security_alerts', 'true', 'security', 'Log alerts for locks and updates.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

INSERT INTO departments (name, description, assignment_rules) VALUES
('Academic Affairs', 'Curriculum, grade corrections, faculty complaints, and classroom concerns.', '{"autoAssign": true}'),
('IT Support', 'WiFi connection, network firewalls, account setups, and lab hardware support.', '{"autoAssign": true}'),
('Facilities & Maintenance', 'Hostel repairs, elevator outages, mess quality, sanitation, and electricity.', '{"autoAssign": true}'),
('Financial Services', 'Scholarship payouts, fee transactions, transaction errors, and billing audits.', '{"autoAssign": true}')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO sla_rules (name, category, priority, resolution_time_hours, warning_time_hours) VALUES
('Critical Academic Escalation', 'Academic Affairs', 'High', 24, 6),
('Standard IT Ticket', 'IT Support', 'Medium', 48, 12),
('Hostel Emergency Repair', 'Facilities & Maintenance', 'High', 12, 3),
('General Fee Audit', 'Financial Services', 'Low', 72, 24)
ON CONFLICT DO NOTHING;

INSERT INTO email_templates (name, subject, body, description, is_system) VALUES
('welcome_email', 'Welcome to ResolveNow: Identity Verified', '<p>Hello <strong>{{fullName}}</strong>,</p>\n<p>Welcome to the <strong>ResolveNow Institutional Network</strong>. Your account registration was successful and your access has been initialized.</p>', 'Sent to users when they verify their account.', true),
('otp_email', 'Secure OTP Code: {{otp}}', '<p>Hello,</p>\n<p>A One-Time Password (OTP) has been generated to verify your identity for <strong>{{purpose}}</strong>.</p>\n<div class="highlight">{{otp}}</div>', 'OTP verification email.', true),
('password_changed_email', 'ResolveNow: Password Changed Successfully', '<p>Hello,</p>\n<p>This is confirmation that the password for your ResolveNow account has been <strong>successfully updated</strong>.</p>', 'Notification when user shifts their password.', true),
('grievance_created_email', 'Grievance Recorded: #{{ticketId}}', '<p>Hello,</p>\n<p>We have successfully registered your grievance. An administrative officer will review the report shortly.</p>', 'Filing confirmation email.', true),
('grievance_assigned_email', 'ASSIGNMENT ALERT: Ticket #{{ticketId}}', '<p>Hello Officer,</p>\n<p>A new grievance ticket has been assigned to your review queue.</p>', 'Notification when a ticket is assigned to an officer.', true),
('grievance_status_updated_email', 'ResolveNow Status Update: #{{ticketId}}', '<p>Hello,</p>\n<p>Your grievance filing <strong>#{{ticketId}}</strong> has advanced to a new status milestone.</p>', 'Notification when status shifts.', true),
('resolution_completed_email', 'RESOLVED: Grievance #{{ticketId}} Resolved', '<p>Hello,</p>\n<p>Your grievance filing <strong>#{{ticketId}}</strong> has been successfully resolved.</p>', 'Sent on ticket resolution.', true)
ON CONFLICT (name) DO UPDATE SET subject = EXCLUDED.subject, body = EXCLUDED.body;

INSERT INTO sms_templates (name, body, description, is_system) VALUES
('otp_sms', '[ResolveNow] Your secure identity key is: {{otp}}. It expires in 5 minutes.', 'SMS verification code format.', true),
('status_changed_sms', '[ResolveNow] Grievance #{{ticketId}} status has been updated from {{oldStatus}} to {{newStatus}}.', 'SMS dispatch when status changes.', true)
ON CONFLICT (name) DO UPDATE SET body = EXCLUDED.body;

-- Enable RLS on V3 tables
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- V3 policies
CREATE POLICY system_settings_read_all ON system_settings FOR SELECT USING (true);
CREATE POLICY departments_read_all ON departments FOR SELECT USING (true);
CREATE POLICY sla_rules_read_all ON sla_rules FOR SELECT USING (true);
CREATE POLICY escalation_rules_read_all ON escalation_rules FOR SELECT USING (true);
CREATE POLICY email_templates_read_all ON email_templates FOR SELECT USING (true);
CREATE POLICY sms_templates_read_all ON sms_templates FOR SELECT USING (true);


-- 3. Fix RLS Policies for Sessions and Email Logs

-- Drop restrictive policies
DROP POLICY IF EXISTS session_owner_all ON sessions;
DROP POLICY IF EXISTS insert_email_logs ON email_logs;
DROP POLICY IF EXISTS admin_select_all_email_logs ON email_logs;

-- Re-enable RLS on sessions and email_logs to be sure
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY session_insert_all ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY session_select_all ON sessions FOR SELECT USING (true);
CREATE POLICY session_update_all ON sessions FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY session_delete_all ON sessions FOR DELETE USING (true);

-- Email Logs policies
CREATE POLICY email_logs_insert_all ON email_logs FOR INSERT WITH CHECK (true);
CREATE POLICY email_logs_select_all ON email_logs FOR SELECT USING (true);
CREATE POLICY email_logs_update_all ON email_logs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY email_logs_delete_all ON email_logs FOR DELETE USING (true);
