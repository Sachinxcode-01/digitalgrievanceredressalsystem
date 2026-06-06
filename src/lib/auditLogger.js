import { supabase } from './supabase';

/**
 * Commits a real-time security audit log to the database.
 * 
 * @param {string} event - Action description (e.g., 'Admin Session Initiated')
 * @param {string} userEmail - Identifier of the actor
 * @param {string} location - Logical or physical location (e.g., 'Auth Gateway')
 * @param {string} level - 'info', 'warning', or 'critical'
 */
export const logSecurityEvent = async (event, userEmail, location, level = 'info') => {
  try {
    let userId = null;
    try {
      const cached = localStorage.getItem('user_session');
      if (cached) {
        const parsed = JSON.parse(cached);
        userId = parsed?.user?.id || null;
      }
    } catch (e) {
      console.warn('Could not extract user_id for audit logs:', e);
    }

    const { error } = await supabase
      .from('audit_logs')
      .insert([
        {
          user_id: userId,
          action: event,
          ip_address: '127.0.0.1', // Client-side fallback IP
          user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Browser Client',
          details: {
            user_email: userEmail,
            location,
            level
          }
        }
      ]);
    
    if (error) {
      console.warn('Failed to commit security audit log:', error);
    }
  } catch (err) {
    console.warn('Security Audit Exception:', err);
  }
};

