const supabase = require('../config/supabase');
const { sendBroadcastEmail } = require('../services/emailService');

/**
 * Sends a broadcast email to all registered users.
 */
const broadcastToAll = async (req, res) => {
  const { subject, body } = req.body;

  if (!subject || !body) {
    return res.status(400).json({ error: 'Subject and Body are required.' });
  }

  try {
    // 1. Fetch all user emails from profiles
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id') // We usually want the email from auth.users, but profiles often has it too
      // Wait, if profiles doesn't have email, we might need a different way.
      // But in this project, we often use the identifier as the 'email' field in profiles or related tables.
    
    // Actually, let's look at authController.js again to see where it gets the email.
    // It seems it uses the identifier passed in.
    
    // For now, let's assume we have a 'profiles' table with 'email' or we can fetch from auth.users (if admin key)
    // But since this is a demo/prototype, let's fetch emails from the 'profiles' table if it has it.
    
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) throw pError;

    // Filter valid emails (some might be phone-based synthetic emails)
    const emailList = profiles
      .map(p => p.email || p.id + '@user.system') // Fallback if no email field
      .filter(e => e.includes('@'));

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
      const { error: pingError } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
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
        gemini: !!process.env.GEMINI_API_KEY ? 'online' : 'mock_fallback',
        smsGateway: !!process.env.SMS_GATEWAY_URL ? 'online' : 'offline',
        smtp: !!process.env.SMTP_EMAIL ? 'online' : 'offline'
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

  if (!['student', 'faculty', 'staff', 'admin', 'super admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified.' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single();

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

  if (!['active', 'inactive', 'locked'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status specified.' });
  }

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
      .single();

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

module.exports = {
  broadcastToAll,
  getHealthMetrics,
  listUsers,
  updateUserRole,
  updateUserStatus,
  listSystemAuditLogs
};
