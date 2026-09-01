/* global describe, test, expect, jest, beforeEach, beforeAll */
jest.mock('../services/emailService', () => ({
  sendGrievanceEmail: jest.fn().mockResolvedValue(true),
  sendNewGrievanceAlertEmail: jest.fn().mockResolvedValue(true),
  sendEscalatedGrievanceAlertEmail: jest.fn().mockResolvedValue(true),
  sendGrievanceAssignedEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/messagingService', () => ({
  dispatchEmergencyBroadcast: jest.fn().mockResolvedValue(true)
}));

const { CacheManager } = require('../utils/cacheManager');
const grievanceService = require('../services/grievanceService');
const grievanceRepository = require('../repositories/grievanceRepository');

jest.setTimeout(30000);

describe('Enterprise Production Upgrades Test Suite', () => {
  describe('1. Production Cache Manager & TTL Invalidation', () => {
    let cache;

    beforeEach(() => {
      cache = new CacheManager(500); // 500ms TTL
    });

    test('should store and retrieve cached items', () => {
      cache.set('test:key:1', { message: 'hello' }, 1000);
      const result = cache.get('test:key:1');
      expect(result).toEqual({ message: 'hello' });
    });

    test('should expire items after TTL', async () => {
      cache.set('test:key:short', { val: 42 }, 50);
      expect(cache.get('test:key:short')).toEqual({ val: 42 });

      await new Promise(r => setTimeout(r, 70));
      expect(cache.get('test:key:short')).toBeNull();
    });

    test('should support wildcard pattern invalidation', () => {
      cache.set('public:track:TKT-101', { id: 101 });
      cache.set('public:track:TKT-102', { id: 102 });
      cache.set('other:data:1', { id: 999 });

      cache.invalidate('public:track:*');

      expect(cache.get('public:track:TKT-101')).toBeNull();
      expect(cache.get('public:track:TKT-102')).toBeNull();
      expect(cache.get('other:data:1')).toEqual({ id: 999 });
    });

    test('should record hit and miss telemetry metrics', () => {
      cache.set('metric:key', 'data');
      cache.get('metric:key'); // hit
      cache.get('metric:key'); // hit
      cache.get('non:existent'); // miss

      const metrics = cache.getMetrics();
      expect(metrics.hits).toBe(2);
      expect(metrics.misses).toBe(1);
    });
  });

  describe('2. Department-Level Multi-Tenancy & RBAC Isolation', () => {
    test('Admin should access all department grievances', async () => {
      const adminUser = { id: 'admin-1', role: 'admin' };
      const all = await grievanceService.getAllGrievances(adminUser);
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThan(0);
    });

    test('Department officer should be scoped to their assigned department', async () => {
      const itOfficer = { id: 'officer-it-1', role: 'officer', department: 'IT Support' };
      const scoped = await grievanceService.getAllGrievances(itOfficer);
      expect(Array.isArray(scoped)).toBe(true);
      scoped.forEach(g => {
        expect(g.department).toBe('IT Support');
      });
    });

    test('Student role should be strictly isolated to their own user id', async () => {
      const studentUser = { id: 'demo-student-id-101', role: 'student' };
      const studentGrievances = await grievanceService.getAllGrievances(studentUser);
      expect(Array.isArray(studentGrievances)).toBe(true);
      studentGrievances.forEach(g => {
        expect(g.user_id).toBe('demo-student-id-101');
      });
    });
  });

  describe('3. Citizen Dispute & Appeal Workflow', () => {
    let testTicket;

    beforeAll(async () => {
      testTicket = await grievanceRepository.create({
        ticket_id: 'TKT-2026-TEST-APPEAL',
        user_id: 'student-appeal-test',
        title: 'Mess Food Quality Issue in Hostel Block B',
        description: 'Cold and substandard food served in hostel mess.',
        category: 'Maintenance',
        department: 'Facilities & Maintenance',
        status: 'Resolved',
        resolution_notes: 'Mess vendor warned and menu adjusted.'
      });
    });

    test('Citizen can submit a formal dispute appeal with justification', async () => {
      const user = { id: 'student-appeal-test', role: 'student' };
      const reason = 'The issue reoccurred yesterday dinner. No real inspection was conducted.';
      
      const appealed = await grievanceService.appealGrievance(
        testTicket.id,
        reason,
        user,
        '127.0.0.1',
        'Jest Test Suite'
      );

      expect(appealed.status).toBe('Disputed');
      expect(appealed.appeal_reason).toBe(reason);
      expect(appealed.appeal_status).toBe('Pending Review');
      expect(appealed.escalation_tier).toBe('Tier 2 (HOD Dispute Review)');
    });

    test('Unauthorized user cannot appeal another citizens ticket', async () => {
      const stranger = { id: 'stranger-id-99', role: 'student' };
      await expect(
        grievanceService.appealGrievance(testTicket.id, 'Invalid attempt', stranger, '127.0.0.1', 'Jest Test')
      ).rejects.toThrow(/Access Denied/i);
    });

    test('Appeal requires a detailed reason of at least 5 characters', async () => {
      const user = { id: 'student-appeal-test', role: 'student' };
      await expect(
        grievanceService.appealGrievance(testTicket.id, 'bad', user, '127.0.0.1', 'Jest Test')
      ).rejects.toThrow(/justification/i);
    });
  });

  describe('4. CSAT Satisfaction Feedback & Sentiment Scoring', () => {
    let feedbackTicket;

    beforeEach(async () => {
      feedbackTicket = await grievanceRepository.create({
        ticket_id: `TKT-2026-TEST-CSAT-${Date.now()}`,
        user_id: 'student-csat-test',
        title: 'Laboratory AC Unit Broken',
        description: 'AC unit is leaking water near electrical equipment.',
        status: 'Resolved'
      });
    });

    test('Submitting high rating (5/5) computes positive sentiment score (+1)', async () => {
      const user = { id: 'student-csat-test', role: 'student' };
      const updated = await grievanceService.submitFeedback(
        feedbackTicket.id,
        5,
        'Fixed promptly within 2 hours. Excellent work!',
        user,
        '127.0.0.1',
        'Jest Test',
        ['Fast Resolution', 'Polite Staff']
      );

      expect(updated.rating).toBe(5);
      expect(updated.sentiment_score).toBe(1);
      expect(updated.feedback_tags).toEqual(['Fast Resolution', 'Polite Staff']);
      expect(updated.status).toBe('Closed');
    }, 10000);

    test('Submitting low rating (1/5) computes negative sentiment score (-1)', async () => {
      const user = { id: 'student-csat-test', role: 'student' };
      const updated = await grievanceService.submitFeedback(
        feedbackTicket.id,
        1,
        'Very poor communication and took 2 weeks.',
        user,
        '127.0.0.1',
        'Jest Test',
        ['Slow Response']
      );

      expect(updated.rating).toBe(1);
      expect(updated.sentiment_score).toBe(-1);
    }, 10000);
  });

  describe('5. Dynamic Multi-Tier SLA Escalation Matrix', () => {
    let overdueTicket;

    beforeAll(async () => {
      overdueTicket = await grievanceRepository.create({
        ticket_id: 'TKT-2026-TEST-SLA',
        user_id: 'student-sla-test',
        title: 'Severe Water Outage in Hostel 3',
        description: 'No water supply for 3 days.',
        category: 'Maintenance',
        department: 'Facilities & Maintenance',
        status: 'In-Progress',
        sla_due_at: new Date(Date.now() - 3600000 * 52).toISOString(), // 52 hours overdue -> Tier 2
        created_at: new Date(Date.now() - 3600000 * 72).toISOString()
      });
    });

    test('Overdue tickets >48 hours escalate to Tier 2 (Department Head)', async () => {
      const result = await grievanceService.escalateGrievance(
        overdueTicket.id,
        'Overdue > 48h SLA breach',
        null,
        '127.0.0.1',
        'Jest Test',
        'Tier 2'
      );

      expect(result.status).toBe('Escalated');
      expect(result.escalation_tier).toBe('Tier 2 (Department Head / HOD)');
      expect(result.escalated_to).toBe('Department Head');
    });

    test('Overdue tickets >96 hours escalate to Tier 3 (Ombudsman)', async () => {
      const result = await grievanceService.escalateGrievance(
        overdueTicket.id,
        'Critical Overdue > 96h SLA breach',
        null,
        '127.0.0.1',
        'Jest Test',
        'Tier 3'
      );

      expect(result.status).toBe('Escalated');
      expect(result.escalation_tier).toBe('Tier 3 (Institutional Ombudsman / Director)');
      expect(result.escalated_to).toBe('Ombudsman');
    });
  });
});
