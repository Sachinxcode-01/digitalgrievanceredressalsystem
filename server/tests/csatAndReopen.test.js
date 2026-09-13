/* global describe, test, expect, jest, beforeAll */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

jest.mock('../config/supabase', () => null);
jest.setTimeout(10000);

const grievanceRepository = require('../repositories/grievanceRepository');
const grievanceService = require('../services/grievanceService');
const reportService = require('../services/reportService');

describe('CSAT Satisfaction, NPS Scoring & 72h Reopen Loop', () => {
  const studentUser = {
    id: 'student-csat-test-01',
    email: 'student.csat@test.institution.edu',
    role: 'student'
  };

  const maliciousUser = {
    id: 'malicious-user-99',
    email: 'attacker@outside.com',
    role: 'student'
  };

  let resolvedTicket;
  let oldResolvedTicket;
  let inProgressTicket;

  beforeAll(async () => {
    // 1. Create a freshly resolved ticket (resolved 2 hours ago)
    resolvedTicket = await grievanceRepository.create({
      ticket_id: 'TKT-2026-CSAT01',
      user_id: studentUser.id,
      email: studentUser.email,
      title: 'Hostel Hot Water Heater Failure',
      description: 'Hot water not flowing in 4th floor bathrooms during morning hours.',
      category: 'Facilities & Maintenance',
      department: 'Facilities & Maintenance',
      urgency: 'High',
      status: 'Resolved',
      resolved_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      resolution_notes: 'Heating element replaced by facility maintenance team.'
    });

    // 2. Create an old resolved ticket (resolved 85 hours ago, outside 72h window)
    oldResolvedTicket = await grievanceRepository.create({
      ticket_id: 'TKT-2026-CSAT02',
      user_id: studentUser.id,
      email: studentUser.email,
      title: 'Wi-Fi Signal Strength in Computer Lab',
      description: 'Frequent packet drop and high ping.',
      category: 'IT Support',
      department: 'IT Support & Network',
      urgency: 'Medium',
      status: 'Resolved',
      resolved_at: new Date(Date.now() - 85 * 60 * 60 * 1000).toISOString(),
      resolution_notes: 'Access point firmware patched.'
    });

    // 3. Create an in-progress ticket
    inProgressTicket = await grievanceRepository.create({
      ticket_id: 'TKT-2026-CSAT03',
      user_id: studentUser.id,
      email: studentUser.email,
      title: 'Library Card Barcode Scan Error',
      description: 'Turnstile scanner not reading smart cards.',
      category: 'Academic Affairs',
      department: 'Academic Affairs',
      urgency: 'Low',
      status: 'In Progress'
    });
  });

  describe('1. CSAT Feedback & NPS Submission', () => {
    test('successfully submits CSAT rating, NPS score, tags, and satisfaction status', async () => {
      const updated = await grievanceService.submitFeedback(
        resolvedTicket.id,
        5,
        'Prompt remediation by the hostel warden and plumber.',
        studentUser,
        '127.0.0.1',
        'Jest-Test-Agent',
        ['Fast Resolution', 'Polite Communication'],
        10,
        true
      );

      expect(updated).toBeDefined();
      expect(updated.rating).toBe(5);
      expect(updated.nps_score).toBe(10);
      expect(updated.resolution_satisfied).toBe(true);
      expect(updated.status).toBe('Closed');
      expect(updated.feedback_tags).toEqual(['Fast Resolution', 'Polite Communication']);
    });

    test('[IDOR Guard]: rejects feedback submission from non-owner student', async () => {
      await expect(
        grievanceService.submitFeedback(
          resolvedTicket.id,
          1,
          'Unauthorized attempt to tamper rating.',
          maliciousUser,
          '127.0.0.1',
          'Jest-Attacker',
          [],
          0,
          false
        )
      ).rejects.toThrow('Access Denied: Scoped access violation');
    });
  });

  describe('2. 72-Hour Reopen Protocol', () => {
    test('successfully reopens a grievance within the 72-hour window', async () => {
      const reopened = await grievanceService.reopenGrievance(
        resolvedTicket.id,
        'The water heater tripped the circuit again this morning. Problem reoccurred.',
        studentUser,
        '127.0.0.1',
        'Jest-Test-Agent'
      );

      expect(reopened).toBeDefined();
      expect(reopened.status).toBe('Reopened');
      expect(reopened.reopen_count).toBe(1);
      expect(reopened.reopen_reason).toContain('water heater tripped');
      expect(reopened.reopened_at).toBeDefined();
    });

    test('rejects reopening when 72-hour window has expired', async () => {
      await expect(
        grievanceService.reopenGrievance(
          oldResolvedTicket.id,
          'Attempting to reopen an issue resolved 85 hours ago.',
          studentUser,
          '127.0.0.1',
          'Jest-Test-Agent'
        )
      ).rejects.toThrow(/Reopen window expired/i);
    });

    test('rejects reopening a ticket that is still in progress', async () => {
      await expect(
        grievanceService.reopenGrievance(
          inProgressTicket.id,
          'Trying to reopen an in-progress ticket.',
          studentUser,
          '127.0.0.1',
          'Jest-Test-Agent'
        )
      ).rejects.toThrow(/Only resolved or closed tickets can be reopened/i);
    });

    test('[IDOR Guard]: rejects reopen request from malicious non-owner', async () => {
      await expect(
        grievanceService.reopenGrievance(
          resolvedTicket.id,
          'Attacker attempting to reopen someone else ticket.',
          maliciousUser,
          '127.0.0.1',
          'Jest-Attacker'
        )
      ).rejects.toThrow(/Access Denied/i);
    });
  });

  describe('3. Institutional CSAT Analytics', () => {
    test('computes comprehensive CSAT, NPS, and reopen rate metrics', async () => {
      const analytics = await reportService.getCsatAnalytics();

      expect(analytics).toBeDefined();
      expect(typeof analytics.averageRating).toBe('number');
      expect(typeof analytics.satisfactionRate).toBe('number');
      expect(analytics.nps).toBeDefined();
      expect(typeof analytics.nps.score).toBe('number');
      expect(Array.isArray(analytics.departmentLeaderboard)).toBe(true);
      expect(analytics.reopenMetrics).toBeDefined();
      expect(typeof analytics.reopenMetrics.reopenRate).toBe('number');
      expect(analytics.ratingDistribution).toBeDefined();
    });
  });
});
