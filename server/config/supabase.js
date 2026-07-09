const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

// Server-side operations require the SERVICE ROLE (secret) key so privileged
// inserts/updates bypass Row-Level Security. We intentionally do NOT fall back to the
// anon/publishable key here — doing so silently causes confusing
// "new row violates row-level security policy" errors on server writes.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

/**
 * Detects whether the provided key can bypass RLS (service_role / secret key),
 * without ever logging the key value itself.
 */
const isPrivilegedKey = (key) => {
  if (!key) return false;
  if (key.startsWith('sb_secret_')) return true;        // new-format secret key
  if (key.startsWith('sb_publishable_')) return false;  // new-format publishable key
  if (key.startsWith('eyJ')) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1] || '', 'base64').toString('utf8'));
      return payload.role === 'service_role';
    } catch {
      return false;
    }
  }
  return false;
};

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '❌ CRITICAL: Missing Supabase credentials. SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY ' +
    'are required for server-side database access.'
  );
  module.exports = null;
} else {
  if (!isPrivilegedKey(supabaseKey)) {
    console.warn(
      '⚠️  [Supabase] SUPABASE_SERVICE_ROLE_KEY does not look like a service-role/secret key. ' +
      'Server-side writes may be blocked by Row-Level Security. Use the project\'s service_role (secret) key.'
    );
  }

  // The server client is stateless — it must not persist or auto-refresh a user session.
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  module.exports = supabase;
}
