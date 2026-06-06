const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// JWT Settings
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days

/**
 * Simple Regex-based User-Agent Parser for device information.
 */
const parseUserAgent = (userAgentString) => {
  if (!userAgentString) {
    return { os: 'Unknown OS', browser: 'Unknown Browser', device: 'Desktop' };
  }
  
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  let device = 'Desktop';

  const ua = userAgentString.toLowerCase();

  // OS detection
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('android')) { os = 'Android'; device = 'Mobile'; }
  else if (ua.includes('iphone') || ua.includes('ipad')) { os = 'iOS'; device = 'Mobile'; }
  else if (ua.includes('linux')) os = 'Linux';

  // Browser detection
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome') || ua.includes('crios')) browser = 'Chrome';
  else if (ua.includes('firefox') || ua.includes('fxios')) browser = 'Firefox';
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';

  return { os, browser, device };
};

/**
 * Log action into Audit Logs
 */
const logAudit = async (userId, action, ip, userAgent, details = {}) => {
  if (!supabase) return;
  try {
    const { os, browser, device } = parseUserAgent(userAgent);
    let userRole = 'student';
    if (userId) {
      const { data: user } = await supabase.from('users').select('role').eq('id', userId).maybeSingle();
      if (user) userRole = user.role;
    }
    
    await supabase.from('audit_logs').insert([
      {
        user_id: userId,
        action,
        ip_address: ip || '127.0.0.1',
        user_agent: userAgent || 'Unknown',
        details: {
          role: userRole,
          device: `${device} (${os})`,
          browser,
          ...details
        }
      }
    ]);
  } catch (err) {
    console.error('[Audit Log Failure]:', err.message);
  }
};

/**
 * Log Security Event (e.g. failed login, locks, suspicious activity)
 */
const logSecurityEvent = async (userId, eventType, severity, ip, userAgent, details = {}) => {
  if (!supabase) return;
  try {
    const { os, browser, device } = parseUserAgent(userAgent);
    await supabase.from('security_events').insert([
      {
        user_id: userId,
        event_type: eventType,
        severity,
        ip_address: ip || '127.0.0.1',
        user_agent: userAgent || 'Unknown',
        details: {
          device: `${device} (${os})`,
          browser,
          ...details
        }
      }
    ]);
  } catch (err) {
    console.error('[Security Event Failure]:', err.message);
  }
};

/**
 * Log Admin Action
 */
const logAdminActivity = async (adminId, action, targetUserId, ip, userAgent, details = {}) => {
  if (!supabase) return;
  try {
    const { os, browser, device } = parseUserAgent(userAgent);
    await supabase.from('admin_activity_logs').insert([
      {
        admin_id: adminId,
        action,
        target_user_id: targetUserId,
        ip_address: ip || '127.0.0.1',
        user_agent: userAgent || 'Unknown',
        details: {
          device: `${device} (${os})`,
          browser,
          ...details
        }
      }
    ]);
  } catch (err) {
    console.error('[Admin Activity Log Failure]:', err.message);
  }
};

/**
 * Create a new user session
 */
const createSession = async (user, ip, userAgent, rememberMe = false) => {
  if (!supabase) {
    throw new Error('Supabase client not active');
  }

  const { os, browser, device } = parseUserAgent(userAgent);
  const deviceInfo = `${device} (${os} - ${browser})`;
  
  // IP location details (mock location since we run locally/private environments)
  const loginLocation = ip === '127.0.0.1' || ip === '::1' ? 'Local Development' : 'New Delhi, India';

  // Generate long-lived refresh token
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  const days = rememberMe ? 30 : 1; // 30 days if rememberMe is true, else 1 day
  expiresAt.setDate(expiresAt.getDate() + days);

  // Insert Session
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .insert([
      {
        user_id: user.id,
        refresh_token: refreshToken,
        ip_address: ip,
        user_agent: userAgent,
        device_info: deviceInfo,
        login_location: loginLocation,
        expires_at: expiresAt.toISOString()
      }
    ])
    .select()
    .single();

  if (sessionError) {
    throw new Error('Session creation error: ' + sessionError.message);
  }

  // Update user device list
  const deviceFingerprint = crypto.createHash('md5').update(`${os}-${browser}-${device}`).digest('hex');
  
  // Check if device fingerprint is new for this user
  let isNewDevice = false;
  try {
    const { data: existingDevice } = await supabase
      .from('user_devices')
      .select('device_fingerprint')
      .eq('user_id', user.id)
      .eq('device_fingerprint', deviceFingerprint)
      .maybeSingle();
    
    if (!existingDevice) {
      isNewDevice = true;
    }
  } catch (err) {
    console.error('[Device Check Failure]:', err.message);
  }

  await supabase
    .from('user_devices')
    .upsert({
      user_id: user.id,
      device_fingerprint: deviceFingerprint,
      device_name: deviceInfo,
      os,
      browser,
      last_ip: ip,
      last_active_at: new Date().toISOString()
    }, { onConflict: 'user_id,device_fingerprint' });

  if (isNewDevice) {
    const timeString = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
    // Import dynamically to prevent potential circular dependency
    const { sendNewDeviceLoginEmail } = require('./emailService');
    await sendNewDeviceLoginEmail(user.id, os, browser, timeString, loginLocation).catch(err => {
      console.error('[New Device Login Email Failure]:', err.message);
    });
  }

  // Generate short-lived Access Token containing the session_id
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      phone: user.mobile_number || '',
      role: user.role,
      full_name: user.full_name,
      session_id: sessionData.id
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  // Audit log
  await logAudit(user.id, 'LOGIN_SUCCESS', ip, userAgent, { session_id: sessionData.id, device: deviceInfo });

  return { accessToken, refreshToken, expiresAt, sessionId: sessionData.id };
};

/**
 * Rotate Refresh Token & Access Token
 */
const rotateSession = async (oldRefreshToken, ip, userAgent) => {
  if (!supabase) {
    throw new Error('Supabase client not active');
  }

  // Find active session
  const { data: session, error: findError } = await supabase
    .from('sessions')
    .select('*, users(*)')
    .eq('refresh_token', oldRefreshToken)
    .single();

  if (findError || !session) {
    throw new Error('Session invalid or expired');
  }

  if (new Date() > new Date(session.expires_at)) {
    // Session expired, delete it
    await supabase.from('sessions').delete().eq('id', session.id);
    throw new Error('Session expired. Please sign in again.');
  }

  const user = session.users;
  if (!user || user.status === 'locked') {
    throw new Error('User account is locked or disabled');
  }

  // Retrieve user profile for full name
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', user.id)
    .single();

  user.full_name = profile ? profile.full_name : 'User';

  // Detect if original session was rememberMe (expires_at - created_at > 2 days)
  const isRememberMe = new Date(session.expires_at).getTime() - new Date(session.created_at).getTime() > 2 * 24 * 60 * 60 * 1000;

  // Generate new refresh token
  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + (isRememberMe ? 30 : 1));

  // Update session record
  const { error: updateError } = await supabase
    .from('sessions')
    .update({
      refresh_token: newRefreshToken,
      expires_at: newExpiresAt.toISOString(),
      ip_address: ip,
      user_agent: userAgent,
      last_active_at: new Date().toISOString()
    })
    .eq('id', session.id);

  if (updateError) {
    throw new Error('Session refresh rotation failed');
  }

  // Generate new short-lived Access Token
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      phone: user.mobile_number || '',
      role: user.role,
      full_name: user.full_name,
      session_id: session.id
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken: newRefreshToken, expiresAt: newExpiresAt, sessionId: session.id };
};

/**
 * Revoke specific session
 */
const revokeSession = async (sessionId, userId) => {
  if (!supabase) return;
  await supabase.from('sessions').delete().eq('id', sessionId).eq('user_id', userId);
};

/**
 * Revoke all sessions except active one
 */
const revokeAllSessionsExcept = async (activeSessionId, userId) => {
  if (!supabase) return;
  await supabase.from('sessions').delete().eq('user_id', userId).neq('id', activeSessionId);
};

module.exports = {
  createSession,
  rotateSession,
  revokeSession,
  revokeAllSessionsExcept,
  logAudit,
  logSecurityEvent,
  logAdminActivity,
  parseUserAgent
};
