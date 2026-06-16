/**
 * Input Sanitization Middleware
 * Recursively sanitizes all inputs (req.body, req.query, req.params)
 * by stripping script tags and other dangerous HTML tags to protect against XSS.
 */

const sanitizeString = (str, keepHtmlTags = false) => {
  if (typeof str !== 'string') return str;

  // 1. Strip <script>...</script> tags entirely
  let cleaned = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  if (!keepHtmlTags) {
    // 2. Strip standard HTML/XML tags
    cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '');
    
    // 3. Escape HTML special characters
    cleaned = cleaned
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  } else {
    // 4. If keeping tags (email templates), strip event handlers and javascript: schemes
    cleaned = cleaned
      .replace(/on\w+\s*=\s*(['"])(.*?)\1/gi, '')
      .replace(/javascript\s*:/gi, 'no-javascript:');
  }

  return cleaned.trim();
};

const sanitizeObject = (obj, keepHtmlTags = false) => {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        return sanitizeObject(item, keepHtmlTags);
      }
      return sanitizeString(item, keepHtmlTags);
    });
  }

  if (typeof obj === 'object') {
    const sanitized = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = sanitizeObject(value, keepHtmlTags);
        } else {
          sanitized[key] = sanitizeString(value, keepHtmlTags);
        }
      }
    }
    return sanitized;
  }

  return sanitizeString(obj, keepHtmlTags);
};

const sanitizeInput = (req, res, next) => {
  const isEmailTemplateRoute = req.originalUrl && req.originalUrl.includes('/settings/templates/email');

  if (req.body) req.body = sanitizeObject(req.body, isEmailTemplateRoute);
  if (req.query) req.query = sanitizeObject(req.query, isEmailTemplateRoute);
  if (req.params) req.params = sanitizeObject(req.params, isEmailTemplateRoute);
  next();
};

module.exports = {
  sanitizeString,
  sanitizeObject,
  sanitizeInput
};
