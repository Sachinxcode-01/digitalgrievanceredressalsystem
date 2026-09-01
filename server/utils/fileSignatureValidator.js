/**
 * Binary Magic-Byte File Signature Validator & Filename Sanitizer
 * Zero-Trust verification of uploaded file buffers to prevent MIME-type spoofing
 * and directory traversal / shell execution attacks.
 */

const path = require('path');

// Common binary magic-byte signatures
const SIGNATURES = {
  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  PDF: [0x25, 0x50, 0x44, 0x46],
  // PNG: \x89PNG\r\n\x1a\n (0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  // JPEG / JPG: 0xFF 0xD8 0xFF
  JPEG: [0xFF, 0xD8, 0xFF],
  // GIF: GIF87a or GIF89a (0x47 0x49 0x46 0x38)
  GIF: [0x47, 0x49, 0x46, 0x38],
  // WebP: RIFF....WEBP (0x52 0x49 0x46 0x46 ... 0x57 0x45 0x42 0x50)
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46],
  WEBP_TAG: [0x57, 0x45, 0x42, 0x50],
  // ZIP / DOCX / XLSX / PPTX: PK\x03\x04 (0x50 0x4B 0x03 0x04)
  ZIP_OFFICE: [0x50, 0x4B, 0x03, 0x04],
  // Legacy MS Office (DOC): 0xD0 0xCF 0x11 0xE0 0xA1 0xB1 0x1A 0xE1
  OLE_DOC: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]
};

/**
 * Checks if buffer matches a specific signature at given offset
 */
function matchesSignature(buffer, signature, offset = 0) {
  if (!buffer || buffer.length < offset + signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[offset + i] !== signature[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Verifies if plain text buffer contains valid UTF-8/ASCII without suspicious null/binary control bytes
 */
function isValidTextBuffer(buffer) {
  if (!buffer || buffer.length === 0) return true;
  // Inspect the first 1024 bytes for null bytes or illegal control characters
  const sampleLength = Math.min(buffer.length, 1024);
  for (let i = 0; i < sampleLength; i++) {
    const byte = buffer[i];
    // Reject binary null bytes or unprintable non-whitespace ASCII control codes (< 0x09 or 0x0E-0x1F)
    if (byte === 0x00 || (byte < 0x09 && byte !== 0x00) || (byte > 0x0D && byte < 0x20)) {
      return false;
    }
  }
  return true;
}

/**
 * Validates the raw binary buffer against declared MIME type
 * @param {Buffer} buffer - File buffer
 * @param {string} declaredMime - Declared MIME type string
 * @returns {{ valid: boolean, detectedType: string, reason?: string }}
 */
function validateFileSignature(buffer, declaredMime) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { valid: false, detectedType: 'empty', reason: 'Uploaded file payload is empty or invalid buffer.' };
  }

  const mime = (declaredMime || '').toLowerCase().trim();

  // 1. PDF Validation
  if (mime === 'application/pdf') {
    if (matchesSignature(buffer, SIGNATURES.PDF)) {
      return { valid: true, detectedType: 'application/pdf' };
    }
    return { valid: false, detectedType: 'unknown', reason: 'File content does not match genuine PDF header signature (%PDF).' };
  }

  // 2. PNG Validation
  if (mime === 'image/png') {
    if (matchesSignature(buffer, SIGNATURES.PNG)) {
      return { valid: true, detectedType: 'image/png' };
    }
    return { valid: false, detectedType: 'unknown', reason: 'File content does not match genuine PNG header signature.' };
  }

  // 3. JPEG Validation
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    if (matchesSignature(buffer, SIGNATURES.JPEG)) {
      return { valid: true, detectedType: 'image/jpeg' };
    }
    return { valid: false, detectedType: 'unknown', reason: 'File content does not match genuine JPEG/JPG header signature.' };
  }

  // 4. GIF Validation
  if (mime === 'image/gif') {
    if (matchesSignature(buffer, SIGNATURES.GIF)) {
      return { valid: true, detectedType: 'image/gif' };
    }
    return { valid: false, detectedType: 'unknown', reason: 'File content does not match genuine GIF header signature.' };
  }

  // 5. WebP Validation (RIFF....WEBP)
  if (mime === 'image/webp') {
    if (matchesSignature(buffer, SIGNATURES.WEBP_RIFF, 0) && matchesSignature(buffer, SIGNATURES.WEBP_TAG, 8)) {
      return { valid: true, detectedType: 'image/webp' };
    }
    return { valid: false, detectedType: 'unknown', reason: 'File content does not match genuine WebP header signature (RIFF/WEBP).' };
  }

  // 6. Word DOCX or Modern Office XML
  if (
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/zip'
  ) {
    if (matchesSignature(buffer, SIGNATURES.ZIP_OFFICE)) {
      return { valid: true, detectedType: mime };
    }
    return { valid: false, detectedType: 'unknown', reason: 'File content does not match OpenXML/ZIP archive container signature.' };
  }

  // 7. Legacy Word DOC
  if (mime === 'application/msword') {
    if (matchesSignature(buffer, SIGNATURES.OLE_DOC)) {
      return { valid: true, detectedType: 'application/msword' };
    }
    return { valid: false, detectedType: 'unknown', reason: 'File content does not match genuine MS Word OLE container signature.' };
  }

  // 8. Plain Text
  if (mime === 'text/plain') {
    if (isValidTextBuffer(buffer)) {
      return { valid: true, detectedType: 'text/plain' };
    }
    return { valid: false, detectedType: 'binary', reason: 'Plain text file contains illegal binary control characters or null bytes.' };
  }

  return {
    valid: false,
    detectedType: 'unsupported',
    reason: `Unsupported or unrecognized MIME type: ${declaredMime}`
  };
}

/**
 * Sanitizes a filename to prevent path traversal, null byte attacks, and illegal shell characters.
 * @param {string} originalName
 * @param {string} fallbackPrefix
 * @returns {string} Sanitized safe filename
 */
function sanitizeFileName(originalName, fallbackPrefix = 'file') {
  if (!originalName || typeof originalName !== 'string') {
    return `${fallbackPrefix}_${Date.now()}`;
  }

  // Remove null bytes
  let safe = originalName.replace(/\0/g, '');

  // Normalize backslashes to forward slashes for cross-platform compatibility (Windows & POSIX)
  safe = safe.replace(/\\/g, '/');

  // Strip path directories (basename only)
  safe = path.posix.basename(safe);

  // Remove any remaining path traversal sequences ('..')
  safe = safe.replace(/\.\.+/g, '');

  // Remove dangerous characters (control chars, shell special chars: \ / : * ? " < > | ` $ ; &)
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Strip leading dots to prevent hidden files
  safe = safe.replace(/^\.+/, '');

  // If filename is now empty or only extension, fallback
  if (!safe || safe === '' || safe.startsWith('.')) {
    safe = `${fallbackPrefix}_${Date.now()}${safe.startsWith('.') ? safe : ''}`;
  }

  // Limit length
  if (safe.length > 100) {
    const ext = path.extname(safe);
    const base = path.basename(safe, ext).substring(0, 90);
    safe = `${base}${ext}`;
  }

  return safe;
}

/**
 * Express middleware to validate req.file after multer parses it in memory
 */
function fileSignatureMiddleware(req, res, next) {
  if (!req.file) {
    return next();
  }

  const { valid, reason } = validateFileSignature(req.file.buffer, req.file.mimetype);
  if (!valid) {
    return res.status(400).json({
      success: false,
      error: 'Security Validation Failed: File signature does not match declared MIME type.',
      details: reason
    });
  }

  // Sanitize the original name on the file object
  req.file.sanitizedOriginalName = sanitizeFileName(req.file.originalname);
  next();
}

module.exports = {
  validateFileSignature,
  sanitizeFileName,
  fileSignatureMiddleware,
  SIGNATURES
};
