const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ CRITICAL: Missing Supabase credentials. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Render Dashboard.");
  // Provide a mock client or exit gracefully if required, but for now we follow the crash to ensure visibility
}

// Ensure we don't pass undefined to createClient
if (!supabaseUrl) {
  module.exports = null; 
} else {
  const supabase = createClient(supabaseUrl, supabaseKey);
  module.exports = supabase;
}
