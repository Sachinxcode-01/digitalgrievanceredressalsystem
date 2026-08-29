/**
 * Automated Production Database Backup Script
 * Exports full tabular data snapshots, compresses them via Gzip,
 * and maintains a rolling 14-day retention window.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const supabase = require('../server/config/supabase');

const BACKUP_DIR = path.join(__dirname, '../backups');
const RETENTION_DAYS = 14;

const CORE_TABLES = [
  'system_settings',
  'users',
  'user_profiles',
  'grievances',
  'grievance_timeline',
  'ticket_comments',
  'attachments',
  'notifications',
  'feedback',
  'audit_logs',
  'system_alerts'
];

async function runBackup() {
  console.log('🔄 [Backup Service] Starting automated database backup...');
  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `db-backup-${timestamp}.json.gz`;
  const backupFilePath = path.join(BACKUP_DIR, backupFilename);

  const snapshot = {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    tables: {}
  };

  for (const table of CORE_TABLES) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' });

      if (error) {
        console.warn(`⚠️ [Backup Service] Warning: Failed to export table "${table}":`, error.message);
        snapshot.tables[table] = { error: error.message, rows: [] };
      } else {
        console.log(`✅ [Backup Service] Exported table "${table}" (${data?.length || 0} rows)`);
        snapshot.tables[table] = { count, rows: data || [] };
      }
    } catch (err) {
      console.error(`❌ [Backup Service] Exception exporting "${table}":`, err.message);
      snapshot.tables[table] = { error: err.message, rows: [] };
    }
  }

  const jsonStr = JSON.stringify(snapshot, null, 2);
  const compressedBuffer = zlib.gzipSync(Buffer.from(jsonStr));
  fs.writeFileSync(backupFilePath, compressedBuffer);

  const sizeKb = Math.round(compressedBuffer.length / 1024);
  console.log(`\n🎉 [Backup Service] Backup successfully created at:`);
  console.log(`   ${backupFilePath} (${sizeKb} KB compressed)\n`);

  cleanOldBackups();
}

function cleanOldBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      return;
    }
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const cutoff = now - (RETENTION_DAYS * 24 * 60 * 60 * 1000);

    let deletedCount = 0;
    files.forEach(file => {
      const filePath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(filePath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`🗑️ [Backup Service] Deleted expired backup: ${file}`);
      }
    });

    if (deletedCount > 0) {
      console.log(`🧹 [Backup Service] Cleaned up ${deletedCount} backup(s) older than ${RETENTION_DAYS} days.`);
    }
  } catch (err) {
    console.warn('⚠️ [Backup Service] Error cleaning old backups:', err.message);
  }
}

if (require.main === module) {
  runBackup().then(() => process.exit(0)).catch(err => {
    console.error('❌ [Backup Service] Fatal backup error:', err);
    process.exit(1);
  });
}

module.exports = { runBackup, cleanOldBackups };
