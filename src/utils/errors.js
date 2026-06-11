/**
 * Utility to extract user-friendly error messages from Clerk SDK
 * client-side errors and standard backend HTTP error responses.
 */
export const getErrorMessage = (err, defaultMsg = 'An error occurred') => {
  if (!err) return defaultMsg;

  // 1. Clerk client-side validation / API errors
  if (err.errors && err.errors.length > 0) {
    return err.errors[0].longMessage || err.errors[0].message || defaultMsg;
  }

  // 2. Axios/Fetch HTTP response errors
  if (err.response?.data?.error) {
    return err.response.data.error;
  }

  if (err.response?.data?.message) {
    return err.response.data.message;
  }

  // 3. Native JS Error message fallback
  return err.message || defaultMsg;
};

export default getErrorMessage;
