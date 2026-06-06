const { validationResult } = require('express-validator');

/**
 * Validates the results of express-validator rules.
 * Throws a structured 400 Bad Request error if validation fails.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Request validation failed', 
      details: errors.array().map(e => ({ field: e.path || e.param, message: e.msg })) 
    });
  }
  next();
};

module.exports = validate;
