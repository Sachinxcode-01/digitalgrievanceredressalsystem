/* global describe, it, expect, beforeEach, jest */
const notificationQueue = require('../services/notificationQueue');
const notificationRepository = require('../repositories/notificationRepository');

// Mock repository calls so unit tests run deterministically in-memory
jest.mock('../repositories/notificationRepository', () => ({
  insertEmailLog: jest.fn().mockResolvedValue({ id: 'mock-log-id' }),
  updateEmailLog: jest.fn().mockResolvedValue(true)
}));

describe('Enterprise Notification Queue & Dead-Letter Handling', () => {
  beforeEach(() => {
    notificationQueue.reset();
    jest.clearAllMocks();
  });

  it('should successfully enqueue and dispatch a job', async () => {
    let executed = false;
    const task = async () => {
      executed = true;
    };

    const jobId = notificationQueue.enqueue(
      'EMAIL',
      { to: 'student@institution.edu', subject: 'Ticket Created' },
      task,
      3,
      10
    );

    expect(jobId).toMatch(/^JOB_/);
    
    // Wait for microtask tick
    await new Promise(r => setTimeout(r, 50));

    expect(executed).toBe(true);
    const metrics = notificationQueue.getMetrics();
    expect(metrics.metrics.totalProcessed).toBe(1);
    expect(metrics.deadLetterCount).toBe(0);
  });

  it('should retry a failed job and quarantine into Dead-Letter Queue after maxRetries', async () => {
    let attempts = 0;
    const failingTask = async () => {
      attempts++;
      throw new Error('SMTP Connection Timeout');
    };

    notificationQueue.enqueue(
      'EMAIL',
      { to: 'failing@institution.edu', subject: 'Emergency Alert' },
      failingTask,
      2, // maxRetries = 2
      10 // baseDelay = 10ms
    );

    // Wait for all retries: attempt 1 (0ms) -> attempt 2 (10ms) -> DLQ
    await new Promise(r => setTimeout(r, 100));

    expect(attempts).toBe(2);
    const dlq = notificationQueue.getDeadLetterJobs();
    expect(dlq.length).toBe(1);
    expect(dlq[0].recipient).toBe('failing@institution.edu');
    expect(dlq[0].finalError).toBe('SMTP Connection Timeout');

    const metrics = notificationQueue.getMetrics();
    expect(metrics.deadLetterCount).toBe(1);
    expect(metrics.metrics.totalDeadLettered).toBe(1);
  });

  it('should replay a quarantined dead-letter job upon admin request', async () => {
    let executedSuccessfully = false;
    let shouldFail = true;

    const recoverableTask = async () => {
      if (shouldFail) {
        throw new Error('Provider Rate Limit');
      }
      executedSuccessfully = true;
    };

    notificationQueue.enqueue(
      'SMS',
      { phone: '+919876543210', message: 'OTP: 123456' },
      recoverableTask,
      1,
      10
    );

    await new Promise(r => setTimeout(r, 50));

    // Should be in DLQ
    let dlq = notificationQueue.getDeadLetterJobs();
    expect(dlq.length).toBe(1);

    // Fix provider and re-drive dead letter
    shouldFail = false;
    const replayResult = notificationQueue.replayDeadLetterJob(dlq[0].id);
    expect(replayResult.success).toBe(true);

    await new Promise(r => setTimeout(r, 50));

    expect(executedSuccessfully).toBe(true);
    dlq = notificationQueue.getDeadLetterJobs();
    expect(dlq.length).toBe(0);
  });

  it('should provide complete telemetry health metrics', () => {
    const metrics = notificationQueue.getMetrics();
    expect(metrics).toHaveProperty('activeWorkers');
    expect(metrics).toHaveProperty('queuedJobsCount');
    expect(metrics).toHaveProperty('deadLetterCount');
    expect(metrics).toHaveProperty('maxConcurrency');
    expect(metrics).toHaveProperty('metrics');
    expect(metrics.metrics).toHaveProperty('totalEnqueued');
    expect(metrics.metrics).toHaveProperty('totalProcessed');
  });
});
