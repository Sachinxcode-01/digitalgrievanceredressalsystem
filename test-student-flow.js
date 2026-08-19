const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET || 'resolvenow-enterprise-secret-2026';
const BASE_URL = 'http://localhost:5000/api/v1';

async function runStudentDashboardVerification() {
  console.log('====================================================');
  console.log('🚀 RESOLVENOW STUDENT DASHBOARD & API AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Generate valid test student token
  const mockStudentToken = jwt.sign(
    { 
      id: 'demo-student-id-101', 
      email: 'student@resolvenow.demo', 
      role: 'student' 
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Authorization': `Bearer ${mockStudentToken}`,
      'Content-Type': 'application/json'
    }
  });

  // 1. Fetch Student Grievances
  try {
    console.log('[1/6] Testing GET /grievances (Student Scoped Fetch)...');
    const res = await client.get('/grievances?user_id=demo-student-id-101');
    if (res.status === 200 && Array.isArray(res.data)) {
      console.log(`  ✅ SUCCESS: Retrieved ${res.data.length} student grievances.`);
      passed++;
    } else {
      console.log('  ❌ FAILED: Unexpected response format.');
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 2. Submit New Grievance
  let createdTicketId = null;
  let createdDbId = null;
  try {
    console.log('\n[2/6] Testing POST /grievances (Grievance Submission & Ticket ID Generation)...');
    const res = await client.post('/grievances', {
      user_id: 'demo-student-id-101',
      email: 'student@resolvenow.demo',
      title: 'Library Wi-Fi Connectivity Disruption on 3rd Floor',
      description: 'The wireless access point disconnects every 10 minutes near study desks 12-18.',
      category: 'IT Support',
      urgency: 'Medium',
      frustration_index: 7
    });

    if (res.status === 201 && res.data && res.data.ticket_id) {
      createdTicketId = res.data.ticket_id;
      createdDbId = res.data.id;
      console.log(`  ✅ SUCCESS: Grievance created. Ticket ID: ${createdTicketId}, DB ID: ${createdDbId}`);
      passed++;
    } else {
      console.log('  ❌ FAILED: Grievance creation returned invalid data.');
      failed++;
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 3. Fetch Timeline Log
  try {
    console.log('\n[3/6] Testing GET /grievances/:id/timeline (Delivery Milestones Log)...');
    if (createdDbId) {
      const res = await client.get(`/grievances/${createdDbId}/timeline`);
      if (res.status === 200 && Array.isArray(res.data)) {
        console.log(`  ✅ SUCCESS: Retrieved ${res.data.length} timeline milestones.`);
        passed++;
      } else {
        console.log('  ❌ FAILED: Timeline log empty.');
        failed++;
      }
    } else {
      console.log('  ⚠️ SKIPPED: Ticket not created.');
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 4. Cancel / Delete Pending Grievance (Allowed)
  try {
    console.log('\n[4/6] Testing DELETE /grievances/:id (Cancel Pending Grievance - Allowed)...');
    if (createdDbId) {
      const res = await client.delete(`/grievances/${createdDbId}`);
      if (res.status === 200 && res.data.message) {
        console.log(`  ✅ SUCCESS: ${res.data.message}`);
        passed++;
      } else {
        console.log('  ❌ FAILED: Cancellation failed.');
        failed++;
      }
    } else {
      console.log('  ⚠️ SKIPPED: Ticket not created.');
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 5. Test Cancel Restriction on Active / In Progress Ticket (Rejection Rules)
  try {
    console.log('\n[5/6] Testing DELETE /grievances/:id Restriction (Active Ticket Rejection Rule)...');
    
    // Create new ticket
    const newRes = await client.post('/grievances', {
      user_id: 'demo-student-id-101',
      email: 'student@resolvenow.demo',
      title: 'Hostel Hot Water Plumbing Repair Request',
      description: 'Solar water heater pipeline leaking on 4th floor.',
      category: 'Maintenance',
      urgency: 'High'
    });
    
    const activeTicketDbId = newRes.data.id;
    
    // Generate admin token to transition ticket status to In Progress
    const adminToken = jwt.sign({ id: 'admin-id-999', role: 'admin', mfa_verified: true }, JWT_SECRET, { expiresIn: '1h' });
    const adminClient = axios.create({
      baseURL: BASE_URL,
      headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
    });
    
    // Update status to In Progress using admin authorization
    await adminClient.put(`/grievances/${activeTicketDbId}/status`, { status: 'In Progress' });

    // Attempt delete on In Progress ticket (should be rejected with 400 status)
    try {
      await client.delete(`/grievances/${activeTicketDbId}`);
      console.log('  ❌ FAILED: Delete was allowed on an In-Progress ticket when it should have been rejected!');
      failed++;
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`  ✅ SUCCESS: Correctly rejected active ticket deletion with 400 error: "${err.response.data.error || err.response.data.message}"`);
        passed++;
      } else {
        console.log(`  ❌ FAILED: Unexpected error status: ${err.message}`);
        failed++;
      }
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  // 6. Submit Resolution Feedback Rating
  try {
    console.log('\n[6/6] Testing POST /grievances/:id/feedback (5-Star Rating & Ticket Closure)...');
    const resList = await client.get('/grievances?user_id=demo-student-id-101');
    const resolvedTicket = resList.data.find(g => g.status === 'Resolved' || g.status === 'In Progress' || g.status === 'Assigned');
    
    if (resolvedTicket) {
      const fbRes = await client.post(`/grievances/${resolvedTicket.id}/feedback`, {
        rating: 5,
        feedback_comments: 'Excellent quick resolution by IT support team!'
      });
      if (fbRes.status === 200) {
        console.log('  ✅ SUCCESS: 5-Star feedback submitted and ticket closed.');
        passed++;
      } else {
        console.log('  ❌ FAILED: Feedback submission failed.');
        failed++;
      }
    } else {
      console.log('  ⚠️ SKIPPED: No ticket found for feedback test.');
    }
  } catch (err) {
    console.log(`  ❌ FAILED: ${err.message}`);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} Passed | ${failed} Failed`);
  console.log('====================================================\n');
}

runStudentDashboardVerification().catch(console.error);
