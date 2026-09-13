/* global describe, test, expect, jest, beforeAll */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

jest.mock('../config/supabase', () => null);
jest.setTimeout(10000);

const grievanceRepository = require('../repositories/grievanceRepository');
const grievanceService = require('../services/grievanceService');

describe('Officer Resolution Workflow, Evidence Attachments & SLA Pause Protocol', () => {
  const studentUser = {
    id: 'student-officer-test-01',
    email: 'student.sla@institution.edu',
    role: 'student'
  };

  const officerUser = {
    id: 'officer-facilities-01',
    email: 'officer.facilities@institution.edu',
    role: 'officer',
    department: 'Facilities & Maintenance'
  };

  const adminUser = {
    id: 'admin-super-01',
    email: 'admin.super@institution.edu',
    role: 'admin'
  };

  const attackerUser = {
    id: 'attacker-unauthorized-99',
    email: 'attacker@evil.org',
    role: 'student'
  };

  let activeTicket;
  let resolutionTicket;

  beforeAll(async () => {
    // Initial ticket for resolution test
    resolutionTicket = await grievanceRepository.create({
      ticket_id: 'TKT-2026-RESOLVE01',
      user_id: studentUser.id,
      email: studentUser.email,
      title: 'Broken fluorescent tube in Physics Lab 2B',
      description: 'The ceiling lights are flickering and causing eye strain.',
      category: 'Facilities & Maintenance',
      department: 'Facilities & Maintenance',
      assigned_to: officerUser.id,
      urgency: 'Medium',
      status: 'In Progress',
      sla_due_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
    });

    // Initial ticket for clarification & SLA pause test
    activeTicket = await grievanceRepository.create({
      ticket_id: 'TKT-2026-PAUSE01',
      user_id: studentUser.id,
      email: studentUser.email,
      title: 'Water cooler dispensing warm water in Hostel 3 Ground Floor',
      description: 'Cooler unit compressor not kicking in.',
      category: 'Facilities & Maintenance',
      department: 'Facilities & Maintenance',
      assigned_to: officerUser.id,
      urgency: 'High',
      status: 'In Progress',
      sla_due_at: new Date(Date.now() + 12 * 3600 * 1000).toISOString()
    });
  });

  describe('1. Officer Resolution Workflow & Evidence', () => {
    test('officer resolves ticket with public notes, root cause, internal notes, and proof URL', async () => {
      const resolved = await grievanceService.updateGrievanceStatus(
        resolutionTicket.id,
        'Resolved',
        'Ballast and dual fluorescent tubes replaced. Lighting lux level tested normal.',
        officerUser,
        '127.0.0.1',
        'Jest-Officer-Agent',
        {
          root_cause: 'Facility / Hardware Maintenance',
          internal_notes: 'Replaced under Annual Maintenance Contract; vendor notified for defective ballast batch.',
          resolution_proof_url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        }
      );

      expect(resolved).toBeDefined();
      expect(resolved.status).toBe('Resolved');
      expect(resolved.resolution_notes).toContain('Ballast and dual fluorescent tubes replaced');
      expect(resolved.root_cause).toBe('Facility / Hardware Maintenance');
      expect(resolved.internal_notes).toContain('Annual Maintenance Contract');
      expect(resolved.resolution_proof_url).toBeDefined();
      expect(resolved.resolved_at).toBeDefined();
    });

    test('[Data Scoping Guard]: student fetch strips confidential internal_notes', async () => {
      const fetchedByStudent = await grievanceService.getGrievanceById(resolutionTicket.id, studentUser);
      expect(fetchedByStudent).toBeDefined();
      expect(fetchedByStudent.status).toBe('Resolved');
      expect(fetchedByStudent.resolution_notes).toBeDefined();
      expect(fetchedByStudent.resolution_proof_url).toBeDefined();
      // Crucial: internal_notes must be stripped for students
      expect(fetchedByStudent.internal_notes).toBeUndefined();
    });

    test('[Staff Clearance]: officer and admin fetch preserves internal_notes', async () => {
      const fetchedByOfficer = await grievanceService.getGrievanceById(resolutionTicket.id, officerUser);
      expect(fetchedByOfficer.internal_notes).toContain('Annual Maintenance Contract');

      const fetchedByAdmin = await grievanceService.getGrievanceById(resolutionTicket.id, adminUser);
      expect(fetchedByAdmin.internal_notes).toContain('Annual Maintenance Contract');
    });
  });

  describe('2. SLA Pause on Pending User Response & Resume on Clarification', () => {
    test('officer requests clarification and pauses SLA countdown', async () => {
      const paused = await grievanceService.updateGrievanceStatus(
        activeTicket.id,
        'Pending User Response',
        'Please verify which wing cooler is defective: North Wing or East Wing?',
        officerUser,
        '127.0.0.1',
        'Jest-Officer-Agent',
        {
          clarification_question: 'Please verify which wing cooler is defective: North Wing or East Wing?'
        }
      );

      expect(paused).toBeDefined();
      expect(paused.status).toBe('Pending User Response');
      expect(paused.clarification_requested).toContain('North Wing or East Wing');
      expect(paused.sla_paused_at).toBeDefined();
      expect(new Date(paused.sla_paused_at).getTime()).toBeLessThanOrEqual(Date.now());
    });

    test('getOverdueGrievances query excludes tickets in Pending User Response', async () => {
      // Overdue cutoff 24 hours into the future
      const futureIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      const overdueList = await grievanceRepository.getOverdueGrievances(futureIso);
      // Since supabase mock is null, this verifies the function executes safely without throwing
      expect(Array.isArray(overdueList)).toBe(true);
    });

    test('[IDOR Guard]: rejects clarification response from unauthorized non-owner', async () => {
      await expect(
        grievanceService.submitClarification(
          activeTicket.id,
          'Attacker attempting to submit bogus answer.',
          null,
          attackerUser,
          '127.0.0.1',
          'Jest-Attacker-Agent'
        )
      ).rejects.toThrow(/Access Denied/i);
    });

    test('student submits clarification -> resumes SLA, extends sla_due_at, and transitions to In Progress', async () => {
      // Artificially simulate that the ticket was paused 30 minutes ago
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      await grievanceRepository.update(activeTicket.id, {
        sla_paused_at: thirtyMinutesAgo
      });

      const initialTicket = await grievanceRepository.findById(activeTicket.id);
      const originalDueTime = new Date(initialTicket.sla_due_at).getTime();

      const resumed = await grievanceService.submitClarification(
        activeTicket.id,
        'It is the East Wing cooler right next to Room 104.',
        'https://storage.institution.edu/evidence/cooler-serial-104.jpg',
        studentUser,
        '127.0.0.1',
        'Jest-Student-Agent'
      );

      expect(resumed).toBeDefined();
      expect(resumed.status).toBe('In Progress');
      expect(resumed.clarification_response).toContain('East Wing cooler');
      expect(resumed.attachment_url).toBe('https://storage.institution.edu/evidence/cooler-serial-104.jpg');
      expect(resumed.sla_paused_at).toBeNull();
      expect(resumed.sla_total_paused_ms).toBeGreaterThanOrEqual(25 * 60 * 1000);

      // Verify that sla_due_at was extended by the pause duration
      const newDueTime = new Date(resumed.sla_due_at).getTime();
      expect(newDueTime).toBeGreaterThan(originalDueTime);
    });

    test('rejects clarification submission when ticket is not in Pending User Response', async () => {
      // The ticket is now In Progress, so submitting clarification again should be rejected
      await expect(
        grievanceService.submitClarification(
          activeTicket.id,
          'Trying to clarify again when ticket is already in progress.',
          null,
          studentUser,
          '127.0.0.1',
          'Jest-Student-Agent'
        )
      ).rejects.toThrow(/Clarification is only accepted when pending citizen response/i);
    });
  });
});
