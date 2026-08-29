/**
 * ResolveNow Production Pre-Flight Audit & Environment Integrity Checker
 * Verifies system configuration, database latency, and storage readiness before container initialization.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabase = require('../server/config/supabase');

const REQUIRED_ENV_VARS = [
  'PORT',
  'JWT_SECRET'
];

const RECOMMENDED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'SMTP_EMAIL',
  'SMTP_PASSWORD'
];

async function runPreflight() {
  console.log('====================================================');
  console.log('🚀 ResolveNow Enterprise Production Pre-Flight Audit');
  console.log('====================================================\n');

  let hasErrors = false;

  // 1. Environment Variable Audit
  console.log('📋 [1/5] Checking Environment Configuration...');
  const missingRequired = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
  if (missingRequired.length > 0) {
    console.error(`❌ Missing mandatory environment variables: ${missingRequired.join(', ')}`);
    hasErrors = true;
  } else {
    console.log('  ✅ Mandatory environment variables present.');
  }

  const missingRecommended = RECOMMENDED_ENV_VARS.filter(key => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn(`  ⚠️ Missing recommended variables (will use fallbacks): ${missingRecommended.join(', ')}`);
  } else {
    console.log('  ✅ Recommended production variables present.');
  }

  // 2. Database Connectivity & Ping Latency
  console.log('\n🗄️ [2/5] Testing Database Connection & Latency...');
  if (!supabase) {
    console.error('❌ Supabase client initialization failed (missing URL or Key).');
    hasErrors = true;
  } else {
    const startTime = Date.now();
    try {
      const { error } = await supabase.from('grievances').select('id', { count: 'exact', head: true }).limit(1);
      const latencyMs = Date.now() - startTime;
      if (error) {
        console.warn(`  ⚠️ Database query responded with warning (${latencyMs}ms): ${error.message}`);
      } else {
        console.log(`  ✅ Database connected successfully. Ping latency: ${latencyMs}ms`);
      }
    } catch (err) {
      console.error(`❌ Database unreachable: ${err.message}`);
      hasErrors = true;
    }
  }

  // 3. Storage Directory & Write Permissions
  console.log('\n📁 [3/5] Verifying Storage & Write Permissions...');
  const dirs = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../backups')
  ];

  dirs.forEach(dir => {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const testFile = path.join(dir, '.write-test');
      fs.writeFileSync(testFile, 'ok');
      fs.unlinkSync(testFile);
      console.log(`  ✅ Writable directory: ${path.basename(dir)}`);
    } catch (err) {
      console.error(`❌ Storage permission error on ${dir}: ${err.message}`);
      hasErrors = true;
    }
  });

  // 4. Frontend Build Artifacts Audit
  console.log('\n📦 [4/5] Inspecting Frontend Production Build Artifacts...');
  const distDir = path.join(__dirname, '../dist');
  const indexHtml = path.join(distDir, 'index.html');

  if (fs.existsSync(indexHtml)) {
    const stats = fs.statSync(indexHtml);
    console.log(`  ✅ Frontend index.html ready (${stats.size} bytes).`);
  } else {
    console.warn('  ⚠️ Frontend bundle not detected in dist/. (Run "npm run build" before deploying).');
  }

  // 5. Overall Verdict
  console.log('\n====================================================');
  if (hasErrors) {
    console.error('❌ PRE-FLIGHT AUDIT FAILED — Fix the issues above before starting production containers.');
    console.log('====================================================\n');
    return false;
  } else {
    console.log('✅ PRE-FLIGHT AUDIT PASSED — System is ready for production traffic!');
    console.log('====================================================\n');
    return true;
  }
}

if (require.main === module) {
  runPreflight().then(passed => {
    process.exitCode = passed ? 0 : 1;
  });
}

module.exports = { runPreflight };
