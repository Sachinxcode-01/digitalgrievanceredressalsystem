/* global describe, it, expect, jest */
const request = require('supertest');
const app = require('../index');

jest.setTimeout(25000);

describe('DevOps, Health Probes & Observability', () => {
  it('GET /api/v1/health/liveness should return 200 UP for container probes', async () => {
    const res = await request(app).get('/api/v1/health/liveness');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'UP');
    expect(res.body).toHaveProperty('check', 'liveness');
    expect(res.body).toHaveProperty('uptimeSeconds');
    expect(res.body).toHaveProperty('memoryUsageMB');
    expect(typeof res.body.uptimeSeconds).toBe('number');
  });

  it('GET /api/v1/health/readiness should report database health and latency', async () => {
    const res = await request(app).get('/api/v1/health/readiness');
    expect([200, 503]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('check', 'readiness');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('status');
    expect(res.body.database).toHaveProperty('latencyMs');
  });

  it('GET /metrics should return Prometheus/OpenMetrics text formatting', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    
    const text = res.text;
    expect(text).toContain('# HELP process_uptime_seconds');
    expect(text).toContain('# TYPE process_uptime_seconds counter');
    expect(text).toContain('process_uptime_seconds');

    expect(text).toContain('# HELP ai_circuit_breaker_state');
    expect(text).toContain('ai_circuit_breaker_state');

    expect(text).toContain('# HELP notification_queue_depth');
    expect(text).toContain('notification_queue_depth');

    expect(text).toContain('# HELP notification_dead_letter_count');
    expect(text).toContain('notification_dead_letter_count');
  });
});
