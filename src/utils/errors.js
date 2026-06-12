/**
 * Utility to extract user-friendly error messages from Clerk SDK
 * client-side errors and standard backend HTTP error responses.
 */
export const getErrorMessage = (err, defaultMsg = 'An error occurred') => {
  if (!err) return defaultMsg;

  // Helper to map error text/code to custom friendly messages
  const mapMessage = (code, msg, longMsg) => {
    const combined = `${code} ${msg} ${longMsg}`.toLowerCase();
    if (combined.includes('form_code_incorrect') || combined.includes('invalid_code')) {
      return 'The verification code you entered is invalid. Please check the code and try again.';
    }
    if (combined.includes('verification_expired') || combined.includes('expired_code') || combined.includes('code has expired')) {
      return 'The verification code has expired. Please request a new code.';
    }
    if (combined.includes('verification_failed')) {
      return 'Verification failed. Please check your credentials or request a new code.';
    }
    if (combined.includes('session_expired') || combined.includes('session_not_found') || combined.includes('session expired')) {
      return 'Authentication session not found or expired. Please start the process again.';
    }
    if (combined.includes('invalid credentials') || combined.includes('invalid_credentials') || combined.includes('password_incorrect') || combined.includes('identifier_not_found') || combined.includes('form_password_incorrect') || combined.includes('form_identifier_not_found')) {
      return 'Invalid email/mobile or password. Please verify your credentials and try again.';
    }
    if (combined.includes('lockout') || combined.includes('locked due to consecutive failures') || combined.includes('too many incorrect attempts') || combined.includes('account locked')) {
      return 'This account has been temporarily locked due to multiple failed login attempts. Please try again later.';
    }
    if (combined.includes('already registered') || combined.includes('user already exists') || combined.includes('already associated') || combined.includes('unique_constraint') || combined.includes('conflict')) {
      return 'An account with this email address or phone number is already registered.';
    }
    return null;
  };

  // 1. Clerk client-side validation / API errors
  if (err.errors && err.errors.length > 0) {
    const firstError = err.errors[0];
    const mapped = mapMessage(firstError.code || '', firstError.message || '', firstError.longMessage || '');
    if (mapped) return mapped;
    return firstError.longMessage || firstError.message || defaultMsg;
  }

  // 2. Axios/Fetch HTTP response errors
  if (err.response?.data?.error) {
    const errorStr = err.response.data.error;
    const mapped = mapMessage('', errorStr, '');
    if (mapped) return mapped;
    return errorStr;
  }

  if (err.response?.data?.message) {
    const messageStr = err.response.data.message;
    const mapped = mapMessage('', messageStr, '');
    if (mapped) return mapped;
    return messageStr;
  }

  // 3. Native JS Error message fallback
  const errorStr = err.message || defaultMsg;
  const mapped = mapMessage('', errorStr, '');
  if (mapped) return mapped;
  return errorStr;
};

export default getErrorMessage;
