/**
 * Wrap express middleware/controllers to automatically catch errors
 * and forward them to the next error handling middleware.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
