-- Schema Version 3.0: System Settings, Departments, SLAs, Templates and Config Center

-- Enable pgcrypto if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. DROP TABLES IF THEY EXIST (IN CORRECT DEPENDENCY ORDER)
DROP TABLE IF EXISTS escalation_rules CASCADE;
DROP TABLE IF EXISTS sla_rules CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;

-- 2. CREATE system_settings TABLE
CREATE TABLE system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'general', 'auth', 'email', 'sms', 'ai', 'notification', 'security', 'maintenance'
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE departments TABLE
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    head_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    assignment_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE sla_rules TABLE
CREATE TABLE sla_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL, -- e.g., 'IT Support', 'Financial', 'Academic', 'Maintenance' or 'All'
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
    resolution_time_hours INTEGER NOT NULL,
    warning_time_hours INTEGER DEFAULT 12 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CREATE escalation_rules TABLE
CREATE TABLE escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    sla_rule_id UUID REFERENCES sla_rules(id) ON DELETE CASCADE NOT NULL,
    trigger_delay_hours INTEGER NOT NULL,
    escalate_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CREATE email_templates TABLE
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CREATE sms_templates TABLE
CREATE TABLE sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    body VARCHAR(500) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. INDEXES FOR SETTINGS LOOKUPS
CREATE INDEX idx_system_settings_category ON system_settings(category);
CREATE INDEX idx_departments_head ON departments(head_user_id);
CREATE INDEX idx_sla_rules_priority ON sla_rules(priority);
CREATE INDEX idx_escalation_rules_sla ON escalation_rules(sla_rule_id);

-- 9. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;

-- 10. DEFINE POLICIES
-- Read Policies: all authenticated users can read configuration schemas
CREATE POLICY system_settings_read_all ON system_settings FOR SELECT USING (true);
CREATE POLICY departments_read_all ON departments FOR SELECT USING (true);
CREATE POLICY sla_rules_read_all ON sla_rules FOR SELECT USING (true);
CREATE POLICY escalation_rules_read_all ON escalation_rules FOR SELECT USING (true);
CREATE POLICY email_templates_read_all ON email_templates FOR SELECT USING (true);
CREATE POLICY sms_templates_read_all ON sms_templates FOR SELECT USING (true);

-- Super admin modify policies
CREATE POLICY system_settings_all ON system_settings FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super admin'
));
CREATE POLICY departments_all ON departments FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super admin'
));
CREATE POLICY sla_rules_all ON sla_rules FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super admin'
));
CREATE POLICY escalation_rules_all ON escalation_rules FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super admin'
));
CREATE POLICY email_templates_all ON email_templates FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super admin'
));
CREATE POLICY sms_templates_all ON sms_templates FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super admin'
));

-- 11. SEED SYSTEM SETTINGS
INSERT INTO system_settings (key, value, category, description) VALUES
-- General settings
('institution_name', '"ResolveNow University"', 'general', 'The display name of the institution using the redressal portal.'),
('logo_url', '""', 'general', 'The logo image URL of the institution.'),
('contact_phone', '"+1 (555) 123-4567"', 'general', 'General contact telephone number.'),
('support_email', '"support@resolvenow.system"', 'general', 'Primary support email address.'),
('timezone', '"Asia/Kolkata"', 'general', 'Default institutional reporting timezone.'),
('date_format', '"MM/DD/YYYY"', 'general', 'Default date format for UI tables.'),
('language', '"en"', 'general', 'Default portal language.'),

-- Authentication settings
('otp_expiry_seconds', '300', 'auth', 'OTP validation code lifetime in seconds.'),
('session_expiry_minutes', '60', 'auth', 'Duration of session inactivity timeout.'),
('password_policy', '{"minLength": 8, "requireNumbers": true, "requireSpecial": true}', 'auth', 'Password complexity parameters.'),
('max_login_attempts', '5', 'auth', 'Failed login attempts allowed before lockout.'),
('lockout_duration_minutes', '30', 'auth', 'Lockout duration after exceeding failed logins.'),
('enable_google_login', 'false', 'auth', 'Toggle Google SSO login.'),
('force_email_verification', 'true', 'auth', 'Require verified email before active triage access.'),

-- Email SMTP settings
('smtp_host', '"smtp.ethereal.email"', 'email', 'SMTP server domain host.'),
('smtp_port', '587', 'email', 'SMTP server handshake port.'),
('smtp_username', '""', 'email', 'SMTP server username.'),
('smtp_password', '""', 'email', 'SMTP server password.'),
('smtp_ssl', 'false', 'email', 'Use SSL/TLS for SMTP handshake.'),
('sender_name', '"ResolveNow Core Dispatch"', 'email', 'Display sender name for automated dispatches.'),
('sender_email', '"no-reply@resolvenow.system"', 'email', 'Dispatched from email address.'),

-- SMS Gateway settings
('sms_provider', '"android-gateway"', 'sms', 'Active SMS delivery service provider.'),
('sms_api_url', '"http://10.105.47.157:8080/api/v1"', 'sms', 'SMS Gateway host address.'),
('sms_login', '"sms"', 'sms', 'SMS Gateway credential login.'),
('sms_password', '"FeemKLig"', 'sms', 'SMS Gateway password.'),

-- Gemini AI settings
('gemini_api_key', '""', 'ai', 'Google Gemini AI development access key.'),
('gemini_model', '"gemini-1.5-flash"', 'ai', 'Model variant selection.'),
('enable_ai_categorization', 'true', 'ai', 'Auto-classify incoming grievances via Gemini.'),
('enable_sentiment_analysis', 'true', 'ai', 'Detect frustration index metrics.'),
('enable_urgency_detection', 'true', 'ai', 'Assess urgency based on incident statements.'),
('enable_ai_suggestions', 'true', 'ai', 'Draft solutions for officers automatically.'),

-- Notification settings
('enable_email_notifications', 'true', 'notification', 'Enable email delivery for operations.'),
('enable_sms_notifications', 'true', 'notification', 'Enable SMS notifications for critical OTP dispatches.'),
('enable_push_notifications', 'false', 'notification', 'Toggle desktop browser push notifications.'),
('enable_in_app_notifications', 'true', 'notification', 'Enable in-app bell notifications.'),

-- Security settings
('rate_limit_max', '100', 'security', 'Max requests allowed in a 15-minute window per IP.'),
('session_device_tracking', 'true', 'security', 'Audit active browser agent device footprints.'),
('enable_audit_logging', 'true', 'security', 'Record all admin database mutations.'),
('enable_security_alerts', 'true', 'security', 'Log alerts for locks and updates.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 12. SEED DEFAULT DEPARTMENTS
INSERT INTO departments (name, description, assignment_rules) VALUES
('Academic Affairs', 'Curriculum, grade corrections, faculty complaints, and classroom concerns.', '{"autoAssign": true}'),
('IT Support', 'WiFi connection, network firewalls, account setups, and lab hardware support.', '{"autoAssign": true}'),
('Facilities & Maintenance', 'Hostel repairs, elevator outages, mess quality, sanitation, and electricity.', '{"autoAssign": true}'),
('Financial Services', 'Scholarship payouts, fee transactions, transaction errors, and billing audits.', '{"autoAssign": true}')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 13. SEED DEFAULT SLA RULES
INSERT INTO sla_rules (name, category, priority, resolution_time_hours, warning_time_hours) VALUES
('Critical Academic Escalation', 'Academic Affairs', 'High', 24, 6),
('Standard IT Ticket', 'IT Support', 'Medium', 48, 12),
('Hostel Emergency Repair', 'Facilities & Maintenance', 'High', 12, 3),
('General Fee Audit', 'Financial Services', 'Low', 72, 24)
ON CONFLICT DO NOTHING;

-- 14. SEED EMAIL TEMPLATES
INSERT INTO email_templates (name, subject, body, description, is_system) VALUES
('welcome_email', 'Welcome to ResolveNow: Identity Verified', '<p>Hello <strong>{{fullName}}</strong>,</p>\n<p>Welcome to the <strong>ResolveNow Institutional Network</strong>. Your account registration was successful and your access has been initialized.</p>\n<div class="card">\n  <h3>Access Dossier</h3>\n  <p style="margin: 5px 0;"><strong>Identity Reference:</strong> {{email}}</p>\n  <p style="margin: 5px 0;"><strong>Portal Status:</strong> Operational</p>\n</div>\n<p>Use the link below to enter the console and track your filings.</p>', 'Sent to users when they verify their account.', true),
('otp_email', 'Secure OTP Code: {{otp}}', '<p>Hello,</p>\n<p>A One-Time Password (OTP) has been generated to verify your identity for <strong>{{purpose}}</strong>.</p>\n<div class="highlight">{{otp}}</div>\n<p>For your security, this code is valid for exactly <strong>5 minutes</strong>. Do not share this credential with anyone.</p>\n<p>If you did not initiate this request, contact system security response immediately.</p>', 'OTP verification email.', true),
('password_changed_email', 'ResolveNow: Password Changed Successfully', '<p>Hello,</p>\n<p>This is confirmation that the password for your ResolveNow account has been <strong>successfully updated</strong>.</p>\n<p>All other active sessions on different browsers and devices have been automatically terminated for safety.</p>\n<div class="card" style="border-left: 4px solid #ef4444; background: rgba(239, 68, 68, 0.05);">\n  <h3>Security Warning</h3>\n  <p style="margin: 0; color: #f87171;">If you did not authorize this change, please recover your account immediately or notify system security.</p>\n</div>', 'Notification when user shifts their password.', true),
('grievance_created_email', 'Grievance Recorded: #{{ticketId}}', '<p>Hello,</p>\n<p>We have successfully registered your grievance. An administrative officer will review the report shortly.</p>\n<div class="card">\n  <h3>Filing Metadata</h3>\n  <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #{{ticketId}}</p>\n  <p style="margin: 5px 0;"><strong>Subject sector:</strong> {{title}}</p>\n  <p style="margin: 5px 0;"><strong>Processing Status:</strong> Pending Review</p>\n</div>', 'Filing confirmation email.', true),
('grievance_assigned_email', 'ASSIGNMENT ALERT: Ticket #{{ticketId}}', '<p>Hello Officer,</p>\n<p>A new grievance ticket has been assigned to your review queue.</p>\n<div class="card">\n  <h3>Assignment Parameters</h3>\n  <p style="margin: 5px 0;"><strong>Ticket ID:</strong> #{{ticketId}}</p>\n  <p style="margin: 5px 0;"><strong>Subject:</strong> {{title}}</p>\n  <p style="margin: 5px 0;"><strong>Category Group:</strong> {{category}}</p>\n  <p style="margin: 5px 0;"><strong>Urgency Rating:</strong> {{priority}}</p>\n</div>', 'Notification when a ticket is assigned to an officer.', true),
('grievance_status_updated_email', 'ResolveNow Status Update: #{{ticketId}}', '<p>Hello,</p>\n<p>Your grievance filing <strong>#{{ticketId}}</strong> has advanced to a new status milestone.</p>\n<div class="card" style="text-align: center; background: rgba(67, 97, 238, 0.05); shadow: none;">\n  <p style="font-size: 16px; margin: 0;">\n    <span style="color: #64748b; text-decoration: line-through;">{{oldStatus}}</span> \n    <strong style="color: #38bdf8; margin: 0 15px;">➡️</strong> \n    <strong style="color: #38bdf8; text-transform: uppercase;">{{newStatus}}</strong>\n  </p>\n</div>\n<p>Subject: <em>\"{{title}}\"</em></p>', 'Notification when status shifts.', true),
('resolution_completed_email', 'RESOLVED: Grievance #{{ticketId}} Resolved', '<p>Hello,</p>\n<p>Your grievance filing <strong>#{{ticketId}}</strong> has been successfully resolved.</p>\n<div class="card">\n  <h3>Resolution Statement</h3>\n  <p style="font-style: italic;">\"{{notes}}\"</p>\n  <p style="margin: 15px 0 0 0; font-size: 12px; color: #64748b;"><strong>Resolved At:</strong> {{time}}</p>\n</div>', 'Sent on ticket resolution.', true)
ON CONFLICT (name) DO UPDATE SET subject = EXCLUDED.subject, body = EXCLUDED.body;

-- 15. SEED SMS TEMPLATES
INSERT INTO sms_templates (name, body, description, is_system) VALUES
('otp_sms', '[ResolveNow] Your secure identity key is: {{otp}}. It expires in 5 minutes.', 'SMS verification code format.', true),
('status_changed_sms', '[ResolveNow] Grievance #{{ticketId}} status has been updated from {{oldStatus}} to {{newStatus}}.', 'SMS dispatch when status changes.', true)
ON CONFLICT (name) DO UPDATE SET body = EXCLUDED.body;
