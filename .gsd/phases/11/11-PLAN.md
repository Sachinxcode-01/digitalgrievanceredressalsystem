---
phase: 11
plan: 1
wave: 1
---

# Plan 11.1: Live Security Auditing with Supabase Realtime

## Objective
Implement real-time administrative monitoring by migrating the hardcoded `SecurityAudit` dashboard module to listen to actual database changes via Supabase PostgreSQL streaming, and implement automated audit trails across critical application pathways.

## Context
- .gsd/SPEC.md
- src/components/ui/SecurityAudit.jsx
- src/pages/LoginPage.jsx

## Tasks

<task type="auto">
  <name>Create Audit Logging Module</name>
  <files>src/lib/auditLogger.js</files>
  <action>
    - Create a utility file exposing a `logSecurityEvent(event, userEmail, location, level)` function.
    - Inside, execute `supabase.from('audit_logs').insert(...)` with the provided parameters, defaulting `ip_address` to '127.0.0.1' or fetching it if possible.
  </action>
  <verify>cat src/lib/auditLogger.js</verify>
  <done>Utility file created and correctly configured.</done>
</task>

<task type="auto">
  <name>Implement Live Audit Subscriptions</name>
  <files>src/components/ui/SecurityAudit.jsx</files>
  <action>
    - Replace the hardcoded `auditLogs` array with a React state initialized via an asynchronous Supabase `select` query (sorted desc, limit 5).
    - Insert a `useEffect` hook to subscribe to real-time additions:
      `supabase.channel('custom-insert-channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, (payload) => setAuditLogs((prev) => [payload.new, ...prev].slice(0, 5))).subscribe();`
    - Ensure component unmount unsubscribes to prevent memory leaks.
    - Map the payload to the UI list correctly by replacing existing field references with Supabase ones (e.g., `log.user_email`, `log.created_at`).
  </action>
  <verify>grep "supabase.channel" src/components/ui/SecurityAudit.jsx</verify>
  <done>Security audit feed reflects real-time Supabase entries.</done>
</task>

<task type="auto">
  <name>Integrate Action Tracking in Core Flows</name>
  <files>src/pages/LoginPage.jsx, src/pages/UserDashboard.jsx</files>
  <action>
    - In `LoginPage.jsx`, locate the successful login paths for administrators and execute `logSecurityEvent('Admin Session Initiated', email, 'Auth Gateway', 'info')`.
    - In `UserDashboard.jsx`, locate grievance creation and log `logSecurityEvent('New Grievance Created', userEmail, 'User Node', 'warning')`.
  </action>
  <verify>grep "logSecurityEvent" src/pages/LoginPage.jsx</verify>
  <done>Critical admin/user actions stream directly into the Supabase database.</done>
</task>

## Success Criteria
- [ ] Submitting a sample grievance from a User account immediately updates the Admin Dashboard's `SecurityAudit` widget organically via WebSockets.
- [ ] Admin login accurately generates a security log entry.
- [ ] The `SecurityAudit.jsx` component successfully queries and renders the last 5 logs.
