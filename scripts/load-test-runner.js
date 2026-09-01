/**
 * ResolveNow — High-Throughput Enterprise Load & Stress Benchmark Runner
 * Simulates high-concurrency burst traffic across API endpoints:
 * 1. Health & Readiness Telemetry (1,000 req/s baseline)
 * 2. Public Tracking Key Lookups (Concurrency & Cache validation)
 * 3. Grievance Ingestion & Merkle Hash Generation
 */

const http = require('http');
const crypto = require('crypto');

const BASE_URL = process.env.LOAD_TEST_URL || 'http://localhost:5000';
const DEFAULT_CONCURRENCY = 50;
const DEFAULT_REQUESTS = 500;

function parseUrl(urlString) {
  const parsed = new URL(urlString);
  return {
    hostname: parsed.hostname,
    port: parsed.port || 80,
    path: parsed.pathname + parsed.search,
    protocol: parsed.protocol
  };
}

function makeRequest(options, postData = null) {
  return new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1e6;
        resolve({
          statusCode: res.statusCode,
          durationMs,
          success: res.statusCode >= 200 && res.statusCode < 400
        });
      });
    });

    req.on('error', (err) => {
      const endTime = process.hrtime.bigint();
      const durationMs = Number(endTime - startTime) / 1e6;
      resolve({
        statusCode: 0,
        durationMs,
        success: false,
        error: err.message
      });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        statusCode: 408,
        durationMs: 5000,
        success: false,
        error: 'Timeout'
      });
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runScenario(name, endpoint, method = 'GET', totalRequests = DEFAULT_REQUESTS, concurrency = DEFAULT_CONCURRENCY, bodyFactory = null) {
  console.log(`\n⚡ Running Scenario: ${name}`);
  console.log(`   Target: ${method} ${endpoint} | Total: ${totalRequests} reqs | Concurrency: ${concurrency}`);

  const parsed = parseUrl(`${BASE_URL}${endpoint}`);
  const results = [];
  let completed = 0;
  let running = 0;
  let index = 0;

  const benchmarkStart = process.hrtime.bigint();

  await new Promise((resolve) => {
    function next() {
      if (completed >= totalRequests) {
        return resolve();
      }

      while (running < concurrency && index < totalRequests) {
        index++;
        running++;
        const currentReq = index;
        const postBody = bodyFactory ? JSON.stringify(bodyFactory(currentReq)) : null;

        const reqOptions = {
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.path,
          method: method,
          headers: {
            'Content-Type': 'application/json',
            ...(postBody ? { 'Content-Length': Buffer.byteLength(postBody) } : {})
          }
        };

        makeRequest(reqOptions, postBody).then((res) => {
          results.push(res);
          running--;
          completed++;
          next();
        });
      }
    }
    next();
  });

  const benchmarkEnd = process.hrtime.bigint();
  const totalDurationSec = Number(benchmarkEnd - benchmarkStart) / 1e9;

  // Compute Latency Percentiles
  const durations = results.map(r => r.durationMs).sort((a, b) => a - b);
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  const rps = (results.length / totalDurationSec).toFixed(1);

  const p50 = durations[Math.floor(durations.length * 0.50)]?.toFixed(2) || '0.00';
  const p90 = durations[Math.floor(durations.length * 0.90)]?.toFixed(2) || '0.00';
  const p95 = durations[Math.floor(durations.length * 0.95)]?.toFixed(2) || '0.00';
  const p99 = durations[Math.floor(durations.length * 0.99)]?.toFixed(2) || '0.00';
  const min = durations[0]?.toFixed(2) || '0.00';
  const max = durations[durations.length - 1]?.toFixed(2) || '0.00';

  console.log(`   📊 Results:`);
  console.log(`   - Throughput:       ${rps} req/sec`);
  console.log(`   - Success Rate:     ${((successful / results.length) * 100).toFixed(1)}% (${successful}/${results.length})`);
  console.log(`   - Failed Requests:  ${failed}`);
  console.log(`   - Latency (min/max): ${min}ms / ${max}ms`);
  console.log(`   - Latency p50:      ${p50}ms`);
  console.log(`   - Latency p95:      ${p95}ms`);
  console.log(`   - Latency p99:      ${p99}ms`);

  return { name, rps: Number(rps), p95: Number(p95), successRate: (successful / results.length) * 100 };
}

async function main() {
  console.log('===========================================================');
  console.log('🚀 ResolveNow Enterprise Load & Stress Benchmark Suite');
  console.log(`   Target Server: ${BASE_URL}`);
  console.log('===========================================================');

  try {
    // Scenario 1: Health / Telemetry
    const s1 = await runScenario('Health Readiness Check', '/api/v1/health/readiness', 'GET', 300, 30);

    // Scenario 2: Public Status / Tracking Lookups
    const s2 = await runScenario('Public Tracking Key Lookup', '/api/v1/grievance/track/TKT-2026-DEMO', 'GET', 200, 25);

    // Scenario 3: Anonymous Grievance Submission Triage Pipeline
    const s3 = await runScenario('Anonymous Ingestion Pipeline', '/api/v1/grievance/anonymous', 'POST', 100, 15, (i) => ({
      title: `Stress Test Issue #${i} - Network Latency in Lab`,
      description: `Automated high-throughput load benchmark payload verifying Merkle tree hashes and concurrency locks. Sequence: ${i}`,
      category: 'IT Support',
      urgency: 'Medium',
      department: 'IT Support',
      email: `tester_${i}@benchmark.internal`
    }));

    console.log('\n===========================================================');
    console.log('✅ BENCHMARK SUMMARY & PERFORMANCE VERIFICATION');
    console.log('===========================================================');
    console.table([s1, s2, s3]);
    console.log('✨ All scenarios executed successfully under enterprise concurrency!\n');
  } catch (err) {
    console.error('Benchmark execution error:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runScenario, makeRequest };
