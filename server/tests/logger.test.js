/* global describe, it, expect, jest */
const { redactPII, httpLoggerMiddleware } = require('../utils/logger');

describe('Enterprise Logger & PII Redaction Engine', () => {
  it('should redact sensitive password and secret fields in nested objects', () => {
    const rawPayload = {
      username: 'student@institution.edu',
      password: 'SuperSecretPassword123!',
      nested: {
        otp: '984512',
        secret_passkey: 'pass-9921',
        token: 'eyJh...xyz'
      }
    };

    const sanitized = redactPII(rawPayload);

    expect(sanitized.username).toBe('student@institution.edu');
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.nested.otp).toBe('[REDACTED]');
    expect(sanitized.nested.secret_passkey).toBe('[REDACTED]');
    expect(sanitized.nested.token).toBe('[REDACTED]');
  });

  it('should mask phone/mobile numbers while preserving prefix and suffix', () => {
    const data = {
      user_id: 'usr-101',
      mobile_number: '+919876543210',
      phone: '9876543210'
    };

    const sanitized = redactPII(data);

    expect(sanitized.mobile_number).toBe('+91******3210');
    expect(sanitized.phone).toBe('987******3210');
  });

  it('should redact Bearer JWT tokens in raw strings', () => {
    const rawHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0In0.abc_secret_sig';
    const sanitized = redactPII(rawHeader);

    expect(sanitized).toBe('Bearer [REDACTED_JWT]');
  });

  it('should correctly execute httpLoggerMiddleware next handler', () => {
    const req = {
      originalUrl: '/api/v1/grievances',
      method: 'GET',
      id: 'req-test-123',
      headers: { 'user-agent': 'JestTestRunner' }
    };
    const res = {
      on: jest.fn(),
      statusCode: 200
    };
    const next = jest.fn();

    httpLoggerMiddleware(req, res, next);

    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(next).toHaveBeenCalledTimes(1);
  });
});
