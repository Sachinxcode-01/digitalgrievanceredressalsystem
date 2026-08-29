const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const { aiCircuitBreaker, CircuitState } = require('../utils/aiCircuitBreaker');
const notificationQueue = require('../services/notificationQueue');

// @route   GET /api/v1/health/liveness
// @desc    Kubernetes Liveness Probe - Returns 200 if container process is alive
router.get('/liveness', (req, res) => {
  res.status(200).json({
    status: 'UP',
    check: 'liveness',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    memoryUsageMB: Math.round(process.memoryUsage().rss / (1024 * 1024))
  });
});

// @route   GET /api/v1/health/readiness
// @desc    Kubernetes Readiness Probe - Verifies database connectivity and latency
router.get('/readiness', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'HEALTHY';
  let latencyMs = 0;

  try {
    if (supabase) {
      const { error } = await supabase.from('grievances').select('id', { count: 'exact', head: true }).limit(1);
      latencyMs = Date.now() - startTime;
      if (error) {
        dbStatus = 'DEGRADED';
        logger.warn('Readiness DB query degraded', { error: error.message, requestId: req.id });
      }
    } else {
      dbStatus = 'OFFLINE';
    }
  } catch (err) {
    dbStatus = 'UNREACHABLE';
    latencyMs = Date.now() - startTime;
    logger.error('Readiness probe database exception', { error: err.message, requestId: req.id });
  }

  const isReady = dbStatus === 'HEALTHY' || dbStatus === 'DEGRADED';
  const statusCode = isReady ? 200 : 503;

  res.status(statusCode).json({
    status: isReady ? 'READY' : 'NOT_READY',
    check: 'readiness',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs
    },
    service: 'Digital Grievance API'
  });
});

// @route   GET /api/v1/health/metrics OR GET /metrics
// @desc    Prometheus / OpenMetrics text exposition endpoint
const handlePrometheusMetrics = (req, res) => {
  const mem = process.memoryUsage();
  const uptime = process.uptime();
  const queueStats = notificationQueue.getMetrics();
  
  const circuitState = aiCircuitBreaker.getState();
  let circuitCode = 0; // 0 = CLOSED
  if (circuitState === CircuitState.OPEN) circuitCode = 1;
  else if (circuitState === CircuitState.HALF_OPEN) circuitCode = 2;

  const prometheusMetrics = [
    '# HELP process_uptime_seconds Total uptime of the Node.js process in seconds.',
    '# TYPE process_uptime_seconds counter',
    `process_uptime_seconds ${uptime.toFixed(2)}`,
    '',
    '# HELP process_resident_memory_bytes Resident memory size in bytes.',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${mem.rss}`,
    '',
    '# HELP nodejs_heap_used_bytes Memory used by JavaScript heap in bytes.',
    '# TYPE nodejs_heap_used_bytes gauge',
    `nodejs_heap_used_bytes ${mem.heapUsed}`,
    '',
    '# HELP nodejs_heap_total_bytes Total allocated JavaScript heap in bytes.',
    '# TYPE nodejs_heap_total_bytes gauge',
    `nodejs_heap_total_bytes ${mem.heapTotal}`,
    '',
    '# HELP ai_circuit_breaker_state State of AI Circuit Breaker (0=CLOSED, 1=OPEN, 2=HALF_OPEN).',
    '# TYPE ai_circuit_breaker_state gauge',
    `ai_circuit_breaker_state ${circuitCode}`,
    '',
    '# HELP notification_queue_depth Number of jobs currently waiting in notification queue.',
    '# TYPE notification_queue_depth gauge',
    `notification_queue_depth ${queueStats.queuedJobsCount}`,
    '',
    '# HELP notification_dead_letter_count Total jobs in Dead-Letter Queue.',
    '# TYPE notification_dead_letter_count gauge',
    `notification_dead_letter_count ${queueStats.deadLetterCount}`,
    '',
    '# HELP notification_processed_total Total notification jobs successfully processed.',
    '# TYPE notification_processed_total counter',
    `notification_processed_total ${queueStats.metrics.totalProcessed}`,
    '',
    '# HELP notification_failed_total Total notification jobs that failed during dispatch.',
    '# TYPE notification_failed_total counter',
    `notification_failed_total ${queueStats.metrics.totalFailed}`,
    ''
  ].join('\n');

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.status(200).send(prometheusMetrics);
};

router.get('/metrics', handlePrometheusMetrics);
router.get('/', handlePrometheusMetrics);

module.exports = router;
