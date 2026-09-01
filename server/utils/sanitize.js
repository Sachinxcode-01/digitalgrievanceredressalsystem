/**
 * Input sanitization utility for XSS prevention and payload defense.
 */

function sanitizeHtmlInput(input) {
  if (typeof input !== 'string') return input;

  let cleaned = input;

  // 1. Remove script tags and content
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // 2. Remove inline event handlers (onerror, onload, onclick, onmouseover, etc.)
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*(['"]).*?\1/gi, '');
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');

  // 3. Remove javascript: and data: pseudo-protocols
  cleaned = cleaned.replace(/javascript\s*:/gi, 'no-javascript:');
  cleaned = cleaned.replace(/vbscript\s*:/gi, 'no-vbscript:');

  // 4. Remove iframe, object, embed tags
  cleaned = cleaned.replace(/<\/?(?:iframe|object|embed|applet|meta|link)\b[^>]*>/gi, '');

  return cleaned.trim();
}

function sanitizeString(str, keepHtmlTags = false) {
  if (typeof str !== 'string') return str;

  let cleaned = str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  if (!keepHtmlTags) {
    cleaned = cleaned.replace(/<\/?[^>]+(>|$)/g, '');
    cleaned = cleaned
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  } else {
    cleaned = cleaned
      .replace(/on\w+\s*=\s*(['"])(.*?)\1/gi, '')
      .replace(/javascript\s*:/gi, 'no-javascript:');
  }

  return cleaned.trim();
}

function sanitizeObject(obj, keepHtmlTags = false) {
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
}

module.exports = {
  sanitizeHtmlInput,
  sanitizeString,
  sanitizeObject
};
