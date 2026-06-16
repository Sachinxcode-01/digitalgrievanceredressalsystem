const notificationRepository = require('../repositories/notificationRepository');

/**
 * Enterprise Notification Queue Service
 * Handles buffering and resilient retrying of emails/SMS with exponential backoff.
 * Logs execution, errors, and delivery metrics in PostgreSQL.
 */
class NotificationQueue {
  constructor() {
    this.queue = [];
    this.activeWorkers = 0;
    this.maxConcurrency = 10;
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
      dbLogId: null
    };
    
    this.queue.push(job);
    console.log(`[Notification Queue] Job ${job.id} [${type}] enqueued.`);
    this.processQueue();
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
    console.log(`[Notification Queue] Job ${job.id} [${job.type}] re-enqueued for retry.`);
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
   * Processes an individual job.
   */
  async processJob(job) {
    try {
      job.attempt++;

      // 1. Log or update status in Supabase table
      if (job.type === 'EMAIL') {
        if (!job.dbLogId) {
          try {
            const data = await notificationRepository.insertEmailLog({
              recipient: job.payload.to || 'unknown',
              subject: job.payload.subject || 'No Subject',
              event_type: job.payload.type || 'UNKNOWN',
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
      await job.taskFn();
      
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
      
      console.log(`[Notification Queue] Job ${job.id} dispatched successfully.`);
    } catch (err) {
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
        
        setTimeout(() => {
          this.enqueueWithId(job);
        }, backoffDelay);
      } else {
        console.error(`[Notification Queue] CRITICAL: Job ${job.id} exceeded maximum retries. Discarding job.`, job.payload);
      }
    }
  }
}

module.exports = new NotificationQueue();
