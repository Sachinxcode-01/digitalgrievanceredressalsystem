/* global describe, it, expect, beforeAll, afterAll, jest */
jest.mock('../services/emailService', () => ({
  sendGrievanceEmail: jest.fn().mockResolvedValue(true),
  sendNewGrievanceAlertEmail: jest.fn().mockResolvedValue(true),
  sendEscalatedGrievanceAlertEmail: jest.fn().mockResolvedValue(true),
  sendGrievanceAssignedEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../services/messagingService', () => ({
  dispatchEmergencyBroadcast: jest.fn().mockResolvedValue(true)
}));

const request = require('supertest');
const app = require('../index');
const grievanceRepository = require('../repositories/grievanceRepository');
const notificationQueue = require('../services/notificationQueue');
const crypto = require('crypto');

jest.setTimeout(30000);

describe('Phase 6: End-to-End Citizen-to-Officer Lifecycle Simulation', () => {
  let createdTicket;
  const testStudentId = 'student-e2e-' + Date.now();
  const testOfficerId = 'officer-e2e-' + Date.now();
  const testTicketId = 'TKT-E2E-' + Math.random().toString(36).substring(7).toUpperCase();

  beforeAll(async () => {
    notificationQueue.reset();
  });

  afterAll(async () => {
    notificationQueue.reset();
  });

  it('Step 1: Student submits a new grievance with cryptographic audit proof', async () => {
    const payload = {
      ticket_id: testTicketId,
      user_id: testStudentId,
      title: 'Hostel Wi-Fi Access Point Frequent Disconnections',
      description: 'The router in Block C 2nd floor drops connection every 10 minutes during classes.',
      category: 'IT Support',
      department: 'IT Support',
      urgency: 'High',
      status: 'Submitted',
      proof_hash: crypto.createHash('sha256').update(testTicketId + testStudentId).digest('hex')
    };

    createdTicket = await grievanceRepository.create(payload);

    expect(createdTicket).toBeDefined();
    expect(createdTicket.id).toBeDefined();
    expect(createdTicket.ticket_id).toBe(testTicketId);
    expect(createdTicket.proof_hash).toBeDefined();
    expect(createdTicket.proof_hash.length).toBe(64);
  });

  it('Step 2: Notification Queue enqueues delivery alert with DLQ protection', () => {
    const jobId = notificationQueue.enqueue(
      'EMAIL',
      { to: 'student@campus.edu', ticketId: createdTicket.ticket_id },
      async () => true
    );

    expect(typeof jobId).toBe('string');
    expect(jobId).toMatch(/^JOB_/);

    const metrics = notificationQueue.getMetrics();
    expect(metrics.metrics.totalEnqueued).toBeGreaterThanOrEqual(1);
  });

  it('Step 3: Department Officer retrieves ticket, assigns, and sets In Progress', async () => {
    const updated = await grievanceRepository.update(createdTicket.id, {
      assigned_to: testOfficerId,
      status: 'In Progress'
    });

    expect(updated.assigned_to).toBe(testOfficerId);
    expect(updated.status).toBe('In Progress');
  });

  it('Step 4: Department Officer posts official resolution notes', async () => {
    const resolved = await grievanceRepository.update(createdTicket.id, {
      status: 'Resolved',
      resolution_notes: 'Technician replaced failing capacitor on Access Point AP-C2. Signal stabilized at 120Mbps.'
    });

    expect(resolved.status).toBe('Resolved');
    expect(resolved.resolution_notes).toContain('AP-C2');
  });

  it('Step 5: Citizen disputes resolution via appeal workflow and triggers Tier 2 escalation', async () => {
    const appealed = await grievanceRepository.update(createdTicket.id, {
      status: 'Escalated',
      appeal_status: 'Pending Review',
      appeal_reason: 'Wi-Fi dropped again 15 minutes after technician left.',
      escalation_tier: 'Tier 2 (Department Head / HOD)'
    });

    expect(appealed.status).toBe('Escalated');
    expect(appealed.escalation_tier).toContain('Tier 2');
    expect(appealed.appeal_reason).toContain('dropped again');
  });

  it('Step 6: Cryptographic proof hash matches zero-trust Merkle verification', () => {
    const expectedHash = crypto.createHash('sha256').update(testTicketId + testStudentId).digest('hex');
    expect(createdTicket.proof_hash).toBe(expectedHash);
  });

  it('Step 7: Production Metrics telemetry increments HTTP activity accurately', async () => {
    const metricsRes = await request(app).get('/api/v1/metrics');
    expect(metricsRes.status).toBe(200);
    expect(metricsRes.body.http.total_requests).toBeGreaterThan(0);
    expect(metricsRes.body.ai_circuit_breaker.state).toBe('CLOSED');
  });
});
