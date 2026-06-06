const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');

// Clean, table-specific mocks to prevent mock pollution
const mockUsersQuery = {
  select: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
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
  single: jest.fn()
};

const mockProfilesQuery = {
  insert: jest.fn().mockResolvedValue({ error: null }),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { full_name: 'Test Profile' }, error: null })
};

const mockResetsQuery = {
  insert: jest.fn().mockResolvedValue({ error: null }),
  delete: jest.fn().mockResolvedValue({ error: null })
};

const mockSessionsQuery = {
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: { id: 'session_123', expires_at: new Date(Date.now() + 60000).toISOString() }, error: null })
};

const mockDevicesQuery = {
  upsert: jest.fn().mockResolvedValue({ error: null })
};

const mockAuditLogsQuery = {
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
      return mockUsersQuery;
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
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should fail registration if email already exists', async () => {
      // Mock existing user found
      mockUsersQuery.maybeSingle.mockResolvedValue({
        data: { id: 'user_1', email: 'test@nic.in' },
        error: null
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Test User',
          email: 'test@nic.in',
          password: 'Password@123',
          role: 'student'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('is already registered');
    });

    it('should initiate registration successfully and return OTP dispatch info', async () => {
      // Mock check: no user found
      mockUsersQuery.maybeSingle.mockResolvedValue({ data: null, error: null });

      // Mock user insert
      mockUsersQuery.single.mockResolvedValue({
        data: { id: 'new_user_uuid', email: 'new@nic.in', role: 'student', status: 'inactive' },
        error: null
      });

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          fullName: 'Fresh Candidate',
          email: 'new@nic.in',
          mobileNumber: '+919999999999',
          password: 'ComplexPassword@2026',
          role: 'student'
        });

      if (res.statusCode !== 201) {
        console.error('REGISTRATION FAILED DETAILS:', res.body);
      }
      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toContain('Registration successful');
      expect(res.body.email).toEqual('new@nic.in');
    });
  });

  describe('POST /api/v1/auth/verify-otp', () => {
    it('should reject verification if OTP is expired', async () => {
      // Mock OTP verification record search (expired check)
      mockOtpQuery.single.mockResolvedValue({
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
});
