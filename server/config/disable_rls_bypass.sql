-- SQL script to disable RLS on core user and profile tables.
-- Run this in your Supabase SQL Editor if the backend is configured using the public anon key.

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions DISABLE ROW LEVEL SECURITY;
