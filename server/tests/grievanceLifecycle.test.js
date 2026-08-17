/* global describe, it, expect, jest, beforeEach */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-active-secret-key-98765';
process.env.NODE_ENV = 'test';

// Mocks
const mockGrievanceData = [
  {
    id: 'g1',
    ticket_id: 'GRV-1001',
    user_id: 'student_123',
    title: 'Wi-Fi connectivity in Hostel Block C',
    description: 'Wi-Fi has been failing continuously since yesterday evening.',
    category: 'IT Support',
    urgency: 'High',
    status: 'In Progress',
    department: 'IT Support & Campus Wi-Fi',
    created_at: new Date().toISOString()
  },
  {
    id: 'g2',
    ticket_id: 'GRV-1002',
    user_id: 'student_456',
    title: 'Mess Food Quality Issue',
    description: 'Uncooked rice served in afternoon mess.',
    category: 'Maintenance',
    urgency: 'Medium',
    status: 'Submitted',
    department: 'Facilities & Maintenance',
    created_at: new Date().toISOString()
  }
];

const mockGrievancesQuery = {
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: mockGrievanceData[0], error: null }),
  then: jest.fn((resolve) => resolve({ data: mockGrievanceData, error: null }))
};

jest.mock('../services/smsService', () => ({
  sendSms: jest.fn().mockResolvedValue({ success: true }),
  queueSms: jest.fn().mockResolvedValue({ success: true })
}));

jest.mock('../services/notificationService', () => ({
  sendGrievanceEmail: jest.fn().mockResolvedValue(true),
  sendGrievanceAssignedEmail: jest.fn().mockResolvedValue(true),
  sendGrievanceStatusUpdatedEmail: jest.fn().mockResolvedValue(true),
  sendResolutionCompletedEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../config/supabase', () => {
  return {
    from: jest.fn((table) => {
      if (table === 'grievances') return mockGrievancesQuery;
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      };
    })
  };
});

// App initialization
const app = express();
app.use(express.json());

// Auth helper tokens
const studentToken = jwt.sign(
  { id: 'student_123', email: 'student1@nic.in', role: 'student' },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const adminToken = jwt.sign(
  { id: 'admin_999', email: 'admin@resolvenow.demo', role: 'admin', mfa_verified: true },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

// Register routes
app.use('/api/v1/ai', require('../routes/aiRoutes'));

describe('Grievance Lifecycle & Security RBAC Integration Tests', () => {

  describe('POST /api/v1/ai/smart-route', () => {
    it('should reject unauthenticated smart-route requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/ai/smart-route')
        .send({
          title: 'Campus Wi-Fi Outage',
          description: 'Cannot connect to EduNet in library'
        });

      expect(res.statusCode).toEqual(401);
    });

    it('should process authenticated smart-route analysis successfully', async () => {
      const res = await request(app)
        .post('/api/v1/ai/smart-route')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Library Router Crash',
          description: 'Wi-Fi network connection refused continuously on 2nd floor library',
          category: 'IT Support',
          urgency: 'High'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('recommended_department');
      expect(res.body).toHaveProperty('predicted_sla_hours');
      expect(res.body).toHaveProperty('sentiment');
      expect(res.body).toHaveProperty('suggested_action');
    });
  });

  describe('RBAC Authorization Boundary Checks', () => {
    it('should reject non-admin access to admin-only AI resolution suggestions', async () => {
      const res = await request(app)
        .post('/api/v1/ai/suggest')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          ticket: mockGrievanceData[0]
        });

      expect(res.statusCode).toEqual(403);
    });

    it('should allow admin access to AI resolution suggestions', async () => {
      const res = await request(app)
        .post('/api/v1/ai/suggest')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ticket: mockGrievanceData[0]
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('suggestion');
    });
  });
});
