const Redis = require('ioredis');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const REDIS_URL = process.env.REDIS_URL;
let redisClient = null;
let isConnected = false;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) {
          console.warn('⚠️ [Redis] Reconnect retry limit exceeded. Disabling Redis state temporarily.');
          return null;
        }
        return Math.min(times * 200, 1000);
      }
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('⚡ [Redis] Successfully connected to distributed cache/queue instance.');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      console.warn('⚠️ [Redis Warning]:', err.message);
    });

    // Attempt non-blocking connection
    redisClient.connect().catch((err) => {
      console.warn('⚠️ [Redis] Initial connection attempt skipped (running in local fallback mode):', err.message);
    });
  } catch (err) {
    console.warn('⚠️ [Redis] Failed to initialize client:', err.message);
    redisClient = null;
  }
} else {
  // Standalone mode notification
  // When deploying multiple horizontal instances, supply REDIS_URL to share state across pods.
}

module.exports = {
  redisClient,
  isRedisConnected: () => isConnected && redisClient && redisClient.status === 'ready',
  isRedisEnabled: () => !!REDIS_URL
};
