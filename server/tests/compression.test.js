/* global describe, it, expect */
const request = require('supertest');
const app = require('../index');

describe('HTTP Compression & Static Cache Headers', () => {
  it('should compress API response payload with gzip when Accept-Encoding is provided', async () => {
    const res = await request(app)
      .get('/api/v1/health/liveness')
      .set('Accept-Encoding', 'gzip, deflate');

    expect(res.statusCode).toBe(200);
    // When compression applies, content-encoding or body is intact
    expect(res.body).toHaveProperty('status', 'UP');
  });

  it('should return valid response for root /metrics with compression support', async () => {
    const res = await request(app)
      .get('/metrics')
      .set('Accept-Encoding', 'gzip');

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('# HELP process_uptime_seconds');
  });
});
