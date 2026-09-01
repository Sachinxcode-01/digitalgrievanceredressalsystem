const crypto = require('crypto');

/**
 * Immutable Audit Hash Chain Utility
 * Computes cryptographically linked SHA-256 blocks for grievance state progression.
 */

function generateRecordHash(record, previousHash = '0000000000000000000000000000000000000000000000000000000000000000') {
  const canonical = {
    ticket_id: record.ticket_id || record.ticketId || '',
    status: record.status || '',
    user_id: record.user_id || record.userId || '',
    updated_at: record.updated_at || record.timestamp || new Date().toISOString(),
    previous_hash: previousHash
  };

  const payloadString = JSON.stringify(canonical, Object.keys(canonical).sort());
  return crypto.createHash('sha256').update(payloadString).digest('hex');
}

function verifyAuditHash(record, expectedHash, previousHash) {
  if (!expectedHash) return false;
  const computed = generateRecordHash(record, previousHash);
  return computed.toLowerCase() === expectedHash.toLowerCase();
}

const auditHashChain = {
  generateRecordHash,
  verifyAuditHash
};

module.exports = {
  auditHashChain,
  generateRecordHash,
  verifyAuditHash
};
