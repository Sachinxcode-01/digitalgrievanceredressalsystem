-- ============================================================================
-- Migration: database_hardening_v2.sql
-- ResolveNow v2.0 - Database Integrity & Legacy Schema Cleanup
-- Applied: 2026-06-12
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Clean Up Orphaned Grievances
-- ─────────────────────────────────────────────────────────────────────────────
DELETE FROM public.grievances 
 WHERE user_id IS NOT NULL 
   AND user_id NOT IN (SELECT id FROM public.users);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Add Foreign Key Constraint to Grievances
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.grievances 
  DROP CONSTRAINT IF EXISTS grievances_user_id_fkey;

ALTER TABLE public.grievances 
  ADD CONSTRAINT grievances_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Prune Legacy Profiles Table
-- ─────────────────────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS public.profiles CASCADE;
