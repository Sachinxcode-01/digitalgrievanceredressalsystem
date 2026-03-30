# Phase 11 Research: Real-time Admin Monitoring & Security Audits

## Context
The application currently has a hardcoded security audit log inside `src/components/ui/SecurityAudit.jsx`. To fulfill the "Real-time Admin Monitoring & Security Audits" milestone, this data needs to be dynamic, immutable, and stream in real-time via WebSockets to admins.

## Implementation Strategy

### 1. Database Schema
We need an `audit_logs` table in our Supabase instance containing:
- `id` (UUID, PK)
- `event` (text) - Description of the action (e.g., 'Admin Login', 'Status Override')
- `user_email` (text) - Identifier of the actor
- `ip_address` (text, optional) - Sourced from frontend or backend 
- `location` (text) - e.g. 'Node Dashboard' 
- `level` (text) - info, warning, critical
- `created_at` (timestamp)

*Since we don't handle DDL directly, the GSD instructions will require the administrator to create this table and enable Realtime for it.*

### 2. Frontend Real-time Subscription (`SecurityAudit.jsx`)
- Replace the mock `auditLogs` array with a React state.
- Implement a `useEffect` to initially fetch the top 20 logs from `supabase.from('audit_logs')`.
- Subscribe to insertions via Supabase Realtime Channels (`supabase.channel('custom-all-channel').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, payload => { ... }).subscribe()`).
- When a payload is received, push the payload record to the top of the React state array, enforcing real-time updates.

### 3. Emitting Audits
We need to emit audits. We can either do this via a custom hook or service. We'll create a new service module (`src/services/auditService.js`) exposing `logAuditEvent(event, userEmail, level, location)`.
We can hook this into critical frontend functions:
- `handleLogin` in `LoginPage.jsx`
- Grievance updates (if the frontend does it, though it seems they might)

Wait, where do grievance updates happen? In `AdminDashboard.jsx`, there's likely a function to edit status. Let's look inside `AdminDashboard.jsx` if there's an `updateTicket` area. We can also just log when the admin logs entirely in.

## Conclusion
The architecture leverages Supabase's native PostgreSQL real-time streaming to negate the need for Socket.io on our Node.js server. The `SecurityAudit.jsx` component will act as a live monitoring terminal.
