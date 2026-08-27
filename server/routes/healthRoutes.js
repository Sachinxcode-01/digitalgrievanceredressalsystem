const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

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

module.exports = router;
