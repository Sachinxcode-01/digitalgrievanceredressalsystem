const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/userRepository');
const sessionRepository = require('../repositories/sessionRepository');
const notificationService = require('./notificationService');
const auditService = require('./auditService');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes

const createSession = async (user, ip, userAgent, rememberMe = false) => {
  const { os, browser, device } = auditService.parseUserAgent(userAgent);
  const deviceInfo = `${device} (${os} - ${browser})`;
  const loginLocation = ip === '127.0.0.1' || ip === '::1' ? 'Local Development' : 'New Delhi, India';

  const refreshToken = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date();
  const days = rememberMe ? 30 : 1;
  expiresAt.setDate(expiresAt.getDate() + days);

  const sessionData = await sessionRepository.create({
    user_id: user.id,
    refresh_token: refreshToken,
    ip_address: ip,
    user_agent: userAgent,
    device_info: deviceInfo,
    login_location: loginLocation,
    expires_at: expiresAt.toISOString()
  });

  const deviceFingerprint = crypto.createHash('md5').update(`${os}-${browser}-${device}`).digest('hex');
  
  let isNewDevice = false;
  try {
    const existingDevice = await userRepository.findDevice(user.id, deviceFingerprint);
    if (!existingDevice) {
      isNewDevice = true;
    }
  } catch (err) {
    console.error('[Device Check Failure]:', err.message);
  }

  await userRepository.upsertDevice({
    user_id: user.id,
    device_fingerprint: deviceFingerprint,
    device_name: deviceInfo,
    os,
    browser,
    last_ip: ip,
    last_active_at: new Date().toISOString()
  });

  if (isNewDevice) {
    const timeString = new Date().toLocaleString('en-US', { timeZone: 'UTC' }) + ' UTC';
    await notificationService.sendNewDeviceLoginEmail(user.id, os, browser, timeString, loginLocation).catch(err => {
      console.error('[New Device Login Email Failure]:', err.message);
    });
  }

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

  await auditService.logAudit(user.id, 'LOGIN_SUCCESS', ip, userAgent, { session_id: sessionData.id, device: deviceInfo });

  return { accessToken, refreshToken, expiresAt, sessionId: sessionData.id };
};

const rotateSession = async (oldRefreshToken, ip, userAgent) => {
  const session = await sessionRepository.findByRefreshToken(oldRefreshToken);
  if (!session) {
    throw new Error('Session invalid or expired');
  }

  if (new Date() > new Date(session.expires_at)) {
    await sessionRepository.deleteById(session.id);
    throw new Error('Session expired. Please sign in again.');
  }

  const user = session.users;
  if (!user || user.status === 'locked') {
    throw new Error('User account is locked or disabled');
  }

  const profile = await userRepository.findProfileByUserId(user.id);
  user.full_name = profile ? profile.full_name : 'User';

  const isRememberMe = new Date(session.expires_at).getTime() - new Date(session.created_at).getTime() > 2 * 24 * 60 * 60 * 1000;

  const newRefreshToken = crypto.randomBytes(40).toString('hex');
  const newExpiresAt = new Date();
  newExpiresAt.setDate(newExpiresAt.getDate() + (isRememberMe ? 30 : 1));

  await sessionRepository.update(session.id, {
    refresh_token: newRefreshToken,
    expires_at: newExpiresAt.toISOString(),
    ip_address: ip,
    user_agent: userAgent,
    last_active_at: new Date().toISOString()
  });

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

const revokeSession = async (sessionId, userId) => {
  await sessionRepository.deleteById(sessionId);
};

const revokeAllSessionsExcept = async (activeSessionId, userId) => {
  await sessionRepository.deleteByUserIdExceptActive(userId, activeSessionId);
};

module.exports = {
  createSession,
  rotateSession,
  revokeSession,
  revokeAllSessionsExcept,
  // Delegate logging for backward compatibility
  logAudit: auditService.logAudit,
  logSecurityEvent: auditService.logSecurityEvent,
  logAdminActivity: auditService.logAdminActivity,
  parseUserAgent: auditService.parseUserAgent
};
