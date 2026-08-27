/**
 * Startup Environment & Security Validation Utility
 */
function validateBootSecurity() {
  if (process.env.NODE_ENV === 'test') return { valid: true, missing: [] };

  const requiredVariables = [
    { name: 'JWT_SECRET', isSecret: true },
    { name: 'SUPABASE_URL', isSecret: false },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', isSecret: true }
  ];

  const optionalRecommended = [
    'GEMINI_API_KEY',
    'VITE_CLERK_PUBLISHABLE_KEY',
    'CLERK_SECRET_KEY'
  ];

  const missingRequired = [];
  const missingOptional = [];

  requiredVariables.forEach(({ name }) => {
    if (!process.env[name]) {
      missingRequired.push(name);
    }
  });

  optionalRecommended.forEach(name => {
    if (!process.env[name]) {
      missingOptional.push(name);
    }
  });

  // Check for weak / default JWT_SECRET in production
  if (process.env.NODE_ENV === 'production') {
    const defaultSecrets = ['secret', 'jwt_secret', 'resolvenow-enterprise-secret-2026', 'change_me'];
    if (defaultSecrets.includes((process.env.JWT_SECRET || '').toLowerCase())) {
      console.warn('⚠️ SECURITY ALERT: Production deployment is using a default or weak JWT_SECRET! Please set a high-entropy secret.');
    }
  }

  if (missingRequired.length > 0) {
    console.error('❌ SECURITY BOOT FAILURE: Required environment variables are missing:');
    missingRequired.forEach(v => console.error(`   - ${v}`));
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  } else {
    console.log('🛡️ Security & Boot Environment Verification: 100% Passed.');
    if (missingOptional.length > 0) {
      console.log(`ℹ️ Optional Integration Keys Missing (System will use fallbacks): ${missingOptional.join(', ')}`);
    }
  }

  return {
    valid: missingRequired.length === 0,
    missingRequired,
    missingOptional
  };
}

module.exports = {
  validateBootSecurity
};
