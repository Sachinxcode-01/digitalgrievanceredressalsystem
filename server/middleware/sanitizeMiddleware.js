/**
 * Input Sanitization Middleware
 * Recursively sanitizes all inputs (req.body, req.query, req.params)
 * by stripping script tags and other dangerous HTML tags to protect against XSS.
 */

const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;

  // 1. Strip <script>...</script> tags entirely
  let cleaned = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Strip standard HTML/XML tags
  cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '');

  // 3. Trim extra whitespace
  return cleaned.trim();
};

const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        return sanitizeObject(item);
      }
      return sanitizeString(item);
    });
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value);
        } else {
          sanitized[key] = sanitizeString(value);
        }
      }
    }
    return sanitized;
  }

  return sanitizeString(obj);
};

const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeInput
};
