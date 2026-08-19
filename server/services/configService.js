const settingsRepository = require('../repositories/settingsRepository');
const auditService = require('./auditService');

const settingsCache = new Map();
let isInitialized = false;

const configService = {
  /**
   * Initializes the settings cache by loading all entries from system_settings
   */
  async init() {
    try {
      const data = await settingsRepository.getAllSettings();
      settingsCache.clear();
      if (data) {
        data.forEach(item => {
          settingsCache.set(item.key, item.value);
        });
      }

      isInitialized = true;
      console.log(`🚀 [Config Service] Caching complete. Loaded ${settingsCache.size} settings from database.`);
      return true;
    } catch (err) {
      console.warn('⚠️ [Config Service] system_settings table not accessible or missing. Using environment fallbacks.', err.message);
      return false;
    }
  },

  /**
   * Reload settings from database
   */
  async reload() {
    return this.init();
  },

  /**
   * Safe getter for settings.
   * If not initialized, attempts a lazy reload or uses default/env values.
   */
  getSetting(key, defaultValue) {
    if (!isInitialized) {
      // Return env fallback if available, otherwise the passed default
      return this.getEnvFallback(key, defaultValue);
    }

    const value = settingsCache.get(key);
    
    // If the database value is empty/default, use environment fallback
    const isEmptyOrDefault = value === undefined || 
                             value === null || 
                             value === '' || 
                             value === '""' || 
                             (key === 'smtp_host' && value === 'smtp.ethereal.email') ||
                             (key === 'sender_email' && value === 'no-reply@resolvenow.system');

    if (isEmptyOrDefault) {
      return this.getEnvFallback(key, defaultValue);
    }

    return value;
  },

  /**
   * Helper to map settings keys to their matching environment variables
   */
  getEnvFallback(key, defaultValue) {
    switch (key) {
      case 'institution_name': return process.env.INSTITUTION_NAME || defaultValue;
      case 'support_email': return process.env.SMTP_EMAIL || defaultValue;
      
      // Auth limits
      case 'otp_expiry_seconds': return parseInt(process.env.OTP_EXPIRY_SECONDS || defaultValue);
      case 'session_expiry_minutes': return parseInt(process.env.SESSION_EXPIRY_MINUTES || defaultValue);
      
      // SMTP
      case 'smtp_host': {
        // Priority: explicit SMTP_HOST > Gmail detection > Resend > Ethereal
        if (process.env.SMTP_HOST) return process.env.SMTP_HOST;
        if (process.env.SMTP_EMAIL && process.env.SMTP_EMAIL.includes('@gmail.com')) {
          return 'smtp.gmail.com';
        }
        if (process.env.RESEND_API_KEY) return 'smtp.resend.com';
        return 'smtp.ethereal.email';
      }
      case 'smtp_port': {
        if (process.env.SMTP_PORT) return parseInt(process.env.SMTP_PORT);
        if (process.env.SMTP_HOST === 'smtp.resend.com') return 465;
        if (process.env.SMTP_EMAIL && process.env.SMTP_EMAIL.includes('@gmail.com')) return 587;
        if (process.env.RESEND_API_KEY) return 465;
        return 587;
      }
      case 'smtp_username': {
        const host = this.getSetting('smtp_host');
        if (host === 'smtp.resend.com') {
          return 'resend';
        }
        return process.env.SMTP_EMAIL || '';
      }
      case 'smtp_password': {
        const host = this.getSetting('smtp_host');
        if (host === 'smtp.resend.com') {
          return process.env.RESEND_API_KEY;
        }
        return process.env.SMTP_PASSWORD || '';
      }
      case 'smtp_ssl': {
        if (process.env.SMTP_SSL !== undefined) {
          return process.env.SMTP_SSL === 'true';
        }
        if (process.env.SMTP_HOST === 'smtp.resend.com') return true;
        return false;
      }
      case 'sender_email': {
        // When using Gmail, send FROM the Gmail address
        if (process.env.SMTP_EMAIL && process.env.SMTP_EMAIL.includes('@gmail.com')) {
          return process.env.SMTP_EMAIL;
        }
        // Resend requires a verified sender domain; use env override or resend sandbox
        if (process.env.SENDER_EMAIL) return process.env.SENDER_EMAIL;
        if (process.env.RESEND_API_KEY) return process.env.SMTP_EMAIL || 'onboarding@resend.dev';
        return process.env.SMTP_EMAIL || defaultValue;
      }
      case 'sender_name':
        return process.env.SENDER_NAME || defaultValue;
      
      // SMS
      case 'sms_api_url': return process.env.SMS_GATEWAY_URL || defaultValue;
      case 'sms_login': return process.env.SMS_GATEWAY_LOGIN || defaultValue;
      case 'sms_password': return process.env.SMS_GATEWAY_PASSWORD || defaultValue;
      
      // AI Keys
      case 'gemini_api_key': return process.env.GEMINI_API_KEY || '';
      case 'openrouter_api_key': return process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '';
      case 'nvidia_api_key': return process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY || '';
      
      default: return defaultValue;
    }
  },

  /**
   * Bulk updates settings in the database and refreshes local memory cache.
   */
  async updateSettings(settingsMap, adminId = null) {
    try {
      const inserts = Object.entries(settingsMap).map(([key, value]) => {
        // Infer category based on key prefix/pattern
        let category = 'general';
        if (key.includes('otp_') || key.includes('session_') || key.includes('password_') || key.includes('login_attempts') || key.includes('lockout_') || key.includes('google_') || key.includes('email_verification')) {
          category = 'auth';
        } else if (key.includes('smtp_') || key.includes('sender_')) {
          category = 'email';
        } else if (key.includes('sms_')) {
          category = 'sms';
        } else if (key.includes('gemini_') || key.includes('enable_ai_')) {
          category = 'ai';
        } else if (key.includes('enable_') && (key.includes('_notifications') || key.includes('_app_'))) {
          category = 'notification';
        } else if (key.includes('rate_') || key.includes('device_') || key.includes('audit_')) {
          category = 'security';
        }

        return {
          key,
          value,
          category,
          updated_at: new Date().toISOString()
        };
      });

      await settingsRepository.upsertSettings(inserts);

      // Reload into memory
      await this.reload();

      // Log admin activity if adminId is provided
      if (adminId) {
        await auditService.logAdminActivity(
          adminId,
          'UPDATE_SYSTEM_SETTINGS',
          null,
          'Internal/API',
          'System Settings Panel',
          { updatedKeys: Object.keys(settingsMap) }
        ).catch(err => console.error('Failed to log admin settings update:', err.message));
      }

      return true;
    } catch (err) {
      console.error('❌ [Config Service] Bulk update failed:', err.message);
      throw err;
    }
  }
};

module.exports = configService;
