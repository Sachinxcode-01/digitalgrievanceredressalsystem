/**
 * Enterprise Production In-Memory & Distributed Cache Manager
 * Provides high-throughput in-memory caching with TTL expiration,
 * key pattern invalidation, and hit/miss telemetry.
 */

class CacheManager {
  constructor(defaultTtlMs = 60 * 1000) {
    this.cache = new Map();
    this.defaultTtlMs = defaultTtlMs;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0
    };

    // Auto cleanup sweep every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.evictExpired();
    }, 2 * 60 * 1000);

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Set a cache entry with optional TTL
   */
  set(key, value, ttlMs = this.defaultTtlMs) {
    if (!key) return;
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now()
    });
    this.stats.sets++;
  }

  /**
   * Get a cached entry or null if expired/absent
   */
  get(key) {
    if (!key || !this.cache.has(key)) {
      this.stats.misses++;
      return null;
    }

    const entry = this.cache.get(key);
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Invalidate a single key or keys matching a regex/prefix
   */
  invalidate(keyOrPattern) {
    if (!keyOrPattern) return;

    if (typeof keyOrPattern === 'string' && !keyOrPattern.includes('*')) {
      if (this.cache.delete(keyOrPattern)) {
        this.stats.invalidations++;
      }
      return;
    }

    // Pattern / wildcard invalidation (e.g. 'public:track:*')
    const regex = keyOrPattern instanceof RegExp
      ? keyOrPattern
      : new RegExp('^' + keyOrPattern.replace(/\*/g, '.*') + '$');

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.stats.invalidations++;
      }
    }
  }

  /**
   * Evicts expired items
   */
  evictExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache telemetry metrics
   */
  getMetrics() {
    return {
      size: this.cache.size,
      ...this.stats,
      hitRate: (this.stats.hits + this.stats.misses > 0)
        ? (this.stats.hits / (this.stats.hits + this.stats.misses)).toFixed(2)
        : '0.00'
    };
  }
}

// Export singleton instance
const defaultCache = new CacheManager(2 * 60 * 1000); // 2 min default TTL
defaultCache.CacheManager = CacheManager;

module.exports = defaultCache;
