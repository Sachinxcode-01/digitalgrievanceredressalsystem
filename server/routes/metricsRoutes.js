const express = require('express');
const router = express.Router();
const { metricsCollector } = require('../utils/metricsCollector');

/**
 * Enterprise Production Metrics Endpoint
 * Supports Prometheus exposition format and JSON metrics telemetry.
 * 
 * Usage:
 * - GET /api/v1/metrics (returns JSON or Prometheus based on Accept header)
 * - GET /api/v1/metrics?format=prometheus (forces Prometheus scrape output)
 */
router.get('/', (req, res) => {
  // Optional security check: if METRICS_SECRET is defined, require matching header or query token
  const metricsSecret = process.env.METRICS_SECRET;
  if (metricsSecret) {
    const providedKey = req.headers['x-metrics-token'] || req.query.token;
    if (providedKey !== metricsSecret) {
      return res.status(401).json({ error: 'Unauthorized metrics access. Invalid token.' });
    }
  }

  const acceptHeader = req.headers.accept || '';
  const isPrometheus = req.query.format === 'prometheus' || acceptHeader.includes('text/plain');

  if (isPrometheus) {
    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    return res.send(metricsCollector.toPrometheusFormat());
  }

  res.set('Content-Type', 'application/json');
  return res.json(metricsCollector.getMetricsSnapshot());
});

module.exports = router;
