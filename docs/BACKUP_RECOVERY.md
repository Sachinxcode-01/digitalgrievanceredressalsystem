# Backup, Recovery & Disaster Recovery Plan (DRP)

This document establishes the official enterprise data protection, business continuity, and system recovery guidelines for the **ResolveNow v2.0** Digital Grievance Redressal System.

---

## 1. Database Backup Strategy

ResolveNow relies on **Supabase Cloud PostgreSQL** for data persistence. The backup regime is split into two operational tiers:

### A. Point-in-Time Recovery (PITR)
- **Objective**: Protects against accidental data corruption or loss.
- **Coverage**: Enables the database state to be restored to any given second over the last **7 days**.
- **Mechanics**: Write-Ahead Logs (WAL) are continuously archived and streamed to secure, segregated cloud storage buckets.

### B. Daily Automated Backups
- **Objective**: Long-term retention and disaster resilience.
- **Coverage**: Logical snapshot of the full database schema and row records.
- **Retention**: Preserved for **30 days** in a distinct physical AWS S3 region from the primary database cluster.
- **Schedule**: Automatically executed every day at 03:00 UTC (during low-traffic maintenance windows).

---

## 2. Storage Backup Strategy

User-submitted grievance attachments and avatars reside in **Supabase Storage buckets** (`grievance-attachments`, `avatars`).

- **S3 Mirroring**: Buckets are synced weekly to an institutional, read-only AWS S3 bucket using a scheduled worker script.
- **Bucket Versioning**: Destination S3 buckets have object versioning enabled. If a file is deleted from Supabase Storage, the historical versions are retained on S3 to prevent ransomware attacks or accidental deletions.
- **Access Control**: Cross-Origin Resource Sharing (CORS) and IAM roles restrict access exclusively to the server backend.

---

## 3. Disaster Recovery Plan (DRP)

In the event of a catastrophic regional cloud outage, the following failover metrics and protocols are defined:

### Key Metrics
- **Recovery Time Objective (RTO)**: `< 2 Hours` (Maximum time allowed to restore full operational capability after service failure).
- **Recovery Point Objective (RPO)**: `< 5 Minutes` (Maximum acceptable data loss window measured in time).

### Failover Runbook
1. **Outage Triaging**: If the primary region (e.g. AWS us-east-1) goes down, the NOC triggers the DNS failover protocol.
2. **DNS Routing**: Route53 / Cloudflare DNS records are rotated to target the standby container instance in the secondary region (e.g. AWS us-west-2).
3. **Database Promotion**: The replica database in the standby region is promoted to primary writer node.
4. **App Sync**: Express backend containers are restarted with updated `SUPABASE_URL` pointing to the promoted database cluster.

---

## 4. Rollback Procedures

### A. Database Migration Rollback
If a schema migration introduces a critical failure:
1. Identify the failing migration file.
2. Apply the corresponding `down` SQL script using Supabase migration CLI:
   ```bash
   supabase db reset --db-url "$PRODUCTION_DB_URL"
   ```
3. Re-verify the database integrity and ensure all primary constraints are intact.

### B. Code Deployment Rollback
For application regressions:
- **Frontend (Vercel)**: Log in to Vercel console, select the previous stable deployment, and click **"Redeploy to Production"** to instantly revert the router assets.
- **Backend (Render/Railway)**: Locate the previous Docker image hash in the deployment history and click **"Rollback"**. The orchestrator will swap containers within 30 seconds without dropping active sockets.
