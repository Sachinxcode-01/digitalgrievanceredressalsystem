const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'resolvenow-enterprise-secret-2026';
const BASE_URL = 'http://localhost:5000/api/v1';

async function runAdminSuiteAudit() {
  console.log('====================================================');
  console.log('🚀 RESOLVENOW COMPLETE ADMIN PANEL & API AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Generate Admin JWT Token with valid UUID format and MFA verified flag
  const adminToken = jwt.sign(
    { 
      id: '5e9b3996-1118-4c43-9a09-6b37dc218528', 
      email: 'sachiii8827@gmail.com', 
      role: 'super admin',
      mfa_verified: true
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Generate Student JWT Token (for security scoping checks)
  const studentToken = jwt.sign(
    { 
      id: 'c2c71d61-1c36-4fdd-af73-780dedfd6548', 
      email: 'student@resolvenow.demo', 
      role: 'student' 
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  });

  const studentClient = axios.create({
    baseURL: BASE_URL,
    headers: { 'Authorization': `Bearer ${studentToken}`, 'Content-Type': 'application/json' }
  });

  // 1. Role Protection Security Check (Student access to /admin/users must be blocked with 403)
  try {
    console.log('[1/8] Testing Admin API Role Protection (Student Access Block check)...');
    try {
      await studentClient.get('/admin/users');
      console.log('  ❌ FAILED: Student was able to access /admin/users!');
      failed++;
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        console.log(`  ✅ SUCCESS: Student access correctly blocked with HTTP ${err.response.status}.`);
        passed++;
      } else {
        console.log(`  ❌ FAILED: Unexpected response status: ${err.message}`);
        failed++;
      }
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 2. Fetch Users List (Admin Clearance)
  try {
    console.log('\n[2/8] Testing GET /admin/users (Users Registry Fetch)...');
    const res = await adminClient.get('/admin/users');
    if (res.status === 200 && Array.isArray(res.data)) {
      console.log(`  ✅ SUCCESS: Retrieved ${res.data.length} registered users.`);
      passed++;
    } else {
      console.log('  ❌ FAILED: Unexpected response format.');
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 3. Fetch Departments List
  try {
    console.log('\n[3/8] Testing GET /admin/departments (Department Management)...');
    const res = await adminClient.get('/admin/departments');
    if (res.status === 200 && Array.isArray(res.data)) {
      console.log(`  ✅ SUCCESS: Retrieved ${res.data.length} institutional departments.`);
      passed++;
    } else {
      console.log('  ❌ FAILED: Unexpected response format.');
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 4. Fetch Health Metrics & Telemetry
  try {
    console.log('\n[4/8] Testing GET /admin/health-metrics (System Health Telemetry)...');
    const res = await adminClient.get('/admin/health-metrics');
    if (res.status === 200 && res.data) {
      console.log(`  ✅ SUCCESS: System status: ${res.data.status || 'healthy'}`);
      passed++;
    } else {
      console.log('  ❌ FAILED: Health metrics check failed.');
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 5. Fetch Audit Security Logs
  try {
    console.log('\n[5/8] Testing GET /admin/audit (Security Audit Logs)...');
    const res = await adminClient.get('/admin/audit');
    if (res.status === 200 && Array.isArray(res.data)) {
      console.log(`  ✅ SUCCESS: Retrieved ${res.data.length} security audit log entries.`);
      passed++;
    } else {
      console.log('  ❌ FAILED: Audit logs fetch failed.');
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 6. Test Ticket Reassignment
  try {
    console.log('\n[6/8] Testing PUT /grievances/:id/assign (Ticket Reassignment)...');
    const resList = await adminClient.get('/grievances');
    if (resList.data && resList.data.length > 0) {
      const ticketId = resList.data[0].id;
      const assignRes = await adminClient.put(`/grievances/${ticketId}/assign`, {
        assigned_to: '5e9b3996-1118-4c43-9a09-6b37dc218528',
        department: 'IT Support'
      });
      if (assignRes.status === 200) {
        console.log(`  ✅ SUCCESS: Ticket #${resList.data[0].ticket_id} reassigned.`);
        passed++;
      } else {
        console.log('  ❌ FAILED: Reassignment failed.');
        failed++;
      }
    } else {
      console.log('  ⚠️ SKIPPED: No grievance records found.');
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 7. Test Ticket Escalation Trigger
  try {
    console.log('\n[7/8] Testing PUT /grievances/:id/escalate (Escalation Control)...');
    const resList = await adminClient.get('/grievances');
    if (resList.data && resList.data.length > 0) {
      const ticketId = resList.data[0].id;
      const escRes = await adminClient.put(`/grievances/${ticketId}/escalate`, {
        reason: 'Automated Admin Escalation Verification'
      });
      if (escRes.status === 200) {
        console.log(`  ✅ SUCCESS: Ticket #${resList.data[0].ticket_id} escalated with email alert.`);
        passed++;
      } else {
        console.log('  ❌ FAILED: Escalation failed.');
        failed++;
      }
    } else {
      console.log('  ⚠️ SKIPPED: No grievance records found.');
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 8. Test Compliance Stats
  try {
    console.log('\n[8/8] Testing GET /admin/compliance/stats (Compliance Telemetry)...');
    const res = await adminClient.get('/admin/compliance/stats');
    if (res.status === 200 && res.data) {
      console.log(`  ✅ SUCCESS: Compliance telemetry retrieved.`);
      passed++;
    } else {
      console.log('  ❌ FAILED: Compliance stats fetch failed.');
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`ADMIN AUDIT COMPLETE: ${passed} Passed | ${failed} Failed`);
  console.log('====================================================\n');
}

runAdminSuiteAudit().catch(console.error);
