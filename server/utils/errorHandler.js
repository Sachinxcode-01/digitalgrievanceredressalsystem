class AppError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

const errorHandlerMiddleware = (err, req, res, next) => {
  console.error('[Error Audit Log]:', err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'An unexpected error occurred on the server.';
  
  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  errorHandlerMiddleware
};
