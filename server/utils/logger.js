/**
 * Enterprise Production Logger & PII Sanitizer
 * Automatically redacts sensitive authentication, personal, and financial data
 * Formats structured JSON in production for CloudWatch / Datadog / ELK ingestion.
 */

// Sensitive keys to redact completely
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'jwt',
  'authorization',
  'auth_token',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'otp',
  'otp_code',
  'secret',
  'secret_passkey',
  'creditcard',
  'credit_card',
  'cardnumber',
  'cvv',
  'aadhaar',
  'ssn'
]);

/**
 * Recursively scans and sanitizes objects to prevent PII / secret leakage into logs.
 * @param {any} target - Data to sanitize
 * @param {number} depth - Recursion limit to avoid cyclical loops
 * @returns {any} Sanitized clone of the data
 */
function redactPII(target, depth = 0) {
  if (depth > 6 || target === null || target === undefined) {
    return target;
  }

  if (typeof target === 'string') {
    // Mask Bearer tokens if present in raw strings
    if (/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/i.test(target)) {
      return target.replace(/Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/gi, 'Bearer [REDACTED_JWT]');
    }
    return target;
  }

  if (Array.isArray(target)) {
    return target.map(item => redactPII(item, depth + 1));
  }

  if (typeof target === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(target)) {
      const lowerKey = key.toLowerCase().replace(/[-_]/g, '');

      // Check if key is in sensitive list
      if ([...SENSITIVE_KEYS].some(k => lowerKey.includes(k.replace(/[-_]/g, '')))) {
        sanitized[key] = '[REDACTED]';
      } else if (lowerKey.includes('mobile') || lowerKey.includes('phone')) {
        // Mask phone numbers: preserve country code and last 4 digits
        const phoneStr = String(value || '');
        if (phoneStr.length >= 10) {
          sanitized[key] = phoneStr.slice(0, 3) + '******' + phoneStr.slice(-4);
        } else {
          sanitized[key] = '[MASKED_PHONE]';
        }
      } else {
        sanitized[key] = redactPII(value, depth + 1);
      }
    }
    return sanitized;
  }

  return target;
}

function formatLog(level, message, meta = {}) {
  const isProd = process.env.NODE_ENV === 'production';
  const timestamp = new Date().toISOString();
  const sanitizedMeta = redactPII(meta);
  const sanitizedMsg = typeof message === 'string' ? redactPII(message) : redactPII(message);

  if (isProd) {
    return JSON.stringify({
      timestamp,
      level,
      message: typeof sanitizedMsg === 'string' ? sanitizedMsg : JSON.stringify(sanitizedMsg),
      ...sanitizedMeta
    });
  }

  // Developer-friendly colored console output in local development
  const prefixMap = {
    info: 'ℹ️ [INFO]',
    warn: '⚠️ [WARN]',
    error: '❌ [ERROR]',
    debug: '🔍 [DEBUG]',
    http: '🌐 [HTTP]'
  };
  const prefix = prefixMap[level] || `[${level.toUpperCase()}]`;
  const metaStr = Object.keys(sanitizedMeta).length > 0 ? ` | Meta: ${JSON.stringify(sanitizedMeta)}` : '';
  return `${prefix} ${timestamp} - ${sanitizedMsg}${metaStr}`;
}

const logger = {
  info(message, meta) {
    console.log(formatLog('info', message, meta));
  },
  warn(message, meta) {
    console.warn(formatLog('warn', message, meta));
  },
  error(message, meta) {
    console.error(formatLog('error', message, meta));
  },
  debug(message, meta) {
    if (process.env.DEBUG === 'true' || process.env.NODE_ENV !== 'production') {
      console.log(formatLog('debug', message, meta));
    }
  },
  http(message, meta) {
    console.log(formatLog('http', message, meta));
  },
  redactPII
};

/**
 * Express HTTP Request Logger Middleware
 * Logs incoming API requests with sanitized parameters, response codes, and latency in ms.
 */
const httpLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log on response completion
  res.on('finish', () => {
    // Skip noisy static asset / health polling logs
    if (req.originalUrl.startsWith('/assets/') || req.originalUrl === '/api/v1/health/liveness' || req.originalUrl === '/metrics') {
      return;
    }

    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';

    const logPayload = {
      requestId: req.id || req.headers['x-request-id'] || 'no-trace-id',
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      durationMs: duration,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.headers['user-agent']
    };

    if (level === 'error') {
      logger.error(`HTTP ${req.method} ${req.originalUrl} ${statusCode} (${duration}ms)`, logPayload);
    } else if (level === 'warn') {
      logger.warn(`HTTP ${req.method} ${req.originalUrl} ${statusCode} (${duration}ms)`, logPayload);
    } else {
      logger.http(`HTTP ${req.method} ${req.originalUrl} ${statusCode} (${duration}ms)`, logPayload);
    }
  });

  next();
};

module.exports = {
  ...logger,
  httpLoggerMiddleware
};
