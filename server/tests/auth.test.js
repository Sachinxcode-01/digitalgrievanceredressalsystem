/* global describe, it, expect, jest, beforeEach */
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

// Clean, table-specific mocks to prevent mock pollution
const mockUsersQuery = {
  select: jest.fn().mockReturnThis(),
  or:     jest.fn().mockReturnThis(),
  eq:     jest.fn().mockReturnThis(),
  neq:    jest.fn().mockReturnThis(),
  gt:     jest.fn().mockReturnThis(),
  limit:  jest.fn().mockReturnThis(),
  order:  jest.fn().mockReturnThis(),
  maybeSingle: jest.fn(),
  insert: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { id: 'user_id', failed_login_attempts: 0 }, error: null }),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis()
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
  eq:     jest.fn().mockReturnThis(),
  limit:  jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { full_name: 'Test Profile' }, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: { full_name: 'Test Profile' }, error: null })
};


const mockResetsQuery = {
  insert: jest.fn().mockResolvedValue({ error: null }),
  delete: jest.fn().mockResolvedValue({ error: null })
};

const mockSessionsQuery = {
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { id: 'session_123', expires_at: new Date(Date.now() + 60000).toISOString() }, error: null }),
  maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'session_123', expires_at: new Date(Date.now() + 60000).toISOString() }, error: null })
};

const mockDevicesQuery = {
  upsert: jest.fn().mockResolvedValue({ error: null })
};

const mockAuditLogsQuery = {
  insert: jest.fn().mockResolvedValue({ error: null })
};

// Default RPC mock functions — individual tests can override with .mockResolvedValueOnce()
const mockRpcRegisterUser = jest.fn().mockResolvedValue({
  data: { id: 'new_user_uuid', email: 'new@nic.in', role: 'student', status: 'inactive', mobile_number: null },
  error: null
});

const mockRpcSyncClerkUser = jest.fn().mockResolvedValue({
  data: { id: 'clerk_uuid', email: 'clerk@nic.in', role: 'student', status: 'active', mobile_number: null },
  error: null
});

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
      return mockUsersQuery;
    }),
    rpc: jest.fn((fnName, params) => {
      if (fnName === 'register_user') return mockRpcRegisterUser(params);
      if (fnName === 'sync_clerk_user') return mockRpcSyncClerkUser(params);
      return Promise.resolve({ data: null, error: null });
    }),
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null })
    }
  };
});


// Mock Email and SMS Services
jest.mock('../services/emailService', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue({ messageId: 'mock-email' }),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/smsService', () => ({
  sendOTPSMS: jest.fn().mockResolvedValue({ success: true })
}));

// Setup mock process.env variables
process.env.JWT_SECRET = 'test-secret-key-123456';
process.env.NODE_ENV = 'test';

const supabase = require('../config/supabase');
const authRoutes = require('../routes/authRoutes');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/v1/auth', authRoutes);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message, stack: err.stack });
});

describe('Authentication API Endpoint Tests', () => {
  beforeEach(() => {
    // Clear call history without wiping implementations
    jest.clearAllMocks();

    // Restore chain defaults for mockUsersQuery after clearAllMocks wipes them
    mockUsersQuery.select.mockReturnThis();
    mockUsersQuery.or.mockReturnThis();
    mockUsersQuery.eq.mockReturnThis();
    mockUsersQuery.neq.mockReturnThis();
    mockUsersQuery.gt.mockReturnThis();
    mockUsersQuery.limit.mockReturnThis();
    mockUsersQuery.order.mockReturnThis();
    mockUsersQuery.insert.mockReturnThis();
    mockUsersQuery.update.mockReturnThis();
    mockUsersQuery.delete.mockReturnThis();
    mockUsersQuery.single.mockResolvedValue({ data: { id: 'user_id', failed_login_attempts: 0 }, error: null });

    // Restore chain defaults for mockOtpQuery
    mockOtpQuery.delete.mockReturnThis();
    mockOtpQuery.eq.mockReturnThis();
    mockOtpQuery.insert.mockResolvedValue({ error: null });
    mockOtpQuery.select.mockReturnThis();
    mockOtpQuery.order.mockReturnThis();
    mockOtpQuery.limit.mockReturnThis();

    // Restore chain defaults for mockProfilesQuery
    mockProfilesQuery.insert.mockResolvedValue({ error: null });
    mockProfilesQuery.select.mockReturnThis();
    mockProfilesQuery.eq.mockReturnThis();
    mockProfilesQuery.limit.mockReturnThis();
    mockProfilesQuery.update.mockReturnThis();
    mockProfilesQuery.single.mockResolvedValue({ data: { full_name: 'Test Profile' }, error: null });
    mockProfilesQuery.maybeSingle.mockResolvedValue({ data: { full_name: 'Test Profile' }, error: null });


    // Restore chain defaults for mockSessionsQuery
    mockSessionsQuery.insert.mockReturnThis();
    mockSessionsQuery.select.mockReturnThis();
    mockSessionsQuery.single.mockResolvedValue({ data: { id: 'session_123', expires_at: new Date(Date.now() + 60000).toISOString() }, error: null });
    mockSessionsQuery.maybeSingle.mockResolvedValue({ data: { id: 'session_123', expires_at: new Date(Date.now() + 60000).toISOString() }, error: null });

    // Restore RPC defaults
    mockRpcRegisterUser.mockResolvedValue({
      data: { id: 'new_user_uuid', email: 'new@nic.in', role: 'student', status: 'inactive', mobile_number: null },
      error: null
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('should fail registration if email already exists', async () => {
      // Mock rpc register_user to return EMAIL_ALREADY_EXISTS error
      mockRpcRegisterUser.mockResolvedValueOnce({
        data: null,
        error: { message: 'EMAIL_ALREADY_EXISTS', code: 'P0001' }
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test User',
          email: 'admin@resolvenow.demo', // existing email
          mobileNumber: '+919999999999',
          password: 'Password@123',
          role: 'student'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('is already registered');
    }, 15000);

    it('should initiate registration successfully and return OTP dispatch info', async () => {
      const freshEmail = `fresh_${Date.now()}@nic.in`;
      // Mock rpc register_user: success
      mockRpcRegisterUser.mockResolvedValueOnce({
        data: { id: 'new_user_uuid', email: freshEmail, role: 'student', status: 'inactive', mobile_number: '+919999999999' },
        error: null
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Fresh Candidate',
          email: freshEmail,
          mobileNumber: '+919999999999',
          password: 'ComplexPassword@2026',
          role: 'student'
        });

      if (res.statusCode !== 201) {
        console.error('REGISTRATION FAILED DETAILS:', res.body);
      }
      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toContain('Registration successful');
      expect(res.body.email).toEqual(freshEmail);
    }, 15000);
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('should reject verification if OTP is expired', async () => {
      // Mock OTP verification record search (expired check)
      mockOtpQuery.maybeSingle.mockResolvedValue({
        data: {
          id: 'otp_record_id',
          code: '123456',
          expires_at: new Date(Date.now() - 1000).toISOString(), // expired
          attempts: 0
        },
        error: null
      });

      const res = await request(app)
        .post('/api/v1/auth/verify-otp')
        .send({
          email: 'test@nic.in',
          otp: '123456',
          purpose: 'registration'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('code has expired');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return generic invalid credentials error for non-existing email', async () => {
      // Mock findByEmail: no user found
      mockUsersQuery.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@resolve.now',
          password: 'Password@123',
          loginType: 'password'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('Invalid credentials.');
    });

    it('should return generic invalid credentials error for incorrect password', async () => {
      // Mock findByEmail: user found
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('CorrectPassword@123', 10);
      // findByEmail -> returns the user
      mockUsersQuery.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'user_123',
          email: 'user@resolve.now',
          password_hash: hash,
          failed_login_attempts: 0,
          role: 'student',
          status: 'active'
        },
        error: null
      });
      // findProfileByUserId -> returns profile
      mockProfilesQuery.maybeSingle.mockResolvedValueOnce({
        data: { full_name: 'Test User' },
        error: null
      });
      // update (increment failed_login_attempts) -> single resolves OK
      mockUsersQuery.single.mockResolvedValueOnce({
        data: { id: 'user_123', failed_login_attempts: 1 },
        error: null
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@resolve.now',
          password: 'WrongPassword@123',
          loginType: 'password'
        });

      if (res.statusCode !== 401) {
        console.error('LOGIN WRONG PASSWORD ERROR:', JSON.stringify(res.body));
      }
      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toEqual('Invalid credentials.');
    });


    it('should require MFA OTP for administrative account login', async () => {
      // Mock findByEmail: admin user found
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('CorrectPassword@123', 10);
      mockUsersQuery.maybeSingle.mockResolvedValueOnce({
        data: {
          id: 'admin_123',
          email: 'admin@resolve.now',
          password_hash: hash,
          failed_login_attempts: 0,
          role: 'admin',
          status: 'active'
        },
        error: null
      });
      // findProfileByUserId -> profile found
      mockProfilesQuery.maybeSingle.mockResolvedValueOnce({
        data: { full_name: 'Admin User' },
        error: null
      });
      // reset failed_login_attempts -> single resolves OK
      mockUsersQuery.single.mockResolvedValueOnce({
        data: { id: 'admin_123', failed_login_attempts: 0 },
        error: null
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin@resolve.now',
          password: 'CorrectPassword@123',
          loginType: 'password'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.requiresOtp).toEqual(true);
      expect(res.body.message).toContain('second factor');
    });
  });

  describe('Registration Role Restricting', () => {
    it('should force role to student even if admin role is requested', async () => {
      // Mock rpc register_user success — always returns student role (enforced in service)
      mockRpcRegisterUser.mockResolvedValueOnce({
        data: { id: 'new_user_uuid', email: 'admin-attacker@resolve.now', role: 'student', status: 'inactive' },
        error: null
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Attacker Admin',
          email: 'admin-attacker@resolve.now',
          mobileNumber: '+919999999999',
          password: 'ComplexPassword@2026',
          role: 'admin'
        });

      expect(res.statusCode).toEqual(201);

      // Verify rpc was called with p_role='student', never with 'admin'
      const supabase = require('../config/supabase');
      const rpcCalls = supabase.rpc.mock.calls;
      const registerCall = rpcCalls.find(c => c[0] === 'register_user');
      expect(registerCall).toBeTruthy();
      expect(registerCall[1].p_role).toEqual('student');
    });
  });
});
