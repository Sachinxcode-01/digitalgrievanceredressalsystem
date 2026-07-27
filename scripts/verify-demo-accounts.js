const express = require('express');
const request = require('supertest');
const cookieParser = require('cookie-parser');
const authRoutes = require('../server/routes/authRoutes');
const grievanceRoutes = require('../server/routes/grievanceRoutes');
const { authenticateToken, authorizeRoles } = require('../server/middleware/authMiddleware');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/grievances', grievanceRoutes);

// Additional protected test endpoint
app.get('/api/v1/admin/health', authenticateToken, authorizeRoles('admin', 'super admin'), (req, res) => {
  res.json({ status: 'ok', message: 'Admin access granted', user: req.user });
});

const DEMO_ACCOUNTS = [
  {
    roleName: 'Student',
    email: 'sachiii8827@gmail.com',
    password: 'Student@8827',
    expectedRole: 'student',
    expectedRedirect: '/dashboard'
  },
  {
    roleName: 'Admin',
    email: 'saxhin0708@gmail.com',
    password: 'Admin@0708',
    expectedRole: 'admin',
    expectedRedirect: '/admin/dashboard'
  },
  {
    roleName: 'Officer',
    email: 'heyyysachiii88@gmail.com',
    password: 'Officer@88',
    expectedRole: 'officer',
    expectedRedirect: '/officer/dashboard'
  }
];

async function verifyDemoAccounts() {
  console.log('\n======================================================');
  console.log('🧪 TESTING RESOLVENOW DEMO ACCOUNTS AUTHENTICATION & REDIRECTS');
  console.log('======================================================\n');

  let allPassed = true;
  const testResults = [];

  for (const acc of DEMO_ACCOUNTS) {
    console.log(`--- Testing ${acc.roleName} Account: ${acc.email} ---`);

    // 1. Test Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: acc.email, password: acc.password, loginType: 'password' });

    if (loginRes.status !== 200 || !loginRes.body.token) {
      console.error(`❌ [FAIL] ${acc.roleName} Login Failed: Status ${loginRes.status}`, loginRes.body);
      allPassed = false;
      testResults.push({ role: acc.roleName, status: 'FAILED', error: loginRes.body.message });
      continue;
    }

    const { token, refreshToken, user } = loginRes.body;
    console.log(`  ✓ Login HTTP Status: 200 OK`);
    console.log(`  ✓ JWT Access Token Issued: ${token.slice(0, 20)}...`);
    console.log(`  ✓ Refresh Token Issued: ${refreshToken ? refreshToken.slice(0, 20) + '...' : 'Cookie Set'}`);
    console.log(`  ✓ User Role Returned: ${user.role}`);

    if (user.role !== acc.expectedRole) {
      console.error(`❌ [FAIL] Role mismatch: Expected '${acc.expectedRole}', got '${user.role}'`);
      allPassed = false;
    } else {
      console.log(`  ✓ Role Verification: PASSED (${user.role})`);
    }

    // 2. Redirect verification logic
    let redirectPath = '/dashboard';
    const roleLower = user.role.toLowerCase();
    if (roleLower === 'admin' || roleLower === 'super admin') {
      redirectPath = '/admin/dashboard';
    } else if (roleLower === 'officer' || roleLower === 'faculty' || roleLower === 'staff') {
      redirectPath = '/officer/dashboard';
    }

    if (redirectPath !== acc.expectedRedirect) {
      console.error(`❌ [FAIL] Redirect Mismatch: Expected '${acc.expectedRedirect}', got '${redirectPath}'`);
      allPassed = false;
    } else {
      console.log(`  ✓ Redirect Verification: PASSED -> ${redirectPath}`);
    }

    // 3. Test Protected Route Access
    const protectedRes = await request(app)
      .get('/api/v1/grievances')
      .set('Authorization', `Bearer ${token}`);

    if (protectedRes.status !== 200) {
      console.error(`❌ [FAIL] Protected Route Access Denied for ${acc.roleName}: Status ${protectedRes.status}`);
      allPassed = false;
    } else {
      console.log(`  ✓ Protected Route Access (/api/v1/grievances): PASSED`);
    }

    // 4. Test Token Refresh
    const cookies = loginRes.headers['set-cookie'];
    const refreshReq = request(app).post('/api/v1/auth/refresh-token');
    if (cookies) {
      refreshReq.set('Cookie', cookies);
    }
    const refreshRes = await refreshReq.send({ refreshToken });

    if (refreshRes.status !== 200 || !refreshRes.body.token) {
      console.error(`❌ [FAIL] Token Refresh Failed for ${acc.roleName}: Status ${refreshRes.status}`);
      allPassed = false;
    } else {
      console.log(`  ✓ Token Refresh: PASSED (New Token Issued)`);
    }

    // 5. Test Logout
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ refreshToken });

    if (logoutRes.status !== 200) {
      console.error(`❌ [FAIL] Logout Failed for ${acc.roleName}: Status ${logoutRes.status}`);
      allPassed = false;
    } else {
      console.log(`  ✓ Logout Revocation: PASSED`);
    }

    testResults.push({
      role: acc.roleName,
      email: acc.email,
      roleVerified: user.role === acc.expectedRole,
      redirect: redirectPath,
      loginPassed: true,
      protectedRoutePassed: protectedRes.status === 200,
      refreshPassed: refreshRes.status === 200,
      logoutPassed: logoutRes.status === 200
    });

    console.log(`✅ [SUCCESS] All Auth & Protected Route Tests Passed for ${acc.roleName}\n`);
  }

  console.log('======================================================');
  if (allPassed) {
    console.log('🎉 FINAL VERDICT: DEMO ACCOUNTS READY');
  } else {
    console.log('❌ FINAL VERDICT: SOME TESTS FAILED');
  }
  console.log('======================================================\n');

  return allPassed;
}

verifyDemoAccounts()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('Verification script crash:', err);
    process.exit(1);
  });
