const dateUtils = {
  /**
   * Add hours to a date
   */
  addHours(date, hours) {
    return new Date(new Date(date).getTime() + hours * 60 * 60 * 1000);
  },

  /**
   * Calculate hours remaining until a deadline
   */
  hoursRemaining(deadline) {
    const diffMs = new Date(deadline) - new Date();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  },

  /**
   * Check if a deadline has passed
   */
  isOverdue(deadline) {
    return new Date() > new Date(deadline);
  }
};

module.exports = dateUtils;
