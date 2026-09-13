/* global describe, test, expect, jest, beforeAll */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

jest.mock('../config/supabase', () => null);
jest.setTimeout(10000);

const request = require('supertest');
const express = require('express');
const grievanceRepository = require('../repositories/grievanceRepository');
const publicRoutes = require('../routes/publicRoutes');

const app = express();
app.use(express.json());
app.use('/api/v1/public', publicRoutes);

describe('Public Tracking & Citizen Transparency Hub API (/api/v1/public/track/:ticketId)', () => {
  let resolvedTicket;
  let pausedTicket;
  let reopenedTicket;

  beforeAll(async () => {
    // 1. Resolved ticket with resolution proof, root cause, and pre-existing hash
    resolvedTicket = await grievanceRepository.create({
      ticket_id: 'TKT-PUB-TEST-RES01',
      user_id: 'citizen-uuid-001',
      email: 'citizen.confidential@example.org',
      mobile_number: '+919876543210',
      title: 'Water leak in Sector 4 Computer Center',
      description: 'Overhead piping is dripping water onto server racks.',
      category: 'Infrastructure',
      department: 'Facilities & Maintenance',
      urgency: 'High',
      status: 'Resolved',
      root_cause: 'Worn gasket on main overhead valve',
      resolution_notes: 'Replaced valve gasket with high-pressure fluoropolymer seal and load-tested.',
      resolution_proof_url: 'https://storage.grievance.gov/proofs/leak-fixed-dossier.pdf',
      internal_notes: 'RESTRICTED: Contractor charged $140 for emergency valve kit.',
      secret_passkey: 'secret-vault-passkey-99',
      proof_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      rating: 5,
      nps_score: 10,
      resolution_satisfied: true,
      resolved_at: new Date().toISOString()
    });

    // 2. Ticket with clarification requested & SLA paused (no proof_hash pre-computed)
    pausedTicket = await grievanceRepository.create({
      ticket_id: 'TKT-PUB-TEST-PAUSE01',
      user_id: 'citizen-uuid-002',
      email: 'citizen2@example.org',
      title: 'Missing academic transcript verification',
      description: 'Applied for transcript verification 2 weeks ago but no dispatch confirmation.',
      category: 'Academic & Examination',
      department: 'Examination Branch',
      urgency: 'Medium',
      status: 'Pending User Response',
      sla_paused_at: new Date().toISOString(),
      clarification_requested: 'Please provide your enrollment number and exam session batch year.',
      internal_notes: 'Waiting for student confirmation before checking physical archive registry.',
      proof_hash: null
    });

    // 3. Ticket reopened by citizen
    reopenedTicket = await grievanceRepository.create({
      ticket_id: 'TKT-PUB-TEST-REOPEN01',
      user_id: 'citizen-uuid-003',
      email: 'citizen3@example.org',
      title: 'Street light repair malfunctioned again',
      description: 'Street light on 5th Avenue went dark again after two nights.',
      category: 'Public Works',
      department: 'Electrical & Power',
      urgency: 'High',
      status: 'Reopened',
      reopen_count: 1,
      reopened_at: new Date().toISOString(),
      reopen_reason: 'Light fixture started flickering and blew out completely on Sunday night.',
      internal_notes: 'DISPATCH NOTICE: Assigned to senior field inspector for voltage irregularity audit.'
    });
  });

  test('1. returns public resolution dossier parameters (root_cause, resolution_proof_url, proof_hash, resolution_notes)', async () => {
    const res = await request(app)
      .get(`/api/v1/public/track/${resolvedTicket.ticket_id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.ticket_id).toBe('TKT-PUB-TEST-RES01');
    expect(res.body.title).toBe('Water leak in Sector 4 Computer Center');
    expect(res.body.status).toBe('Resolved');
    expect(res.body.root_cause).toBe('Worn gasket on main overhead valve');
    expect(res.body.resolution_proof_url).toBe('https://storage.grievance.gov/proofs/leak-fixed-dossier.pdf');
    expect(res.body.proof_hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(res.body.resolution_notes).toContain('Replaced valve gasket');
    expect(res.body.nps_score).toBe(10);
    expect(res.body.resolution_satisfied).toBe(true);
  });

  test('2. maintains strict privacy boundary - strips internal_notes, passkey, email, phone, and user_id', async () => {
    const res = await request(app)
      .get(`/api/v1/public/track/${resolvedTicket.ticket_id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.internal_notes).toBeUndefined();
    expect(res.body.secret_passkey).toBeUndefined();
    expect(res.body.email).toBeUndefined();
    expect(res.body.mobile_number).toBeUndefined();
    expect(res.body.user_id).toBeUndefined();
  });

  test('3. generates a 64-character SHA-256 proof_hash dynamically when absent in DB record', async () => {
    const res = await request(app)
      .get(`/api/v1/public/track/${pausedTicket.ticket_id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.proof_hash).toBeDefined();
    expect(typeof res.body.proof_hash).toBe('string');
    expect(res.body.proof_hash).toHaveLength(64); // Valid SHA-256 hex length
    expect(/^[a-f0-9]{64}$/i.test(res.body.proof_hash)).toBe(true);
  });

  test('4. exposes statutory SLA pause and citizen clarification inquiry when active', async () => {
    const res = await request(app)
      .get(`/api/v1/public/track/${pausedTicket.ticket_id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('Pending User Response');
    expect(res.body.sla_paused_at).toBeDefined();
    expect(res.body.clarification_requested).toBe('Please provide your enrollment number and exam session batch year.');
  });

  test('5. exposes reopen cycle count and complainant reopen rationale', async () => {
    const res = await request(app)
      .get(`/api/v1/public/track/${reopenedTicket.ticket_id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('Reopened');
    expect(res.body.reopen_count).toBe(1);
    expect(res.body.reopen_reason).toContain('Light fixture started flickering');
  });

  test('6. returns 404 for unknown or invalid ticket reference ID', async () => {
    const res = await request(app)
      .get('/api/v1/public/track/TKT-NONEXISTENT-99999');

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toContain('No grievance record found');
  });
});
