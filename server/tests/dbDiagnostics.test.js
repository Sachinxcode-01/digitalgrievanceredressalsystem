/* global describe, it, expect */
const request = require('supertest');
const app = require('../index');
const { cleanOldBackups } = require('../../scripts/backup-database');

describe('Database Disaster Recovery & Diagnostics', () => {
  it('should block unauthenticated access to database diagnostics', async () => {
    const res = await request(app).get('/api/v1/admin/database/diagnostics');
    expect([401, 403]).toContain(res.statusCode);
  });

  it('should run cleanOldBackups without throwing exceptions', () => {
    expect(() => cleanOldBackups()).not.toThrow();
  });
});
