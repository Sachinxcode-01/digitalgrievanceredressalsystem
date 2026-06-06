-- Schema Version 2.0: Governance, Security, Compliance, and RBAC tables

-- Enable pgcrypto if not enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. DROP TABLES IF THEY EXIST (IN CORRECT DEPENDENCY ORDER)
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS admin_activity_logs CASCADE;

-- 2. CREATE roles TABLE
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE permissions TABLE
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE role_permissions TABLE
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role_id, permission_id)
);

-- 5. CREATE user_roles TABLE
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, role_id)
);

-- 6. CREATE security_events TABLE
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL, -- e.g., FAILED_LOGIN, ACCOUNT_LOCKOUT, SUSPICIOUS_ACTIVITY, MFA_CHALLENGE
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. CREATE admin_activity_logs TABLE
CREATE TABLE admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL, -- e.g., CREATE_USER, DELETE_USER, UPDATE_USER_ROLE, TICKET_ASSIGNMENT
    target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. INDEXES FOR COMPLIANCE AND LOG SEARCH
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_permissions_name ON permissions(name);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created ON security_events(created_at);
CREATE INDEX idx_admin_activity_created ON admin_activity_logs(created_at);

-- 9. SEED ROLES
INSERT INTO roles (name, description) VALUES
('student', 'Default student access clearance. Submit grievances and view personal updates.'),
('faculty', 'Faculty-level officer. Resolve academic and departmental issues.'),
('staff', 'Staff officer. Handle infrastructure, facilities, or support grievances.'),
('admin', 'Grievance officer. Administer tickets, view general analytics, manage operations.'),
('super admin', 'System Administrator. Control global policies, manage roles, and review audit trails.')
ON CONFLICT (name) DO NOTHING;

-- 10. SEED PERMISSIONS
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

-- 11. SEED ROLE-PERMISSION MAPPINGS
-- Student permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'student' AND p.name IN ('view_dashboard', 'submit_grievance')
ON CONFLICT DO NOTHING;

-- Faculty permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'faculty' AND p.name IN ('view_dashboard', 'submit_grievance', 'manage_grievances')
ON CONFLICT DO NOTHING;

-- Staff permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'staff' AND p.name IN ('view_dashboard', 'submit_grievance', 'manage_grievances')
ON CONFLICT DO NOTHING;

-- Admin permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name IN ('view_dashboard', 'submit_grievance', 'manage_grievances', 'manage_users', 'view_analytics', 'view_audit_logs')
ON CONFLICT DO NOTHING;

-- Super Admin permissions (All permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'super admin'
ON CONFLICT DO NOTHING;

-- 12. INITIAL USER-ROLE MIGRATION
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = u.role
ON CONFLICT DO NOTHING;

-- 13. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- 14. DEFINE POLICIES
-- Roles / Permissions: Accessible to authenticated operators, modify restricted to Super Admins
CREATE POLICY roles_read_all ON roles FOR SELECT USING (true);
CREATE POLICY roles_write_super ON roles FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super admin'
));

CREATE POLICY permissions_read_all ON permissions FOR SELECT USING (true);
CREATE POLICY permissions_write_super ON permissions FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super admin'
));

CREATE POLICY role_perms_read_all ON role_permissions FOR SELECT USING (true);
CREATE POLICY role_perms_write_super ON role_permissions FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'super admin'
));

CREATE POLICY user_roles_read_all ON user_roles FOR SELECT USING (true);
CREATE POLICY user_roles_write_admin ON user_roles FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super admin')
));

-- Security Events: Admins/Super Admins can read, System can insert
CREATE POLICY sec_events_read_admin ON security_events FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super admin')
));
CREATE POLICY sec_events_insert_system ON security_events FOR INSERT WITH CHECK (true);

-- Admin Activity Logs: Admins/Super Admins can read, System can insert
CREATE POLICY admin_logs_read_admin ON admin_activity_logs FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'super admin')
));
CREATE POLICY admin_logs_insert_system ON admin_activity_logs FOR INSERT WITH CHECK (true);
