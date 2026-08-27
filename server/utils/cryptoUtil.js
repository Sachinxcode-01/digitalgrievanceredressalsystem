const crypto = require('crypto');

/**
 * Generate canonical SHA-256 hash digest for a grievance record
 * @param {Object} payload 
 * @returns {string} SHA-256 hex string
 */
function generateGrievanceHash(payload) {
  const canonicalData = {
    ticket_key: payload.ticket_key || payload.ticketKey || '',
    subject: (payload.subject || '').trim(),
    description: (payload.description || '').trim(),
    category: payload.category || '',
    created_at: payload.created_at || payload.createdAt || new Date().toISOString(),
    attachments: Array.isArray(payload.attachments) ? payload.attachments : []
  };

  const jsonString = JSON.stringify(canonicalData, Object.keys(canonicalData).sort());
  return crypto.createHash('sha256').update(jsonString).digest('hex');
}

/**
 * Generate 2-phase Whistleblower Passkey & Tracking Key
 * @returns {{ ticketKey: string, secretPasskey: string, combinedHash: string }}
 */
function generateAnonymousPasskey() {
  const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
  const ticketKey = `#ANON-2026-${randomHex}`;
  
  const bytes = crypto.randomBytes(9);
  const secretPasskey = bytes.toString('base64').replace(/[^a-zA-Z0-9]/g, 'X').substring(0, 12);
  
  const combinedHash = crypto
    .createHash('sha256')
    .update(`${ticketKey}:${secretPasskey}`)
    .digest('hex');

  return {
    ticketKey,
    secretPasskey,
    combinedHash
  };
}

/**
 * Verify if payload matches expected SHA-256 hash
 * @param {Object} payload 
 * @param {string} expectedHash 
 * @returns {boolean}
 */
function verifyGrievanceHash(payload, expectedHash) {
  if (!expectedHash) return false;
  const computedHash = generateGrievanceHash(payload);
  return computedHash.toLowerCase() === expectedHash.toLowerCase();
}

module.exports = {
  generateGrievanceHash,
  generateAnonymousPasskey,
  verifyGrievanceHash
};
