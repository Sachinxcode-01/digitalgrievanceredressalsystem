/* global describe, it, expect */
const request = require('supertest');
const app = require('../index');
const { metricsCollector } = require('../utils/metricsCollector');
const { isRedisConnected, isRedisEnabled } = require('../config/redisClient');

describe('Enterprise Observability & Prometheus Metrics Suite', () => {
  it('should return 200 with structured JSON metrics at /api/v1/metrics', async () => {
    const res = await request(app)
      .get('/api/v1/metrics')
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime_seconds');
    expect(res.body).toHaveProperty('system');
    expect(res.body).toHaveProperty('process');
    expect(res.body).toHaveProperty('http');
    expect(res.body.http).toHaveProperty('total_requests');
    expect(res.body).toHaveProperty('ai_circuit_breaker');
    expect(res.body).toHaveProperty('notification_queue');
    expect(res.body).toHaveProperty('redis');
  });

  it('should return Prometheus formatted metrics when requested via query param', async () => {
    const res = await request(app)
      .get('/api/v1/metrics?format=prometheus');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('# HELP resolvenow_http_requests_total');
    expect(res.text).toContain('# TYPE resolvenow_http_requests_total counter');
    expect(res.text).toContain('resolvenow_uptime_seconds');
    expect(res.text).toContain('resolvenow_ai_circuit_state');
  });

  it('should return Prometheus format when Accept header is text/plain', async () => {
    const res = await request(app)
      .get('/metrics')
      .set('Accept', 'text/plain');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('resolvenow_uptime_seconds');
  });

  it('should accurately calculate latency percentiles in metricsCollector', () => {
    metricsCollector.latencies = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const p50 = metricsCollector.getPercentile(50);
    const p95 = metricsCollector.getPercentile(95);

    expect(p50).toBeGreaterThanOrEqual(40);
    expect(p95).toBeGreaterThanOrEqual(90);
  });

  it('should safely report Redis connection status without throwing errors', () => {
    expect(typeof isRedisConnected()).toBe('boolean');
    expect(typeof isRedisEnabled()).toBe('boolean');
  });
});
