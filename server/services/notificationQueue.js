const supabase = require('../config/supabase');

/**
 * Enterprise Notification Queue Service
 * Handles buffering and resilient retrying of emails/SMS with exponential backoff.
 * Logs execution, errors, and delivery metrics in PostgreSQL.
 */
class NotificationQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
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
   * Process the next job in the queue sequence.
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      try {
        job.attempt++;

        // 1. Log or update status in Supabase table (if Database is active)
        if (supabase && job.type === 'EMAIL') {
          if (!job.dbLogId) {
            try {
              const { data, error } = await supabase
                .from('email_logs')
                .insert([
                  {
                    recipient: job.payload.to || 'unknown',
                    subject: job.payload.subject || 'No Subject',
                    event_type: job.payload.type || 'UNKNOWN',
                    status: 'pending',
                    attempts: job.attempt,
                    max_attempts: job.maxRetries
                  }
                ])
                .select('id')
                .single();
              
              if (!error && data) {
                job.dbLogId = data.id;
              }
            } catch (err) {
              console.error('[Notification Queue] Failed to write database log:', err.message);
            }
          } else {
            // Update attempt count in log
            try {
              await supabase
                .from('email_logs')
                .update({ 
                  attempts: job.attempt, 
                  status: 'pending',
                  updated_at: new Date().toISOString() 
                })
                .eq('id', job.dbLogId);
            } catch (err) {
              console.error('[Notification Queue] Failed to update job attempt count:', err.message);
            }
          }
        }

        console.log(`[Notification Queue] Executing Job ${job.id} (Attempt ${job.attempt}/${job.maxRetries})`);
        
        // Execute the dispatch task
        await job.taskFn();
        
        // 2. Mark enqueued log as sent
        if (supabase && job.dbLogId) {
          try {
            await supabase
              .from('email_logs')
              .update({ 
                status: 'sent', 
                updated_at: new Date().toISOString() 
              })
              .eq('id', job.dbLogId);
          } catch (err) {
            console.error('[Notification Queue] Failed to mark job as sent:', err.message);
          }
        }
        
        console.log(`[Notification Queue] Job ${job.id} dispatched successfully.`);
      } catch (err) {
        console.error(`[Notification Queue] Job ${job.id} failed: ${err.message}`);
        
        const isPermanentFailure = job.attempt >= job.maxRetries;

        // 3. Mark enqueued log as failed or retrying
        if (supabase && job.dbLogId) {
          try {
            await supabase
              .from('email_logs')
              .update({ 
                status: isPermanentFailure ? 'failed' : 'retrying', 
                error_message: err.message,
                updated_at: new Date().toISOString() 
              })
              .eq('id', job.dbLogId);
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

    this.isProcessing = false;
  }
}

module.exports = new NotificationQueue();
