/**
 * Analyzes the grievance description and provides smart triage suggestions.
 * 
 * @param {string} description - The user's grievance description.
 * @returns {Object} { category, urgency } - Recommended triage data.
 */
const analyzeGrievance = async (description) => {
  if (!description) {
    throw new Error('Description is required for AI analysis');
  }

  const lowerDesc = description.toLowerCase();
  
  let category = 'IT Support';
  let urgency = 'Medium';

  // Smart category matching logic
  if (lowerDesc.includes('fee') || lowerDesc.includes('pay') || lowerDesc.includes('money') || lowerDesc.includes('scholarship')) {
    category = 'Financial';
  } else if (lowerDesc.includes('class') || lowerDesc.includes('teacher') || lowerDesc.includes('grade') || lowerDesc.includes('course')) {
    category = 'Academic';
  } else if (lowerDesc.includes('clean') || lowerDesc.includes('water') || lowerDesc.includes('broken') || lowerDesc.includes('wall') || lowerDesc.includes('door')) {
    category = 'Maintenance';
  }

  // Smart urgency matching logic
  if (lowerDesc.includes('urgent') || lowerDesc.includes('emergency') || lowerDesc.includes('now') || lowerDesc.includes('crash') || lowerDesc.includes('immediate')) {
    urgency = 'High';
  } else if (lowerDesc.includes('when you can') || lowerDesc.includes('low') || lowerDesc.includes('later') || lowerDesc.includes('suggestion')) {
    urgency = 'Low';
  }

  return { category, urgency };
};

module.exports = {
  analyzeGrievance
};
