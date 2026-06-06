class ApiResponse {
  static success(res, message, data = {}, status = 200) {
    return res.status(status).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message, status = 500, error = null) {
    return res.status(status).json({
      success: false,
      error: message,
      details: error,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ApiResponse;
