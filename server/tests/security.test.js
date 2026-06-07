/* global describe, it, expect, jest, beforeEach */
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Setup mock process environment
process.env.JWT_SECRET = 'test-active-secret-key-98765';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id-123.apps.googleusercontent.com';
process.env.ALLOWED_ORIGINS = 'https://app.resolvenow.com,https://admin.resolvenow.com';
process.env.NODE_ENV = 'test';

// Mocks
const mockUsersQuery = {
  select: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn(),
  update: jest.fn().mockReturnThis()
};

const mockOtpQuery = {
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue({ error: null }),
  select: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn()
};

const mockProfilesQuery = {
  insert: jest.fn().mockResolvedValue({ error: null }),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { full_name: 'Admin Profile' }, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: { full_name: 'Admin Profile' }, error: null })
};

const mockResetsQuery = {
  insert: jest.fn().mockResolvedValue({ error: null }),
  delete: jest.fn().mockResolvedValue({ error: null }),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn()
};

const mockSessionsQuery = {
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn(),
  maybeSingle: jest.fn(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  neq: jest.fn().mockReturnThis(),
  then: jest.fn(resolve => resolve({ data: null, error: null }))
};

const mockDevicesQuery = {
  upsert: jest.fn().mockResolvedValue({ error: null }),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null })
};

const mockAuditLogsQuery = {
  insert: jest.fn().mockResolvedValue({ error: null })
};

const mockSecurityEventsQuery = {
  insert: jest.fn().mockResolvedValue({ error: null })
};

jest.mock('../config/supabase', () => {
  return {
    from: jest.fn((table) => {
      if (table === 'users') return mockUsersQuery;
      if (table === 'otp_verifications' || table === 'otp_codes') return mockOtpQuery;
      if (table === 'user_profiles') return mockProfilesQuery;
      if (table === 'password_resets') return mockResetsQuery;
      if (table === 'sessions') return mockSessionsQuery;
      if (table === 'user_devices') return mockDevicesQuery;
      if (table === 'audit_logs') return mockAuditLogsQuery;
      if (table === 'security_events') return mockSecurityEventsQuery;
      return mockUsersQuery;
    }),
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null })
    }
  };
});

// Mock Email and SMS
jest.mock('../services/emailService', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue({ messageId: 'mock' }),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendSecurityAlertEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/smsService', () => ({
  sendOTPSMS: jest.fn().mockResolvedValue({ success: true })
}));

const authRoutes = require('../routes/authRoutes');
const adminRoutes = require('../routes/adminRoutes');
const cors = require('cors');
const corsOptions = require('../config/corsConfig');

const app = express();
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message, stack: err.stack });
});

describe('ResolveNow Security Hardening Verification Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Forgery Prevention', () => {
    it('should reject a forged JWT signed with the hardcoded fallback secret', async () => {
      const forgedToken = jwt.sign(
        { id: 'user_1', email: 'test@nic.in', role: 'student' },
        'resolvenow-enterprise-secret-2026', // hardcoded fallback secret
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/v1/admin/health-metrics')
        .set('Authorization', `Bearer ${forgedToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toContain('Access denied');
    });

    it('should reject an expired token signed with the correct secret', async () => {
      const expiredToken = jwt.sign(
        { id: 'user_1', email: 'test@nic.in', role: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/v1/admin/health-metrics')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toContain('Access denied');
    });
  });

  describe('CORS Restrictions', () => {
    it('should reject requests from an untrusted origin', async () => {
      const res = await request(app)
        .get('/api/v1/auth/login')
        .set('Origin', 'https://malicioussite.com');

      // Supertest/Express-cors returns standard HTTP response but doesn't set CORS headers
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should allow requests from a whitelisted origin with credentials', async () => {
      const res = await request(app)
        .get('/api/v1/auth/login')
        .set('Origin', 'https://app.resolvenow.com');

      expect(res.headers['access-control-allow-origin']).toEqual('https://app.resolvenow.com');
      expect(res.headers['access-control-allow-credentials']).toEqual('true');
    });
  });

  describe('Google OAuth Token Hardening', () => {
    it('should reject Google login token if the audience claim is incorrect', async () => {
      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          email: 'google@gmail.com',
          name: 'Google User',
          email_verified: true,
          aud: 'wrong-client-id.apps.googleusercontent.com',
          iss: 'https://accounts.google.com',
          exp: Math.floor(Date.now() / 1000) + 300
        })
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ credential: 'valid-token-but-wrong-aud' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toContain('audience verification failed');
    });

    it('should reject Google login token if the issuer is invalid', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          email: 'google@gmail.com',
          name: 'Google User',
          email_verified: true,
          aud: process.env.GOOGLE_CLIENT_ID,
          iss: 'https://malicious-issuer.com',
          exp: Math.floor(Date.now() / 1000) + 300
        })
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ credential: 'valid-token-but-wrong-iss' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toContain('issuer verification failed');
    });

    it('should reject Google login token if the token is expired', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          email: 'google@gmail.com',
          name: 'Google User',
          email_verified: true,
          aud: process.env.GOOGLE_CLIENT_ID,
          iss: 'https://accounts.google.com',
          exp: Math.floor(Date.now() / 1000) - 300 // expired 5 minutes ago
        })
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ credential: 'expired-token' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toContain('token has expired');
    });

    it('should reject requests using the old Google Sandbox Bypass token', async () => {
      // Mock fetch rejection (since sandbox-token- is not a valid Google ID token)
      global.fetch = jest.fn().mockResolvedValue({
        ok: false
      });

      const res = await request(app)
        .post('/api/v1/auth/google')
        .send({ credential: 'sandbox-token-12345' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toContain('Invalid Google Identity token');
    });
  });

  describe('Session Hardening & Refresh Token Reuse (RTR)', () => {
    it('should reject refreshing a session if the user account is locked/inactive', async () => {
      // Mock session retrieval where users users.status = 'locked'
      mockSessionsQuery.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'session_123',
          refresh_token: 'valid_refresh_token',
          expires_at: new Date(Date.now() + 600000).toISOString(),
          users: {
            id: 'user_123',
            email: 'locked@resolve.now',
            role: 'student',
            status: 'locked'
          }
        },
        error: null
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh-token')
        .set('Cookie', ['refresh_token=valid_refresh_token']);

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toContain('User account is locked or disabled');
    });

    it('should trigger session-family revocation upon refresh token reuse', async () => {
      const sessionService = require('../services/sessionService');

      // 1. Mock session lookup for current refresh token: not found
      mockSessionsQuery.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // 2. Mock session lookup for previous refresh token: found (indicates reuse)
      mockSessionsQuery.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'session_999',
          user_id: 'compromised_user_id',
          refresh_token: 'new_token',
          previous_refresh_token: 'reused_token_abc'
        },
        error: null
      });

      // Execute rotation in sessionService
      await expect(
        sessionService.rotateSession('reused_token_abc', '127.0.0.1', 'Mozilla')
      ).rejects.toThrow('Session compromise detected');

      // Verify that deleteByUserId was triggered for compromised_user_id (session-family revocation)
      expect(mockSessionsQuery.delete).toHaveBeenCalled();
    });
  });

  describe('Password Reset Security', () => {
    it('should reject password reset replay using an invalid reset token', async () => {
      mockUsersQuery.maybeSingle.mockResolvedValueOnce({
        data: { id: 'user_123', email: 'user@resolve.now' },
        error: null
      });

      mockResetsQuery.maybeSingle.mockResolvedValueOnce({
        data: null, // no reset record found matching token
        error: null
      });

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          email: 'user@resolve.now',
          password: 'NewPassword@123',
          resetCode: 'invalid-token-code-xyz'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('Unauthorized reset request');
    });
  });

  describe('Admin MFA Enforcement', () => {
    it('should require MFA OTP for administrative users and block access without mfa_verified', async () => {
      // Generate admin token WITHOUT mfa_verified
      const adminTokenNoMfa = jwt.sign(
        { id: 'admin_123', email: 'admin@resolve.now', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const res = await request(app)
        .get('/api/v1/admin/health-metrics')
        .set('Authorization', `Bearer ${adminTokenNoMfa}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toContain('Multi-Factor Authentication (MFA) required. Access denied.');
    });

    it('should permit access for admin users with mfa_verified', async () => {
      const adminTokenWithMfa = jwt.sign(
        { id: 'admin_123', email: 'admin@resolve.now', role: 'admin', mfa_verified: true },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      // Mock session lookup in authMiddleware
      mockSessionsQuery.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'session_123',
          expires_at: new Date(Date.now() + 600000).toISOString()
        },
        error: null
      });

      // Mock system_settings lookup or endpoint controller logic
      const res = await request(app)
        .get('/api/v1/admin/health-metrics')
        .set('Authorization', `Bearer ${adminTokenWithMfa}`);

      // Passes auth and permission checks, might hit permissions block or execute successfully
      expect(res.statusCode).not.toEqual(401);
      expect(res.statusCode).not.toEqual(403);
    });
  });

  describe('Role Escalation Controls', () => {
    it('should strictly default registration role to student regardless of input', async () => {
      mockUsersQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
      mockUsersQuery.maybeSingle.mockResolvedValueOnce({
        data: { id: 'new_user', email: 'register@resolve.now', role: 'student' },
        error: null
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Attacker Admin',
          email: 'register@resolve.now',
          password: 'Password@123',
          role: 'admin' // requested admin
        });

      expect(res.statusCode).toEqual(201);
      const insertCalls = mockUsersQuery.insert.mock.calls;
      const payload = insertCalls[insertCalls.length - 1][0][0];
      expect(payload.role).toEqual('student');
    });
  });
});
