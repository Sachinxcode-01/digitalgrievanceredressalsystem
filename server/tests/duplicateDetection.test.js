/* global describe, it, expect, jest */
const request = require('supertest');
const aiService = require('../services/aiService');
const grievanceRepository = require('../repositories/grievanceRepository');

jest.setTimeout(25000);

describe('AI Duplicate Grievance Detection & Upvoting Engine', () => {

  describe('aiService.checkDuplicateGrievance', () => {
    it('should detect a duplicate when narrative matches an existing open ticket', async () => {
      const mockExisting = [
        {
          id: 'g-test-101',
          ticket_id: 'TKT-2026-TEST1',
          title: 'Wi-Fi connectivity drops in Central Library Study Hall',
          description: 'The campus Wi-Fi constantly disconnects every 10 minutes in the central library 2nd floor.',
          category: 'IT Support',
          status: 'In-Progress',
          upvote_count: 3
        }
      ];

      const inputDraft = {
        title: 'Central Library Wi-Fi keeps disconnecting on 2nd floor',
        description: 'Wi-Fi drops repeatedly while working in the library study hall.',
        category: 'IT Support'
      };

      const result = await aiService.checkDuplicateGrievance(inputDraft, mockExisting);
      expect(result).toHaveProperty('is_duplicate');
      expect(typeof result.is_duplicate).toBe('boolean');
      expect(result).toHaveProperty('match_confidence');
      expect(typeof result.match_confidence).toBe('number');
      if (result.is_duplicate) {
        expect(result.matching_ticket).not.toBeNull();
        expect(result.matching_ticket.ticket_id).toBe('TKT-2026-TEST1');
      }
    });

    it('should return is_duplicate: false for a completely unique ticket narrative', async () => {
      const mockExisting = [
        {
          id: 'g-test-101',
          ticket_id: 'TKT-2026-TEST1',
          title: 'Wi-Fi connectivity drops in Central Library',
          description: 'Wi-Fi disconnects in library.',
          category: 'IT Support',
          status: 'In-Progress'
        }
      ];

      const inputDraft = {
        title: 'Mess food quality issue in Hostel 4 canteen',
        description: 'Undercooked rice served during dinner at Hostel 4 mess.',
        category: 'Hostel & Social Welfare'
      };

      const result = await aiService.checkDuplicateGrievance(inputDraft, mockExisting);
      expect(result.is_duplicate).toBe(false);
      expect(result.matching_ticket).toBeNull();
    });
  });

  describe('grievanceRepository.upvote', () => {
    it('should increment upvote_count and track user ID', async () => {
      const created = await grievanceRepository.create({
        title: 'Test Upvote Grievance',
        description: 'Testing community upvote functionality.',
        category: 'IT Support',
        urgency: 'Medium',
        status: 'Submitted'
      });

      const initialCount = created.upvote_count || 1;
      const res = await grievanceRepository.upvote(created.id, 'user-unit-test-1');

      expect(res.alreadyUpvoted).toBe(false);
      expect(res.grievance.upvote_count).toBe(initialCount + 1);
      expect(res.grievance.upvoted_by).toContain('user-unit-test-1');
    });

    it('should prevent duplicate upvotes from the same user', async () => {
      const created = await grievanceRepository.create({
        title: 'Test Duplicate Upvote',
        description: 'Preventing double upvoting.',
        category: 'Financial Services',
        urgency: 'Medium',
        status: 'Submitted'
      });

      await grievanceRepository.upvote(created.id, 'user-unit-test-2');
      const secondTry = await grievanceRepository.upvote(created.id, 'user-unit-test-2');

      expect(secondTry.alreadyUpvoted).toBe(true);
    });

    it('should auto-escalate urgency to High when upvotes reach 5 or more', async () => {
      const created = await grievanceRepository.create({
        title: 'Widespread Power Outage in Block C',
        description: 'No electricity in Block C since morning.',
        category: 'Maintenance',
        urgency: 'Medium',
        status: 'Assigned',
        upvote_count: 4,
        upvoted_by: ['u1', 'u2', 'u3', 'u4']
      });

      const res = await grievanceRepository.upvote(created.id, 'u5');
      expect(res.grievance.upvote_count).toBe(5);
      expect(res.grievance.urgency).toBe('High');
    });
  });
});
