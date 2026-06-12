const bcrypt = require('bcryptjs');
const supabase = require('../config/supabase');
const { sendBroadcastEmail } = require('../services/emailService');
const { logAudit, logSecurityEvent, logAdminActivity } = require('../services/sessionService');

/**
 * Sends a broadcast email to all registered users.
 */
const broadcastToAll = async (req, res) => {
  const { subject, body } = req.body;

  if (!subject || !body) {
    return res.status(400).json({ error: 'Subject and Body are required.' });
  }

  try {
    // Fetch all user emails from users table
    const { data: dbUsers, error: uError } = await supabase
      .from('users')
      .select('email')
      .not('email', 'is', null);
    
    if (uError) throw uError;

    const emailList = dbUsers
      .map(u => u.email)
      .filter(e => e && e.includes('@'));

    if (emailList.length === 0) {
      return res.status(404).json({ error: 'No recipients found.' });
    }

    // 2. Dispatch bulk email
    await sendBroadcastEmail(emailList, subject, body);

    res.json({ 
      message: `Broadcast dispatched successfully to ${emailList.length} users.`,
      recipientsCount: emailList.length
    });
  } catch (err) {
    console.error('Broadcast Error:', err);
    res.status(500).json({ error: 'Failed to dispatch broadcast: ' + err.message });
  }
};

const os = require('os');

/**
 * Retrieves detailed system health, memory load, and database connection statistics.
 */
const getHealthMetrics = async (req, res, next) => {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercentage = ((usedMem / totalMem) * 100).toFixed(2);
    
    const cpuLoad = os.loadavg();
    const cpuCount = os.cpus().length;
    
    let dbStatus = 'online';
    let dbLatency = 0;
    let dbError = null;
    let activeSessionsCount = 0;
    let totalGrievancesCount = 0;
    
    try {
      const dbStart = Date.now();
      const { error: pingError } = await supabase.from('users').select('id', { count: 'exact', head: true }).limit(1);
      dbLatency = Date.now() - dbStart;
      
      if (pingError) {
        dbStatus = 'degraded';
        dbError = pingError.message;
      }
      
      const { count: sessionsCount, error: sError } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gt('expires_at', new Date().toISOString());
      
      if (!sError) {
        activeSessionsCount = sessionsCount || 0;
      }
      
      const { count: grievancesCount, error: gError } = await supabase
        .from('grievances')
        .select('*', { count: 'exact', head: true });
      
      if (!gError) {
        totalGrievancesCount = grievancesCount || 0;
      }
    } catch (err) {
      dbStatus = 'offline';
      dbError = err.message;
    }
    
    res.json({
      status: 'ok',
      service: 'ResolveNow Core Kernel',
      timestamp: new Date().toISOString(),
      system: {
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        nodeUptime: process.uptime(),
        cpu: {
          cores: cpuCount,
          loadAverage: cpuLoad,
          usagePercentage: (cpuLoad[0] * 100 / cpuCount).toFixed(2)
        },
        memory: {
          total: totalMem,
          free: freeMem,
          used: usedMem,
          usagePercentage: memPercentage,
          processHeap: process.memoryUsage().heapUsed
        }
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
        activeSessions: activeSessionsCount,
        totalGrievances: totalGrievancesCount,
        error: dbError
      },
      integrations: {
        gemini: process.env.GEMINI_API_KEY ? 'online' : 'mock_fallback',
        smsGateway: process.env.SMS_GATEWAY_URL ? 'online' : 'offline',
        smtp: process.env.SMTP_EMAIL ? 'online' : 'offline'
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Lists all registered users (restricted to admin)
 * GET /api/v1/admin/users
 */
const listUsers = async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, mobile_number, role, status, failed_login_attempts, lockout_until, created_at');

    if (error) throw error;

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, full_name, profile_picture');

    const profileMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p;
      return acc;
    }, {});

    const formattedUsers = users.map(u => ({
      ...u,
      fullName: profileMap[u.id]?.full_name || 'N/A',
      profilePicture: profileMap[u.id]?.profile_picture || null
    }));

    res.json(formattedUsers);
  } catch (err) {
    next(err);
  }
};

/**
 * Updates a user's role mapping (restricted to admin/super admin)
 * PUT /api/v1/admin/users/:id/role
 */
const updateUserRole = async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .maybeSingle();
    console.log("Supabase response (updateUserRole):", data);
    console.log("Supabase error (updateUserRole):", error);

    if (error) throw error;

    const { logAudit } = require('../services/sessionService');
    await logAudit(req.user.id, 'USER_ROLE_UPDATED', req.ip, req.headers['user-agent'], { target_user_id: id, role });

    res.json({ message: 'User role updated successfully.', user: data });
  } catch (err) {
    next(err);
  }
};

/**
 * Locks or unlocks a user account (restricted to admin)
 * PUT /api/v1/admin/users/:id/status
 */
const updateUserStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updates = { status };
    if (status === 'locked') {
      updates.lockout_until = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 100 years
    } else {
      updates.lockout_until = null;
      updates.failed_login_attempts = 0;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    console.log("Supabase response (updateUserStatus):", data);
    console.log("Supabase error (updateUserStatus):", error);

    if (error) throw error;

    const { logAudit } = require('../services/sessionService');
    await logAudit(req.user.id, status === 'locked' ? 'USER_ACCOUNT_LOCKED' : 'USER_ACCOUNT_UNLOCKED', req.ip, req.headers['user-agent'], { target_user_id: id });

    res.json({ message: `User status updated to ${status}.`, user: data });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieves global security logs (restricted to admin)
 * GET /api/v1/admin/audit
 */
const listSystemAuditLogs = async (req, res, next) => {
  try {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, ip_address, user_agent, details, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, full_name');

    const profileMap = (profiles || []).reduce((acc, p) => {
      acc[p.user_id] = p.full_name;
      return acc;
    }, {});

    const formattedLogs = logs.map(l => ({
      ...l,
      operatorName: profileMap[l.user_id] || 'System Operator'
    }));

    res.json(formattedLogs);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new user (restricted to admin)
 * POST /api/v1/admin/users
 */
const createUser = async (req, res, next) => {
  const { fullName, email, mobileNumber, password, role, status } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Convert empty/blank mobile numbers to null
    const finalMobileNumber = (mobileNumber && mobileNumber.trim() !== '') ? mobileNumber.trim() : null;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email,
          mobile_number: finalMobileNumber,
          password_hash: passwordHash,
          role,
          status: status || 'active',
          email_verified: true,
          phone_verified: !!finalMobileNumber
        }
      ])
      .select()
      .maybeSingle();
    console.log("Supabase response (createUser):", newUser);
    console.log("Supabase error (createUser):", userError);

    if (userError) throw userError;

    // Create profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: newUser.id,
          full_name: fullName,
          notification_preferences: { email: true, sms: true }
        }
      ]);

    if (profileError) throw profileError;

    // Assign Role in user_roles table
    const { data: dbRole } = await supabase.from('roles').select('id').eq('name', role).maybeSingle();
    if (dbRole) {
      await supabase.from('user_roles').insert([{ user_id: newUser.id, role_id: dbRole.id }]);
    }

    await logAdminActivity(
      req.user.id,
      'CREATE_USER',
      newUser.id,
      req.ip,
      req.headers['user-agent'],
      { email, role, status }
    );

    res.status(201).json({
      message: 'User created successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        mobileNumber: newUser.mobile_number,
        role: newUser.role,
        status: newUser.status,
        fullName
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update user details (restricted to admin)
 * PUT /api/v1/admin/users/:id
 */
const updateUser = async (req, res, next) => {
  const { id } = req.params;
  const { fullName, email, mobileNumber, role, status } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Fetch user before state
    const { data: userBefore, error: userBeforeErr } = await supabase.from('users').select('*').eq('id', id).limit(1).maybeSingle();
    console.log("Supabase response (userBefore):", userBefore);
    console.log("Supabase error (userBefore):", userBeforeErr);
    const { data: profileBefore, error: profileBeforeErr } = await supabase.from('user_profiles').select('*').eq('user_id', id).limit(1).maybeSingle();
    console.log("Supabase response (profileBefore):", profileBefore);
    console.log("Supabase error (profileBefore):", profileBeforeErr);

    if (!userBefore) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Update users table
    const userUpdates = {};
    if (email !== undefined) userUpdates.email = email;
    if (mobileNumber !== undefined) {
      userUpdates.mobile_number = (mobileNumber && mobileNumber.trim() !== '') ? mobileNumber.trim() : null;
    }
    if (role !== undefined) userUpdates.role = role;
    if (status !== undefined) {
      userUpdates.status = status;
      if (status !== 'locked') {
        userUpdates.lockout_until = null;
        userUpdates.failed_login_attempts = 0;
      } else {
        userUpdates.lockout_until = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    const { error: userError } = await supabase.from('users').update(userUpdates).eq('id', id);
    if (userError) throw userError;

    // Update user_profiles table
    if (fullName !== undefined) {
      await supabase.from('user_profiles').update({ full_name: fullName }).eq('user_id', id);
    }

    // Sync role in user_roles table if role changed
    if (role && role !== userBefore.role) {
      const { data: dbRole } = await supabase.from('roles').select('id').eq('name', role).maybeSingle();
      if (dbRole) {
        await supabase.from('user_roles').delete().eq('user_id', id);
        await supabase.from('user_roles').insert([{ user_id: id, role_id: dbRole.id }]);
      }
    }

    // Log admin activity
    const beforeState = { role: userBefore.role, status: userBefore.status, email: userBefore.email, fullName: profileBefore?.full_name };
    const afterState = { role: role || userBefore.role, status: status || userBefore.status, email: email || userBefore.email, fullName: fullName || profileBefore?.full_name };

    await logAdminActivity(
      req.user.id,
      'UPDATE_USER',
      id,
      req.ip,
      req.headers['user-agent'],
      { before: beforeState, after: afterState }
    );

    res.json({ message: 'User details updated successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a user account (restricted to admin)
 * DELETE /api/v1/admin/users/:id
 */
const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Fetch user before deleting
    const { data: user, error: userErr } = await supabase.from('users').select('email').eq('id', id).limit(1).maybeSingle();
    console.log("Supabase response (deleteUserFetch):", user);
    console.log("Supabase error (deleteUserFetch):", userErr);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;

    await logAdminActivity(
      req.user.id,
      'DELETE_USER',
      id,
      req.ip,
      req.headers['user-agent'],
      { email: user.email }
    );

    res.json({ message: 'User account and all associated profile records terminated successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch logs for a specific user
 * GET /api/v1/admin/users/:id/activity
 */
const getUserActivity = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*')
      .or(`user_id.eq.${id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json(logs || []);
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve Compliance Metrics
 * GET /api/v1/admin/compliance/stats
 */
const getComplianceStats = async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // 1. Failed Logins Count & Lockout Count
    const { count: lockedCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'locked');

    // 2. Audit Completeness (Total count of audit logs)
    const { count: auditLogsCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });

    // 3. Security events count by severity
    const { data: secEvents } = await supabase
      .from('security_events')
      .select('severity, event_type');

    const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    const eventTypeCounts = {};

    (secEvents || []).forEach(ev => {
      const sev = ev.severity?.toLowerCase();
      if (severityCounts[sev] !== undefined) {
        severityCounts[sev]++;
      }
      eventTypeCounts[ev.event_type] = (eventTypeCounts[ev.event_type] || 0) + 1;
    });

    // 4. Data retention rules (mock details for visual clarity, e.g. 90-day retention status)
    const retentionDetails = {
      policy: '90-Day Standard Log Retention',
      status: 'Compliant',
      oldestLogDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      nextPurgeScheduled: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({
      lockedAccounts: lockedCount || 0,
      totalAuditLogs: auditLogsCount || 0,
      severityCounts,
      eventTypeCounts,
      retention: retentionDetails
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Generate Compliance PDF/CSV data
 * GET /api/v1/admin/compliance/reports
 */
const getComplianceReports = async (req, res, next) => {
  const { format, type } = req.query; // format: 'csv' or 'json', type: 'compliance' | 'security' | 'audit'

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    let reportData = [];
    let headers = [];

    if (type === 'security') {
      const { data } = await supabase.from('security_events').select('*').order('created_at', { ascending: false }).limit(200);
      reportData = data || [];
      headers = ['ID', 'User ID', 'Event Type', 'Severity', 'IP Address', 'Created At'];
    } else if (type === 'audit') {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
      reportData = data || [];
      headers = ['ID', 'User ID', 'Action', 'IP Address', 'Created At'];
    } else { // compliance report combining general system configurations
      const { data: users } = await supabase.from('users').select('id, email, role, status, failed_login_attempts, lockout_until, created_at');
      reportData = users || [];
      headers = ['User ID', 'Email', 'Role', 'Status', 'Failed Attempts', 'Lockout Until', 'Created At'];
    }

    if (format === 'csv') {
      let csvContent = headers.join(',') + '\n';
      reportData.forEach(row => {
        const values = headers.map(header => {
          let val = '';
          if (type === 'security') {
            if (header === 'ID') val = row.id;
            else if (header === 'User ID') val = row.user_id;
            else if (header === 'Event Type') val = row.event_type;
            else if (header === 'Severity') val = row.severity;
            else if (header === 'IP Address') val = row.ip_address;
            else if (header === 'Created At') val = row.created_at;
          } else if (type === 'audit') {
            if (header === 'ID') val = row.id;
            else if (header === 'User ID') val = row.user_id;
            else if (header === 'Action') val = row.action;
            else if (header === 'IP Address') val = row.ip_address;
            else if (header === 'Created At') val = row.created_at;
          } else {
            if (header === 'User ID') val = row.id;
            else if (header === 'Email') val = row.email;
            else if (header === 'Role') val = row.role;
            else if (header === 'Status') val = row.status;
            else if (header === 'Failed Attempts') val = row.failed_login_attempts;
            else if (header === 'Lockout Until') val = row.lockout_until || '';
            else if (header === 'Created At') val = row.created_at;
          }
          return `"${String(val).replace(/"/g, '""')}"`;
        });
        csvContent += values.join(',') + '\n';
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=resolve_now_${type || 'compliance'}_report.csv`);
      return res.send(csvContent);
    }

    res.json(reportData);
  } catch (err) {
    next(err);
  }
};

/**
 * Fetch all roles with their assigned permissions
 * GET /api/v1/admin/roles
 */
const getRoles = async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Fetch roles and join permissions
    const { data: dbRoles, error: rolesError } = await supabase
      .from('roles')
      .select(`
        id,
        name,
        description,
        role_permissions (
          permissions (id, name, description)
        )
      `);

    if (rolesError) throw rolesError;

    const formattedRoles = (dbRoles || []).map(r => {
      const perms = (r.role_permissions || []).map(rp => rp.permissions).filter(Boolean);
      return {
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: perms
      };
    });

    res.json(formattedRoles);
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new custom role
 * POST /api/v1/admin/roles
 */
const createRole = async (req, res, next) => {
  const { name, description, permissions } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Insert new role
    const { data: newRole, error: roleError } = await supabase
      .from('roles')
      .insert([{ name: name.toLowerCase(), description }])
      .select()
      .maybeSingle();
    console.log("Supabase response (createRole):", newRole);
    console.log("Supabase error (createRole):", roleError);

    if (roleError) throw roleError;

    // Sync permissions
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const inserts = permissions.map(pid => ({ role_id: newRole.id, permission_id: pid }));
      await supabase.from('role_permissions').insert(inserts);
    }

    await logAdminActivity(
      req.user.id,
      'CREATE_ROLE',
      null,
      req.ip,
      req.headers['user-agent'],
      { roleName: name, permissions }
    );

    res.status(201).json({ message: 'Role created successfully.', role: newRole });
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing role's permissions
 * PUT /api/v1/admin/roles/:id
 */
const updateRole = async (req, res, next) => {
  const { id } = req.params;
  const { description, permissions } = req.body;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    // Fetch before state
    const { data: role, error: roleErr } = await supabase.from('roles').select('name').eq('id', id).limit(1).maybeSingle();
    console.log("Supabase response (updateRoleFetch):", role);
    console.log("Supabase error (updateRoleFetch):", roleErr);
    if (!role) {
      return res.status(404).json({ error: 'Role not found.' });
    }

    // Update description
    if (description !== undefined) {
      await supabase.from('roles').update({ description }).eq('id', id);
    }

    // Update permissions list (full sync)
    if (permissions && Array.isArray(permissions)) {
      // Delete existing
      await supabase.from('role_permissions').delete().eq('role_id', id);
      
      // Insert new mappings
      if (permissions.length > 0) {
        const inserts = permissions.map(pid => ({ role_id: id, permission_id: pid }));
        await supabase.from('role_permissions').insert(inserts);
      }
    }

    await logAdminActivity(
      req.user.id,
      'UPDATE_ROLE',
      null,
      req.ip,
      req.headers['user-agent'],
      { roleName: role.name, permissions }
    );

    res.json({ message: 'Role permissions updated successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a role (restricted to admin)
 * DELETE /api/v1/admin/roles/:id
 */
const deleteRole = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data: role, error: roleErr } = await supabase.from('roles').select('name').eq('id', id).limit(1).maybeSingle();
    console.log("Supabase response (deleteRoleFetch):", role);
    console.log("Supabase error (deleteRoleFetch):", roleErr);
    if (!role) {
      return res.status(404).json({ error: 'Role not found.' });
    }

    // Prevent deleting default critical roles
    if (['student', 'faculty', 'staff', 'admin', 'super admin'].includes(role.name)) {
      return res.status(400).json({ error: 'Critical system roles cannot be deleted.' });
    }

    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw error;

    await logAdminActivity(
      req.user.id,
      'DELETE_ROLE',
      null,
      req.ip,
      req.headers['user-agent'],
      { roleName: role.name }
    );

    res.json({ message: 'Role successfully deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all available permissions
 * GET /api/v1/admin/permissions
 */
const getPermissions = async (req, res, next) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Database service unavailable' });
    }

    const { data: perms, error } = await supabase.from('permissions').select('*').order('name');
    if (error) throw error;

    res.json(perms || []);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  broadcastToAll,
  getHealthMetrics,
  listUsers,
  updateUserRole,
  updateUserStatus,
  listSystemAuditLogs,
  createUser,
  updateUser,
  deleteUser,
  getUserActivity,
  getComplianceStats,
  getComplianceReports,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions
};

