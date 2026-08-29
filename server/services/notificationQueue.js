const notificationRepository = require('../repositories/notificationRepository');

/**
 * Enterprise Notification Queue Service with Dead-Letter Queue (DLQ)
 * Handles buffering and resilient retrying of emails/SMS with exponential backoff.
 * Logs execution, errors, and delivery metrics in PostgreSQL.
 */
class NotificationQueue {
  constructor(options = {}) {
    this.queue = [];
    this.deadLetterQueue = [];
    this.activeWorkers = 0;
    this.maxConcurrency = options.maxConcurrency || 10;
    this.maxDeadLetterSize = options.maxDeadLetterSize || 100;

    // Telemetry counters
    this.metrics = {
      totalEnqueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      totalRetried: 0,
      totalDeadLettered: 0,
      startedAt: new Date().toISOString()
    };
  }

  /**
   * Enqueues a notification job.
   * @param {string} type - 'EMAIL' or 'SMS'
   * @param {Object} payload - Recipient & payload data for logging
   * @param {Function} taskFn - The actual async function executing the notification dispatch
   * @param {number} maxRetries - Maximum retry limit
   * @param {number} baseDelayMs - Base delay for exponential backoff (defaults to 5s)
   */
  enqueue(type, payload, taskFn, maxRetries = 3, baseDelayMs = 5000) {
    const job = {
      id: 'JOB_' + Math.random().toString(36).substring(7).toUpperCase(),
      type,
      payload,
      taskFn,
      maxRetries,
      attempt: 0,
      baseDelayMs,
      dbLogId: null,
      enqueuedAt: new Date().toISOString(),
      lastError: null
    };
    
    this.queue.push(job);
    this.metrics.totalEnqueued++;
    console.log(`[Notification Queue] Job ${job.id} [${type}] enqueued. (Queue size: ${this.queue.length})`);
    this.processQueue();
    return job.id;
  }

  /**
   * Re-enqueues an existing job with its database log ID preserved.
   */
  enqueueWithId(oldJob) {
    const job = {
      ...oldJob,
      id: 'JOB_' + Math.random().toString(36).substring(7).toUpperCase(),
    };
    this.queue.push(job);
    this.metrics.totalRetried++;
    console.log(`[Notification Queue] Job ${job.id} [${job.type}] re-enqueued for retry attempt ${job.attempt + 1}.`);
    this.processQueue();
  }

  /**
   * Process jobs in the queue concurrently up to the concurrency limit.
   */
  async processQueue() {
    if (this.queue.length === 0) return;
    if (this.activeWorkers >= this.maxConcurrency) return;

    while (this.queue.length > 0 && this.activeWorkers < this.maxConcurrency) {
      const job = this.queue.shift();
      this.activeWorkers++;
      this.processJob(job).finally(() => {
        this.activeWorkers--;
        this.processQueue();
      });
    }
  }

  /**
   * Processes an individual job with error capture and exponential retry.
   */
  async processJob(job) {
    try {
      job.attempt++;

      // 1. Log or update status in Supabase table
      if (job.type === 'EMAIL') {
        if (!job.dbLogId) {
          try {
            const data = await notificationRepository.insertEmailLog({
              recipient: job.payload?.to || 'unknown',
              subject: job.payload?.subject || 'No Subject',
              event_type: job.payload?.type || 'UNKNOWN',
              status: 'pending',
              attempts: job.attempt,
              max_attempts: job.maxRetries
            });
            
            if (data) {
              job.dbLogId = data.id;
            }
          } catch (err) {
            console.error('[Notification Queue] Failed to write database log:', err.message);
          }
        } else {
          // Update attempt count in log
          try {
            await notificationRepository.updateEmailLog(job.dbLogId, { 
              attempts: job.attempt, 
              status: 'pending',
              updated_at: new Date().toISOString() 
            });
          } catch (err) {
            console.error('[Notification Queue] Failed to update job attempt count:', err.message);
          }
        }
      }

      console.log(`[Notification Queue] Executing Job ${job.id} (Attempt ${job.attempt}/${job.maxRetries})`);
      
      // Execute the dispatch task
      if (typeof job.taskFn === 'function') {
        await job.taskFn();
      }
      
      // 2. Mark enqueued log as sent
      if (job.dbLogId) {
        try {
          await notificationRepository.updateEmailLog(job.dbLogId, { 
            status: 'sent', 
            updated_at: new Date().toISOString() 
          });
        } catch (err) {
          console.error('[Notification Queue] Failed to mark job as sent:', err.message);
        }
      }
      
      this.metrics.totalProcessed++;
      console.log(`[Notification Queue] Job ${job.id} dispatched successfully.`);
    } catch (err) {
      job.lastError = err.message;
      this.metrics.totalFailed++;
      console.error(`[Notification Queue] Job ${job.id} failed: ${err.message}`);
      
      const isPermanentFailure = job.attempt >= job.maxRetries;

      // 3. Mark enqueued log as failed or retrying
      if (job.dbLogId) {
        try {
          await notificationRepository.updateEmailLog(job.dbLogId, { 
            status: isPermanentFailure ? 'failed' : 'retrying', 
            error_message: err.message,
            updated_at: new Date().toISOString() 
          });
        } catch (dbErr) {
          console.error('[Notification Queue] Failed to log failure status:', dbErr.message);
        }
      }

      if (!isPermanentFailure) {
        // Calculate exponential backoff delay: baseDelay * 2^(attempt - 1)
        const backoffDelay = job.baseDelayMs * Math.pow(2, job.attempt - 1);
        console.warn(`[Notification Queue] Scheduling retry for Job ${job.id} in ${backoffDelay / 1000} seconds.`);
        
        const retryTimer = setTimeout(() => {
          this.enqueueWithId(job);
        }, backoffDelay);
        if (retryTimer && typeof retryTimer.unref === 'function') {
          retryTimer.unref();
        }
      } else {
        // Move to Dead-Letter Queue (DLQ) for administrative inspection & replay
        this.metrics.totalDeadLettered++;
        const dlqEntry = {
          ...job,
          failedAt: new Date().toISOString(),
          finalError: err.message
        };

        this.deadLetterQueue.unshift(dlqEntry);
        if (this.deadLetterQueue.length > this.maxDeadLetterSize) {
          this.deadLetterQueue.pop();
        }

        console.error(
          `[Notification Queue] 💀 CRITICAL: Job ${job.id} moved to Dead-Letter Queue (DLQ) after ${job.attempt} failed attempts. ` +
          `Recipient: ${job.payload?.to || 'unknown'}, Error: "${err.message}"`
        );
      }
    }
  }

  /**
   * Retrieves all quarantined dead-letter jobs.
   */
  getDeadLetterJobs() {
    return this.deadLetterQueue.map(job => ({
      id: job.id,
      type: job.type,
      recipient: job.payload?.to || job.payload?.phone || 'unknown',
      subject: job.payload?.subject || 'N/A',
      attempts: job.attempt,
      maxRetries: job.maxRetries,
      enqueuedAt: job.enqueuedAt,
      failedAt: job.failedAt,
      finalError: job.finalError
    }));
  }

  /**
   * Replays a quarantined dead-letter job by re-enqueuing with reset attempts.
   * @param {string} jobId
   */
  replayDeadLetterJob(jobId) {
    const idx = this.deadLetterQueue.findIndex(j => j.id === jobId);
    if (idx === -1) {
      return { success: false, message: `Job ${jobId} not found in Dead-Letter Queue.` };
    }

    const [job] = this.deadLetterQueue.splice(idx, 1);
    job.attempt = 0;
    job.lastError = null;
    this.enqueue(job.type, job.payload, job.taskFn, job.maxRetries, job.baseDelayMs);

    return {
      success: true,
      message: `Job ${jobId} successfully re-enqueued for dispatch.`,
      jobId: job.id
    };
  }

  /**
   * Clears the Dead-Letter Queue.
   */
  clearDeadLetterQueue() {
    const count = this.deadLetterQueue.length;
    this.deadLetterQueue = [];
    return { success: true, clearedCount: count };
  }

  /**
   * Returns live diagnostic metrics for admin dashboard telemetry.
   */
  getMetrics() {
    return {
      activeWorkers: this.activeWorkers,
      queuedJobsCount: this.queue.length,
      deadLetterCount: this.deadLetterQueue.length,
      maxConcurrency: this.maxConcurrency,
      metrics: { ...this.metrics }
    };
  }

  /**
   * Reset internal queue state (useful for test suites).
   */
  reset() {
    this.queue = [];
    this.deadLetterQueue = [];
    this.activeWorkers = 0;
    this.metrics = {
      totalEnqueued: 0,
      totalProcessed: 0,
      totalFailed: 0,
      totalRetried: 0,
      totalDeadLettered: 0,
      startedAt: new Date().toISOString()
    };
  }
}

// Global singleton instance
const notificationQueue = new NotificationQueue({
  maxConcurrency: 10,
  maxDeadLetterSize: 200
});

module.exports = notificationQueue;
