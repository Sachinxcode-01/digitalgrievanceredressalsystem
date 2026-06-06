const auditRepository = require('../repositories/auditRepository');
const userRepository = require('../repositories/userRepository');

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
  try {
    const { os, browser, device } = parseUserAgent(userAgent);
    let userRole = 'student';
    if (userId) {
      const user = await userRepository.findById(userId).catch(() => null);
      if (user) userRole = user.role;
    }
    
    await auditRepository.insertAuditLog({
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
    });
  } catch (err) {
    console.error('[Audit Log Failure]:', err.message);
  }
};

/**
 * Log Security Event (e.g. failed login, locks, suspicious activity)
 */
const logSecurityEvent = async (userId, eventType, severity, ip, userAgent, details = {}) => {
  try {
    const { os, browser, device } = parseUserAgent(userAgent);
    await auditRepository.insertSecurityEvent({
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
    });
  } catch (err) {
    console.error('[Security Event Failure]:', err.message);
  }
};

/**
 * Log Admin Action
 */
const logAdminActivity = async (adminId, action, targetUserId, ip, userAgent, details = {}) => {
  try {
    const { os, browser, device } = parseUserAgent(userAgent);
    await auditRepository.insertAdminActivityLog({
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
    });
  } catch (err) {
    console.error('[Admin Activity Log Failure]:', err.message);
  }
};

module.exports = {
  logAudit,
  logSecurityEvent,
  logAdminActivity,
  parseUserAgent
};
