const { randomUUID } = require('crypto');

/**
 * Middleware to attach unique X-Request-ID correlation ID to every incoming request.
 * Allows end-to-end log tracing across microservices and database queries.
 */
function requestIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || req.headers['x-correlation-id'] || randomUUID();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

module.exports = {
  requestIdMiddleware
};
