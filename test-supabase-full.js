require('dotenv').config();
const { randomUUID } = require('crypto');
const supabase = require('./server/config/supabase');

async function getValidUserId() {
  const { data: g } = await supabase.from('grievances').select('user_id').not('user_id', 'is', null).limit(1);
  if (g && g.length > 0 && g[0].user_id) return g[0].user_id;
  const { data: p } = await supabase.from('user_profiles').select('id').limit(1);
  if (p && p.length > 0 && p[0].id) return p[0].id;
  return 'd50b3f5e-6e78-4896-8ddf-2678ffc4f4bd';
}

async function runSupabaseAudit() {
  console.log('====================================================');
  console.log('⚡ RESOLVENOW SUPABASE DEEP FEATURE & CONNECTIVITY AUDIT');
  console.log('====================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  // 1. Connection & Key Privilege Check
  console.log('[1/8] Checking Supabase Client Initialization & Credentials...');
  if (!supabase) {
    console.error('  ❌ FAILED: Supabase client failed to initialize. Check SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY.');
    failedCount++;
    process.exit(1);
  } else {
    console.log('  ✅ SUCCESS: Supabase client initialized.');
    console.log(`  ℹ️  URL: ${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL}`);
    passedCount++;
  }

  const validUserId = await getValidUserId();
  console.log(`  ℹ️  Using verified Supabase foreign-key user_id: ${validUserId}`);

  // 2. Query System Settings
  console.log('\n[2/8] Testing Read Access on `system_settings` table...');
  try {
    const { data, error } = await supabase.from('system_settings').select('*');
    if (error) throw error;
    console.log(`  ✅ SUCCESS: System settings table accessible (${data.length} keys loaded).`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAILED: System settings query failed: ${err.message}`);
    failedCount++;
  }

  // 3. Database Write & Read on `grievances` Table
  console.log('\n[3/8] Testing CRUD Operations on `grievances` table...');
  const testId = randomUUID();
  const testTicketId = `TKT-TEST-${Date.now().toString(36).toUpperCase()}`;
  try {
    // Insert
    const { data: inserted, error: insertErr } = await supabase
      .from('grievances')
      .insert([{
        id: testId,
        ticket_id: testTicketId,
        user_id: validUserId,
        title: 'Automated Supabase Verification Ticket',
        description: 'Testing end-to-end Supabase PostgreSQL database insertion and retrieval.',
        category: 'IT Support',
        department: 'IT Support',
        urgency: 'Medium',
        status: 'Submitted',
        created_at: new Date().toISOString()
      }])
      .select();

    if (insertErr) throw insertErr;
    console.log(`  ✅ INSERT SUCCESS: Created test ticket #${testTicketId} (UUID: ${testId}).`);

    // Fetch
    const { data: fetched, error: fetchErr } = await supabase
      .from('grievances')
      .select('*')
      .eq('id', testId)
      .single();

    if (fetchErr || !fetched) throw fetchErr || new Error('Ticket not returned');
    console.log(`  ✅ READ SUCCESS: Fetched ticket title "${fetched.title}".`);

    // Update
    const { error: updateErr } = await supabase
      .from('grievances')
      .update({ status: 'Resolved', resolution_notes: 'Automated test completed cleanly.' })
      .eq('id', testId);

    if (updateErr) throw updateErr;
    console.log('  ✅ UPDATE SUCCESS: Ticket status updated to Resolved.');

    // Delete Cleanup
    const { error: deleteErr } = await supabase
      .from('grievances')
      .delete()
      .eq('id', testId);

    if (deleteErr) throw deleteErr;
    console.log('  ✅ DELETE CLEANUP SUCCESS: Test ticket removed cleanly.');
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAILED: Grievances CRUD operation failed: ${err.message}`);
    failedCount++;
  }

  // 4. Audit Logs Table Integration
  console.log('\n[4/8] Testing Audit Log Write & Query on `audit_logs` table...');
  const auditTestId = randomUUID();
  try {
    const { error: auditInsertErr } = await supabase
      .from('audit_logs')
      .insert([{
        id: auditTestId,
        action: 'SUPABASE_SYSTEM_AUDIT_CHECK',
        user_id: validUserId,
        details: { mode: 'deep_check', status: 'passed' },
        created_at: new Date().toISOString()
      }]);

    if (auditInsertErr) throw auditInsertErr;

    const { data: auditLogs, error: auditQueryErr } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('id', auditTestId);

    if (auditQueryErr || !auditLogs.length) throw auditQueryErr || new Error('Audit log record not found');
    console.log('  ✅ SUCCESS: Security audit log successfully written and queried.');

    // Clean up
    await supabase.from('audit_logs').delete().eq('id', auditTestId);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAILED: Audit log operation failed: ${err.message}`);
    failedCount++;
  }

  // 5. In-App Notifications Table Integration
  console.log('\n[5/8] Testing In-App Notifications on `in_app_notifications` table...');
  const notifTestId = randomUUID();
  try {
    const { error: notifErr } = await supabase
      .from('in_app_notifications')
      .insert([{
        id: notifTestId,
        user_id: validUserId,
        type: 'SYSTEM_ALERT',
        title: 'Supabase Health Check',
        message: 'All database channels operational.',
        is_read: false,
        created_at: new Date().toISOString()
      }]);

    if (notifErr) throw notifErr;
    console.log('  ✅ SUCCESS: In-app notification created successfully.');

    await supabase.from('in_app_notifications').delete().eq('id', notifTestId);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAILED: In-app notification check failed: ${err.message}`);
    failedCount++;
  }

  // 6. Email Logs Table Integration
  console.log('\n[6/8] Testing Email Dispatch Logs on `email_logs` table...');
  try {
    const { data: emailLogs, error: emailErr } = await supabase
      .from('email_logs')
      .select('*')
      .limit(5);

    if (emailErr) throw emailErr;
    console.log(`  ✅ SUCCESS: Email logs table accessible (${emailLogs.length} recent dispatches found).`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAILED: Email logs check failed: ${err.message}`);
    failedCount++;
  }

  // 7. Departments & User Profiles Tables
  console.log('\n[7/8] Testing Institutional Tables (`departments`, `user_profiles`)...');
  try {
    const { data: depts, error: deptErr } = await supabase.from('departments').select('*');
    if (deptErr) throw deptErr;

    const { data: profiles, error: profErr } = await supabase.from('user_profiles').select('*');
    if (profErr) throw profErr;

    console.log(`  ✅ SUCCESS: Retrieved ${depts.length} departments & ${profiles.length} user profiles.`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAILED: Institutional tables check failed: ${err.message}`);
    failedCount++;
  }

  // 8. Realtime Channel Subscription Check
  console.log('\n[8/8] Testing Supabase Realtime Channel Subscription...');
  try {
    const channel = supabase.channel('audit-test-channel');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        channel.unsubscribe();
        reject(new Error('Realtime subscription timed out after 5 seconds'));
      }, 5000);

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          console.log('  ✅ SUCCESS: Supabase Realtime WebSocket channel SUBSCRIBED cleanly.');
          channel.unsubscribe();
          resolve();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          reject(new Error(`Realtime status: ${status}`));
        }
      });
    });
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAILED: Realtime channel check failed: ${err.message}`);
    failedCount++;
  }

  console.log('\n====================================================');
  console.log(`⚡ SUPABASE AUDIT COMPLETE: ${passedCount} Passed | ${failedCount} Failed`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runSupabaseAudit();
