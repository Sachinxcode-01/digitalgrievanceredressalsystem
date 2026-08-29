/**
 * Database Query Resiliency Helper with Jittered Exponential Backoff
 * Transparently retries transient database queries on network hiccups,
 * socket resets, or 502/503/504 cloud gateway timeouts.
 */

const RETRYABLE_ERROR_CODES = [
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET'
];

const RETRYABLE_HTTP_STATUSES = [502, 503, 504, 408, 429];

/**
 * Checks if an error is considered a transient, retryable failure.
 * @param {Error|any} error
 * @returns {boolean}
 */
function isRetryableError(error) {
  if (!error) return false;

  const code = error.code || '';
  if (RETRYABLE_ERROR_CODES.includes(code)) return true;

  const message = (error.message || '').toLowerCase();
  if (
    message.includes('fetch failed') ||
    message.includes('socket hang up') ||
    message.includes('network error') ||
    message.includes('connection terminated') ||
    message.includes('timeout') ||
    message.includes('gateway')
  ) {
    return true;
  }

  const status = error.status || error.statusCode || (error.response && error.response.status);
  if (status && RETRYABLE_HTTP_STATUSES.includes(Number(status))) {
    return true;
  }

  return false;
}

/**
 * Executes a database operation with exponential backoff and jitter.
 * @template T
 * @param {() => Promise<T>} operation - Function returning the database promise
 * @param {number} [maxRetries=3] - Maximum retry attempts
 * @param {number} [baseDelayMs=300] - Base delay in milliseconds
 * @returns {Promise<T>}
 */
async function withDbRetry(operation, maxRetries = 3, baseDelayMs = 300) {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await operation();
    } catch (err) {
      attempt++;
      if (attempt > maxRetries || !isRetryableError(err)) {
        throw err;
      }

      // Exponential backoff: baseDelay * 2^(attempt-1) + random jitter (0 to 100ms)
      const jitter = Math.floor(Math.random() * 100);
      const delay = baseDelayMs * Math.pow(2, attempt - 1) + jitter;

      console.warn(
        `⚠️ [Database Resiliency] Transient error on attempt ${attempt}/${maxRetries}: "${err.message}". Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

module.exports = {
  withDbRetry,
  isRetryableError
};
