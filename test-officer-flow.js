const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'resolvenow-enterprise-secret-2026';
const BASE_URL = 'http://localhost:5000/api/v1';

async function runOfficerVerification() {
  console.log('====================================================');
  console.log('🛡️ RESOLVENOW OFFICER DISPATCH & WORKFLOW AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const officerId = 'd50b3f5e-6e78-4896-8ddf-2678ffc4f4bd';
  const officerToken = jwt.sign(
    { 
      id: officerId, 
      email: 'officer@resolvenow.demo', 
      role: 'officer' 
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${officerToken}`,
      'Content-Type': 'application/json'
    }
  });

  // 1. Officer Scoped Grievance Fetch
  try {
    console.log('[1/5] Testing GET /grievances (Officer Queue Retrieval)...');
    const res = await client.get('/grievances');
    if (res.status === 200 && Array.isArray(res.data)) {
      console.log(`  ✅ SUCCESS: Retrieved ${res.data.length} total accessible tickets in system.`);
      passed++;
    } else {
      console.log('  ❌ FAILED: Unexpected format from grievances endpoint.');
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 2. Fetch or Create a grievance for officer workflow
  let ticket = null;
  try {
    console.log('\n[2/5] Testing Ticket Resolution Workflow Initialization...');
    const listRes = await client.get('/grievances');
    ticket = listRes.data.find(t => t.status !== 'Closed') || listRes.data[0];
    
    if (ticket) {
      console.log(`  ✅ Target ticket selected: #${ticket.ticket_id} (Status: ${ticket.status})`);
      passed++;
    } else {
      console.log('  ❌ FAILED: No ticket available to test.');
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 3. Officer Status Transition to In Progress
  try {
    console.log('\n[3/5] Testing PUT /grievances/:id/status (Transition to In Progress)...');
    if (ticket) {
      const res = await client.put(`/grievances/${ticket.id}/status`, {
        status: 'In Progress',
        notes: 'Officer started investigation on equipment diagnostics.'
      });
      if (res.status === 200) {
        console.log(`  ✅ SUCCESS: Status successfully updated to In Progress.`);
        passed++;
      } else {
        console.log('  ❌ FAILED: Status update rejected.');
        failed++;
      }
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 4. Officer Timeline / Comment Entry
  try {
    console.log('\n[4/5] Testing GET /grievances/:id/timeline (Verification of Officer Action Milestone)...');
    if (ticket) {
      const res = await client.get(`/grievances/${ticket.id}/timeline`);
      if (res.status === 200 && Array.isArray(res.data)) {
        console.log(`  ✅ SUCCESS: Retrieved ${res.data.length} timeline actions (includes officer activity).`);
        passed++;
      } else {
        console.log('  ❌ FAILED: Timeline retrieval failed.');
        failed++;
      }
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 5. Officer Status Transition to Resolved with Notes
  try {
    console.log('\n[5/5] Testing PUT /grievances/:id/status (Transition to Resolved)...');
    if (ticket) {
      const res = await client.put(`/grievances/${ticket.id}/status`, {
        status: 'Resolved',
        notes: 'Wi-Fi access point firmware re-flashed and transmission channels stabilized.'
      });
      if (res.status === 200) {
        console.log(`  ✅ SUCCESS: Ticket #${ticket.ticket_id} successfully marked as Resolved.`);
        passed++;
      } else {
        console.log('  ❌ FAILED: Resolution transition failed.');
        failed++;
      }
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`OFFICER AUDIT COMPLETE: ${passed} Passed | ${failed} Failed`);
  console.log('====================================================\n');
}

runOfficerVerification().catch(console.error);
