-- ============================================================================
-- Migration: database_hardening_v1.sql
-- ResolveNow v2.0 - Database Integrity & Performance Hardening
-- Applied: 2026-06-07
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: Performance Indexes
-- ─────────────────────────────────────────────────────────────────────────────

-- OTP Verifications: composite indexes for the common lookup patterns
CREATE INDEX IF NOT EXISTS idx_otp_verifications_email_purpose
  ON public.otp_verifications (email, purpose);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone_purpose
  ON public.otp_verifications (phone, purpose);

CREATE INDEX IF NOT EXISTS idx_otp_verifications_expires_at
  ON public.otp_verifications (expires_at);

-- Password Resets: composite index for reset validation lookup
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id_verified
  ON public.password_resets (user_id, verified);

-- Sessions: index for expiry-based cleanup jobs
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at
  ON public.sessions (expires_at);

-- Grievances: composite index for per-user status queries (dashboard)
CREATE INDEX IF NOT EXISTS idx_grievances_user_status
  ON public.grievances (user_id, status);

-- Users: status and clerk_id lookup indexes
CREATE INDEX IF NOT EXISTS idx_users_status
  ON public.users (status);

CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id
  ON public.users (clerk_user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: Atomic Registration Function
-- Eliminates the check-then-insert race condition in registration.
-- Called via Supabase RPC: supabase.rpc('register_user', {...})
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.register_user(
  p_email         VARCHAR,
  p_mobile        VARCHAR,
  p_password_hash VARCHAR,
  p_role          VARCHAR  DEFAULT 'student',
  p_status        VARCHAR  DEFAULT 'inactive',
  p_email_verified BOOLEAN DEFAULT false,
  p_phone_verified BOOLEAN DEFAULT false
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_email  VARCHAR;
  v_existing_phone  VARCHAR;
  v_new_user        public.users;
BEGIN
  -- Normalise inputs
  p_email  := lower(trim(p_email));
  p_mobile := NULLIF(trim(p_mobile), '');

  -- Email collision check
  SELECT email INTO v_existing_email
    FROM public.users
   WHERE email = p_email
   LIMIT 1;

  IF v_existing_email IS NOT NULL THEN
    RAISE EXCEPTION 'EMAIL_ALREADY_EXISTS' USING ERRCODE = 'P0001';
  END IF;

  -- Phone collision check
  IF p_mobile IS NOT NULL THEN
    SELECT mobile_number INTO v_existing_phone
      FROM public.users
     WHERE mobile_number = p_mobile
     LIMIT 1;

    IF v_existing_phone IS NOT NULL THEN
      RAISE EXCEPTION 'PHONE_ALREADY_EXISTS' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  -- Atomic insert
  INSERT INTO public.users
    (email, mobile_number, password_hash, role, status, email_verified, phone_verified)
  VALUES
    (p_email, p_mobile, p_password_hash, p_role, p_status, p_email_verified, p_phone_verified)
  RETURNING * INTO v_new_user;

  RETURN v_new_user;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: Atomic Clerk User Sync Function
-- Upserts by email using ON CONFLICT — safe for concurrent Clerk webhooks.
-- Called via Supabase RPC: supabase.rpc('sync_clerk_user', {...})
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sync_clerk_user(
  p_email          VARCHAR,
  p_clerk_user_id  VARCHAR,
  p_mobile         VARCHAR DEFAULT NULL,
  p_role           VARCHAR DEFAULT 'student',
  p_full_name      VARCHAR DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user public.users;
BEGIN
  p_email         := lower(trim(p_email));
  p_clerk_user_id := trim(p_clerk_user_id);
  p_mobile        := NULLIF(trim(p_mobile), '');

  -- Upsert: insert new or update existing by email
  INSERT INTO public.users
    (email, clerk_user_id, mobile_number, password_hash, role, status, email_verified, phone_verified)
  VALUES
    (p_email, p_clerk_user_id, p_mobile, 'clerk-managed', p_role, 'active', true, (p_mobile IS NOT NULL))
  ON CONFLICT (email) DO UPDATE
    SET
      clerk_user_id  = EXCLUDED.clerk_user_id,
      status         = CASE WHEN users.status = 'inactive' THEN 'active' ELSE users.status END,
      email_verified = true,
      mobile_number  = COALESCE(EXCLUDED.mobile_number, users.mobile_number),
      phone_verified = CASE WHEN EXCLUDED.mobile_number IS NOT NULL THEN true ELSE users.phone_verified END,
      updated_at     = now()
  RETURNING * INTO v_user;

  RETURN v_user;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: Session Cleanup Helper (optional cron use)
-- Deletes expired sessions to keep the table lean.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.sessions
   WHERE expires_at < now();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
