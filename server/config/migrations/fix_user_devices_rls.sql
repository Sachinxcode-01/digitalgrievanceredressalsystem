-- =============================================================
-- MIGRATION: Fix RLS on user_devices to allow backend writes
-- File: fix_user_devices_rls.sql
-- Supabase Project: ihrglolpihflyfdpytgv
--
-- PROBLEM:
--   The existing policy uses FOR ALL USING (user_id = auth.uid()).
--   When the backend Express server uses the anon/publishable key,
--   auth.uid() returns NULL, so ALL operations (SELECT, INSERT,
--   UPDATE, DELETE) are blocked by this policy.
--
-- FIX:
--   Split the single FOR ALL policy into purpose-specific policies.
--   Allow INSERT and UPDATE from the server (WITH CHECK (true))
--   while keeping SELECT and DELETE scoped to the authenticated user.
-- =============================================================

-- Step 1: Remove the old blanket policy
DROP POLICY IF EXISTS device_owner_all ON user_devices;

-- Step 2: SELECT — only the owning user can view their own devices
CREATE POLICY device_select ON user_devices
  FOR SELECT
  USING (user_id = auth.uid());

-- Step 3: INSERT — allow backend server to register device records
--   (the server uses anon key and auth.uid() is NULL, so USING clause
--    would always fail; WITH CHECK (true) allows the insert regardless)
CREATE POLICY device_insert ON user_devices
  FOR INSERT
  WITH CHECK (true);

-- Step 4: UPDATE — allow backend server to update device activity
CREATE POLICY device_update ON user_devices
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Step 5: DELETE — only the owning user can remove their own devices
CREATE POLICY device_delete ON user_devices
  FOR DELETE
  USING (user_id = auth.uid());
