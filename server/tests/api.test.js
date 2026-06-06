const request = require('supertest');
const express = require('express');
const path = require('path');

// Setup a mock app or load server/index.js if we separate listen
// Since server/index.js listens immediately on PORT, importing it directly might keep the handle open.
// Instead, let's create a lightweight app mirroring our router setup for fast testing, 
// or import the app before the listen block if it was exported.
// Wait! Let's check if server/index.js exports the app.
// It doesn't: module.exports is not set at the end of server/index.js.
// We can test the app endpoints by running a mock Express setup in our test file that matches the routing structure.
// This is extremely safe and doesn't conflict with active server ports!

const app = express();
app.use(express.json());

// Set up mock process.env for testing
process.env.JWT_SECRET = 'test-secret-key-4567';

const authMiddleware = require('../middleware/authMiddleware');
const validationMiddleware = require('../middleware/validationMiddleware');

// Define routes mirroring production
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Digital Grievance API' });
});

app.post('/api/v1/auth/send-otp', validationMiddleware.validateOtpRequest, (req, res) => {
  res.json({ message: 'Secure key transmitted via Email.', channel: 'EMAIL' });
});

app.get('/api/v1/grievances', authMiddleware.authenticateToken, (req, res) => {
  res.json([{ id: 1, title: 'Sample Grievance' }]);
});

app.post('/api/v1/admin/broadcast', authMiddleware.authenticateToken, authMiddleware.authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'Broadcast successful.' });
});

describe('Digital Grievance API Integration Tests', () => {
  describe('GET /api/health', () => {
    it('should return 200 OK and health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toEqual('ok');
    });
  });

  describe('POST /api/v1/auth/send-otp', () => {
    it('should validate request body and require email or phone', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Request validation failed');
    });

    it('should pass validation with valid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/send-otp')
        .send({ email: 'test@nic.in', role: 'user' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.channel).toEqual('EMAIL');
    });
  });

  describe('Protected Routes Scoping', () => {
    it('should block GET /api/v1/grievances without authorization token', async () => {
      const res = await request(app).get('/api/v1/grievances');
      expect(res.statusCode).toEqual(401);
    });

    it('should block GET /api/v1/grievances with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/grievances')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toEqual(403);
    });
  });
});
