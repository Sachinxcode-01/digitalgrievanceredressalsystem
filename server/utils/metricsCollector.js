/**
 * Enterprise Production Metrics & Telemetry Collector
 * Collects runtime system health, HTTP request durations, database latencies,
 * AI circuit breaker metrics, and notification queue statistics.
 * Exports both Prometheus exposition format and JSON format for Datadog / Grafana.
 */

const os = require('os');
const { aiCircuitBreaker } = require('./aiCircuitBreaker');
const notificationQueue = require('../services/notificationQueue');
const { isRedisConnected } = require('../config/redisClient');

class MetricsCollector {
  constructor() {
    this.startTime = Date.now();
    this.requestsTotal = 0;
    this.statusCodes = {
      '2xx': 0,
      '3xx': 0,
      '4xx': 0,
      '5xx': 0
    };
    this.latencies = [];
    this.maxLatencySamples = 1000;
  }

  /**
   * Express middleware to capture request metrics.
   */
  middleware() {
    return (req, res, next) => {
      const start = Date.now();
      this.requestsTotal++;

      res.on('finish', () => {
        const duration = Date.now() - start;
        const statusCode = res.statusCode;

        if (statusCode >= 200 && statusCode < 300) this.statusCodes['2xx']++;
        else if (statusCode >= 300 && statusCode < 400) this.statusCodes['3xx']++;
        else if (statusCode >= 400 && statusCode < 500) this.statusCodes['4xx']++;
        else if (statusCode >= 500) this.statusCodes['5xx']++;

        this.latencies.push(duration);
        if (this.latencies.length > this.maxLatencySamples) {
          this.latencies.shift();
        }
      });

      next();
    };
  }

  /**
   * Calculates percentile latency from samples.
   */
  getPercentile(percentile) {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Returns snapshot of operational metrics in JSON format.
   */
  getMetricsSnapshot() {
    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const aiMetrics = aiCircuitBreaker.getMetrics();
    const queueMetrics = notificationQueue.getMetrics();

    return {
      timestamp: new Date().toISOString(),
      uptime_seconds: uptimeSeconds,
      system: {
        node_version: process.version,
        platform: process.platform,
        cpu_count: os.cpus().length,
        free_memory_mb: Math.round(os.freemem() / (1024 * 1024)),
        total_memory_mb: Math.round(os.totalmem() / (1024 * 1024))
      },
      process: {
        rss_mb: Math.round(memoryUsage.rss / (1024 * 1024)),
        heap_used_mb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        heap_total_mb: Math.round(memoryUsage.heapTotal / (1024 * 1024))
      },
      http: {
        total_requests: this.requestsTotal,
        status_codes: { ...this.statusCodes },
        latency_p50_ms: this.getPercentile(50),
        latency_p95_ms: this.getPercentile(95),
        latency_p99_ms: this.getPercentile(99)
      },
      ai_circuit_breaker: aiMetrics,
      notification_queue: queueMetrics,
      redis: {
        connected: isRedisConnected()
      }
    };
  }

  /**
   * Generates standard Prometheus exposition format.
   */
  toPrometheusFormat() {
    const s = this.getMetricsSnapshot();
    return [
      '# HELP resolvenow_uptime_seconds Total application uptime in seconds',
      '# TYPE resolvenow_uptime_seconds gauge',
      `resolvenow_uptime_seconds ${s.uptime_seconds}`,
      '',
      '# HELP resolvenow_http_requests_total Total HTTP requests handled',
      '# TYPE resolvenow_http_requests_total counter',
      `resolvenow_http_requests_total ${s.http.total_requests}`,
      `resolvenow_http_requests_total{status="2xx"} ${s.http.status_codes['2xx']}`,
      `resolvenow_http_requests_total{status="3xx"} ${s.http.status_codes['3xx']}`,
      `resolvenow_http_requests_total{status="4xx"} ${s.http.status_codes['4xx']}`,
      `resolvenow_http_requests_total{status="5xx"} ${s.http.status_codes['5xx']}`,
      '',
      '# HELP resolvenow_http_latency_ms HTTP request latency percentiles',
      '# TYPE resolvenow_http_latency_ms gauge',
      `resolvenow_http_latency_ms{quantile="0.5"} ${s.http.latency_p50_ms}`,
      `resolvenow_http_latency_ms{quantile="0.95"} ${s.http.latency_p95_ms}`,
      `resolvenow_http_latency_ms{quantile="0.99"} ${s.http.latency_p99_ms}`,
      '',
      '# HELP resolvenow_memory_heap_used_bytes Heap memory used by Node.js process',
      '# TYPE resolvenow_memory_heap_used_bytes gauge',
      `resolvenow_memory_heap_used_bytes ${process.memoryUsage().heapUsed}`,
      '',
      '# HELP resolvenow_ai_circuit_state Current state of the AI circuit breaker (0=CLOSED, 1=HALF_OPEN, 2=OPEN)',
      '# TYPE resolvenow_ai_circuit_state gauge',
      `resolvenow_ai_circuit_state ${s.ai_circuit_breaker.state === 'CLOSED' ? 0 : s.ai_circuit_breaker.state === 'HALF_OPEN' ? 1 : 2}`,
      '',
      '# HELP resolvenow_queue_depth Active jobs buffered in notification queue',
      '# TYPE resolvenow_queue_depth gauge',
      `resolvenow_queue_depth ${s.notification_queue.queuedJobsCount}`,
      `resolvenow_dead_letter_depth ${s.notification_queue.deadLetterCount}`
    ].join('\n');
  }
}

const metricsCollector = new MetricsCollector();

module.exports = {
  metricsCollector
};
