/**
 * Structured Production Logger
 * Formats all system logs as minified JSON in production for ELK / Datadog / CloudWatch ingestion.
 */

function formatLog(level, message, meta = {}) {
  const isProd = process.env.NODE_ENV === 'production';
  const timestamp = new Date().toISOString();

  if (isProd) {
    return JSON.stringify({
      timestamp,
      level,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...meta
    });
  }

  // Developer-friendly colored console output in local development
  const prefixMap = {
    info: 'ℹ️ [INFO]',
    warn: '⚠️ [WARN]',
    error: '❌ [ERROR]',
    debug: '🔍 [DEBUG]'
  };
  const prefix = prefixMap[level] || `[${level.toUpperCase()}]`;
  const metaStr = Object.keys(meta).length > 0 ? ` | Meta: ${JSON.stringify(meta)}` : '';
  return `${prefix} ${timestamp} - ${message}${metaStr}`;
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
  }
};

module.exports = logger;
