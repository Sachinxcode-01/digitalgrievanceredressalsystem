/* global describe, it, test, expect, jest, beforeAll */
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const voiceAssistantService = require('../services/voiceAssistantService');

const TEST_SECRET = 'voice-assistant-test-jwt-secret-99441';
process.env.JWT_SECRET = TEST_SECRET;
process.env.NODE_ENV = 'test';
delete process.env.GEMINI_API_KEY;

jest.setTimeout(15000);

describe('Interactive AI Voice Assistant & Conversational Dialogue Test Suite', () => {
  describe('1. Heuristic Entity Extraction & Classification Engine', () => {
    test('should classify plumbing grievances correctly', () => {
      const input = 'There is a major water pipe leakage in the 3rd floor bathroom.';
      const result = voiceAssistantService.heuristicExtract(input);
      expect(result.category).toBe('Plumbing');
      expect(result.department).toBe('Facilities & Maintenance');
      expect(result.urgency).toBe('Medium');
      expect(result.title).toBeTruthy();
      expect(result.description).toBe(input);
    });

    test('should detect electrical emergency and set Critical urgency', () => {
      const input = 'Emergency! Sparks and fire coming from the library main power switchboard!';
      const result = voiceAssistantService.heuristicExtract(input);
      expect(result.category).toBe('Electrical');
      expect(result.department).toBe('Facilities & Maintenance');
      expect(result.urgency).toBe('Critical');
    });

    test('should classify academic and grading inquiries', () => {
      const input = 'My mid-semester exam marks were not uploaded by the professor on the portal.';
      const result = voiceAssistantService.heuristicExtract(input);
      expect(result.category).toBe('Academics');
      expect(result.department).toBe('Academic Affairs');
    });

    test('should classify hostel and mess food grievances', () => {
      const input = 'The hostel mess food was contaminated and several students fell sick.';
      const result = voiceAssistantService.heuristicExtract(input);
      expect(result.category).toBe('Hostel');
      expect(result.department).toBe('Hostel & Housing');
    });

    test('should classify security and harassment reports with High urgency', () => {
      const input = 'Severe ragging and bullying incident reported near the south campus gate.';
      const result = voiceAssistantService.heuristicExtract(input);
      expect(result.category).toBe('Security');
      expect(result.department).toBe('Security & Safety');
      expect(result.urgency).toBe('High');
    });

    test('should classify financial and scholarship queries', () => {
      const input = 'My scholarship fee refund for semester 2 has been delayed for 3 months.';
      const result = voiceAssistantService.heuristicExtract(input);
      expect(result.category).toBe('Financial');
      expect(result.department).toBe('Finance & Billing');
    });
  });

  describe('2. Conversational Dialogue Generator & Validation', () => {
    test('should return polite clarification prompt on empty user input', async () => {
      const response = await voiceAssistantService.processVoiceDialogue('   ');
      expect(response.isReadyToSubmit).toBe(false);
      expect(response.spokenResponse).toContain("didn't quite catch that");
      expect(response.extractedData).toBeNull();
    });

    test('should generate spoken response and structured entity bundle for valid voice input', async () => {
      const input = 'The air conditioner in classroom 402 is making loud noises and leaking water.';
      const response = await voiceAssistantService.processVoiceDialogue(input, [], 'en-US');
      expect(response.spokenResponse).toBeTruthy();
      expect(typeof response.spokenResponse).toBe('string');
      expect(response.isReadyToSubmit).toBe(true);
      expect(response.extractedData).toHaveProperty('title');
      expect(response.extractedData).toHaveProperty('category');
      expect(response.extractedData).toHaveProperty('department');
      expect(response.extractedData).toHaveProperty('urgency');
      expect(response.suggestedActions.length).toBeGreaterThan(0);
    });
  });

  describe('3. API Route Integration: POST /api/v1/ai/voice-assistant/converse', () => {
    let app;
    let validToken;

    beforeAll(() => {
      app = express();
      app.use(express.json());

      const aiRoutes = require('../routes/aiRoutes');
      app.use('/api/v1/ai', aiRoutes);

      validToken = jwt.sign(
        { id: 'usr-voice-test', email: 'citizen@institution.edu', role: 'student' },
        TEST_SECRET,
        { expiresIn: '1h' }
      );
    });

    test('should reject unauthenticated voice assistant requests with 401', async () => {
      const res = await request(app)
        .post('/api/v1/ai/voice-assistant/converse')
        .send({ message: 'Water leakage in room 12' });
      expect(res.statusCode).toBe(401);
    });

    test('should process authenticated voice dialogue and return conversational payload', async () => {
      const res = await request(app)
        .post('/api/v1/ai/voice-assistant/converse')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          message: 'The campus wifi network is completely down in Block B hostel.',
          language: 'en-US'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('spokenResponse');
      expect(res.body).toHaveProperty('extractedData');
      expect(res.body.extractedData.category).toBe('Infrastructure');
      expect(res.body.extractedData.department).toBe('IT & Infrastructure');
      expect(res.body.isReadyToSubmit).toBe(true);
    });
  });
});
