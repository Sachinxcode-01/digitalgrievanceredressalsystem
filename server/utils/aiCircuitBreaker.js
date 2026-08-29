/**
 * AI Circuit Breaker & Resiliency Manager
 * Protects downstream services and ensures sub-second user responsiveness
 * by failing fast and using heuristic rule fallbacks during upstream LLM outages or rate limits.
 */

const CircuitState = {
  CLOSED: 'CLOSED',       // Normal operation — routing requests to AI provider
  OPEN: 'OPEN',           // Tripped — bypassing AI immediately to prevent latency
  HALF_OPEN: 'HALF_OPEN'  // Testing recovery — allowing a single probe request
};

class AiCircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.resetTimeoutMs = options.resetTimeoutMs || 60000; // 60 seconds cooldown
    this.timeoutMs = options.timeoutMs || 8000; // 8 seconds per request timeout

    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
  }

  /**
   * Returns the current state of the circuit breaker.
   * Automatically transitions from OPEN to HALF_OPEN when reset timeout has elapsed.
   */
  getState() {
    if (this.state === CircuitState.OPEN) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.lastStateChange = Date.now();
        console.log('🔄 [AI Circuit Breaker] Cooldown elapsed. Transitioning from OPEN to HALF_OPEN (probing AI).');
      }
    }
    return this.state;
  }

  /**
   * Records a successful AI execution and resets failure metrics.
   */
  recordSuccess() {
    this.failureCount = 0;
    this.successCount++;
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.lastStateChange = Date.now();
      console.log('✅ [AI Circuit Breaker] AI provider probe succeeded. Circuit reset to CLOSED (Normal).');
    }
  }

  /**
   * Records an AI failure, incrementing failure counter and tripping circuit if threshold reached.
   */
  recordFailure(error) {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    const errMsg = error?.message || 'Unknown error';

    if (this.state === CircuitState.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
      this.lastStateChange = Date.now();
      console.warn(
        `🚨 [AI Circuit Breaker] Failure threshold exceeded (${this.failureCount}/${this.failureThreshold}). ` +
        `Circuit is now OPEN for ${this.resetTimeoutMs / 1000}s. Error: "${errMsg}". Falling back to heuristics.`
      );
    }
  }

  /**
   * Wraps an asynchronous AI call with timeout and circuit breaker protection.
   * If circuit is OPEN, immediately executes fallbackFn without network delay.
   * 
   * @param {() => Promise<any>} aiFn - Async function calling AI model
   * @param {() => any} fallbackFn - Deterministic local fallback function
   * @returns {Promise<any>}
   */
  async execute(aiFn, fallbackFn) {
    const currentState = this.getState();

    // Fast-path heuristic fallback when circuit is OPEN
    if (currentState === CircuitState.OPEN) {
      if (typeof fallbackFn === 'function') {
        return fallbackFn();
      }
      return null;
    }

    try {
      // Execute AI function with strict timeout
      let timeoutHandle;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => {
          reject(new Error(`AI execution timed out after ${this.timeoutMs}ms`));
        }, this.timeoutMs);
      });

      const result = await Promise.race([aiFn(), timeoutPromise]);
      clearTimeout(timeoutHandle);

      if (result) {
        this.recordSuccess();
        return result;
      }

      // If AI returned null/empty, treat as soft failure
      this.recordFailure(new Error('AI provider returned empty response'));
      return typeof fallbackFn === 'function' ? fallbackFn() : null;
    } catch (err) {
      this.recordFailure(err);
      if (typeof fallbackFn === 'function') {
        return fallbackFn(err);
      }
      return null;
    }
  }

  /**
   * Returns diagnostic metrics for the admin health check dashboard.
   */
  getMetrics() {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      lastStateChange: new Date(this.lastStateChange).toISOString()
    };
  }

  /**
   * Resets the circuit breaker to clean CLOSED state (useful for tests and manual admin reset).
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
  }
}

// Global singleton instance
const aiCircuitBreaker = new AiCircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 60000,
  timeoutMs: 8000
});

module.exports = {
  AiCircuitBreaker,
  aiCircuitBreaker,
  CircuitState
};
