import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://ihrglolpihflyfdpytgv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_-WapU4yYY0Hj84QDSkMwFw_KBPRRMmp';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isMisconfigured = !supabaseUrl || !supabaseAnonKey;

