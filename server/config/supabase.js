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

/**
 * Checks whether an error is transient (network drop, socket timeout, 502/503/504 gateway error).
 */
const isTransientError = (err) => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  const code = (String(err.code || '')).toLowerCase();
  const status = String(err.status || err.statusCode || '');
  return (
    code === 'econnreset' ||
    code === 'etimedout' ||
    code === 'econnrefused' ||
    status === '502' ||
    status === '503' ||
    status === '504' ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('connection reset') ||
    msg.includes('socket hang up') ||
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused')
  );
};

/**
 * Executes a Supabase query with exponential backoff retry for transient network faults.
 */
const executeWithRetry = async (queryFn, options = {}) => {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 300;
  const backoffFactor = options.backoffFactor ?? 2;

  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt <= maxRetries) {
    try {
      const result = await queryFn();
      if (result && result.error && isTransientError(result.error) && attempt < maxRetries) {
        attempt++;
        console.warn(`[Supabase Retry] Transient DB error (attempt ${attempt}/${maxRetries}): ${result.error.message || result.error.code}. Retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= backoffFactor;
        continue;
      }
      return result;
    } catch (networkErr) {
      if (attempt < maxRetries && isTransientError(networkErr)) {
        attempt++;
        console.warn(`[Supabase Retry] Network drop (attempt ${attempt}/${maxRetries}): ${networkErr.message}. Retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= backoffFactor;
        continue;
      }
      throw networkErr;
    }
  }
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
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { 'x-client-info': 'resolvenow-backend/2.0' }
    }
  });

  supabase.executeWithRetry = executeWithRetry;

  module.exports = supabase;
  module.exports.supabase = supabase;
  module.exports.executeWithRetry = executeWithRetry;
}
