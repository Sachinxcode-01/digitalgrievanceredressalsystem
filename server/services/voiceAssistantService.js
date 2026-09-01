/**
 * AI Voice Assistant Conversational Service
 * Handles multi-turn conversational grievance intake, entity extraction,
 * and empathetic spoken-response generation for Web Speech Synthesis.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { aiCircuitBreaker } = require('../utils/aiCircuitBreaker');

const DEPARTMENTS = [
  'Facilities & Maintenance',
  'Academic Affairs',
  'Hostel & Housing',
  'IT & Infrastructure',
  'Finance & Billing',
  'Security & Safety',
  'Health & Sanitation',
  'Administration'
];

const CATEGORIES = [
  'Infrastructure',
  'Academics',
  'Hostel',
  'Electrical',
  'Plumbing',
  'Cleanliness',
  'Financial',
  'Security',
  'Harassment',
  'General'
];

const URGENCIES = ['Low', 'Medium', 'High', 'Critical'];

/**
 * Heuristic fallback parser when external LLM is offline or circuit breaker is OPEN
 */
function heuristicExtract(userInput) {
  const text = (userInput || '').toLowerCase();
  
  let category = 'General';
  let department = 'Administration';
  let urgency = 'Medium';

  // Specific domain keywords take precedence over general medium words
  if (text.includes('exam') || text.includes('grade') || text.includes('mark') || text.includes('course') || text.includes('professor') || text.includes('class') || text.includes('faculty') || text.includes('attendance')) {
    category = 'Academics';
    department = 'Academic Affairs';
  } else if (text.includes('threat') || text.includes('theft') || text.includes('stolen') || text.includes('bully') || text.includes('ragging') || text.includes('harass')) {
    category = 'Security';
    department = 'Security & Safety';
    urgency = 'High';
  } else if (text.includes('fee') || text.includes('refund') || text.includes('scholarship') || text.includes('payment') || text.includes('dues')) {
    category = 'Financial';
    department = 'Finance & Billing';
  } else if (text.includes('water') || text.includes('tap') || text.includes('leak') || text.includes('drain') || text.includes('pipe')) {
    category = 'Plumbing';
    department = 'Facilities & Maintenance';
  } else if (text.includes('light') || text.includes('electricity') || text.includes('power') || text.includes('fan') || text.includes('ac ') || text.includes('air condition') || text.includes('switchboard')) {
    category = 'Electrical';
    department = 'Facilities & Maintenance';
  } else if (text.includes('wifi') || text.includes('internet') || text.includes('network') || text.includes('portal') || text.includes('server') || text.includes('software')) {
    category = 'Infrastructure';
    department = 'IT & Infrastructure';
  } else if (text.includes('hostel') || text.includes('room') || text.includes('bed') || text.includes('mess') || text.includes('food')) {
    category = 'Hostel';
    department = 'Hostel & Housing';
  }

  // Urgency heuristics
  if (text.includes('danger') || text.includes('fire') || text.includes('spark') || text.includes('emergency') || text.includes('immediate') || text.includes('bleeding')) {
    urgency = 'Critical';
  } else if (text.includes('urgent') || text.includes('asap') || text.includes('severe') || text.includes('broken')) {
    urgency = 'High';
  } else if (text.includes('minor') || text.includes('suggestion') || text.includes('feedback') || text.includes('low')) {
    urgency = 'Low';
  }

  // Clean title synthesis
  let title = userInput.length > 60 
    ? userInput.substring(0, 57) + '...' 
    : (userInput || 'Grievance Report');
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    title,
    description: userInput,
    category,
    department,
    urgency,
    confidenceScore: 0.85
  };
}

/**
 * Main AI Voice Conversational Processor
 * @param {string} userInput - What the user said
 * @param {Array} history - Previous messages [{ role: 'user'|'assistant', text: string }]
 * @param {string} language - Target language (e.g. 'en-US', 'hi-IN', 'es-ES', 'fr-FR')
 */
async function processVoiceDialogue(userInput, history = [], language = 'en-US') {
  if (!userInput || typeof userInput !== 'string' || !userInput.trim()) {
    return {
      spokenResponse: "I didn't quite catch that. Could you please describe your grievance again?",
      extractedData: null,
      isReadyToSubmit: false,
      suggestedActions: ['Describe Issue', 'Cancel']
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    const extracted = heuristicExtract(userInput);
    return {
      spokenResponse: `I have noted down your grievance regarding ${extracted.category}. It has been assigned to the ${extracted.department} with ${extracted.urgency} priority. Would you like me to submit this now?`,
      extractedData: extracted,
      isReadyToSubmit: true,
      suggestedActions: ['Submit Grievance', 'Edit Details', 'Add Attachment']
    };
  }

  try {
    const result = await aiCircuitBreaker.execute(async () => {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are ResolveNow's intelligent and empathetic voice assistant for digital grievance redressal.
A citizen or student is speaking to you.
User Input: "${userInput}"
Language: "${language}"

Available Departments: ${JSON.stringify(DEPARTMENTS)}
Available Categories: ${JSON.stringify(CATEGORIES)}
Available Urgencies: ${JSON.stringify(URGENCIES)}

Analyze their voice message and extract structured grievance fields. Also provide a polite, concise spoken voice response (1-2 sentences) confirming their issue and asking if they wish to submit.

Return ONLY a JSON object with this exact schema (no markdown, no backticks):
{
  "spokenResponse": "Concise natural reply to be read aloud via Text-to-Speech in the requested language",
  "title": "Concise, descriptive title (maximum 10 words)",
  "description": "Clean, well-punctuated grievance description summarizing what they stated",
  "category": "One of the available categories",
  "department": "One of the available departments",
  "urgency": "Low, Medium, High, or Critical",
  "confidenceScore": 0.95,
  "isReadyToSubmit": true,
  "suggestedActions": ["Submit Grievance", "Add More Details", "Change Urgency"]
}
`;

      const response = await model.generateContent(prompt);
      const rawText = response.response.text();
      const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    }, 'voice-assistant-converse');

    return {
      spokenResponse: result.spokenResponse || `I have recorded your grievance for ${result.department || 'the relevant department'}. Should I submit it for you?`,
      extractedData: {
        title: result.title || userInput.substring(0, 50),
        description: result.description || userInput,
        category: result.category || 'General',
        department: result.department || 'Administration',
        urgency: result.urgency || 'Medium',
        confidenceScore: result.confidenceScore || 0.90
      },
      isReadyToSubmit: result.isReadyToSubmit !== false,
      suggestedActions: result.suggestedActions || ['Submit Grievance', 'Edit Details']
    };
  } catch (err) {
    console.warn('AI Voice Assistant Fallback triggered:', err.message);
    const fallback = heuristicExtract(userInput);
    return {
      spokenResponse: `I have noted down your grievance for ${fallback.department}. Would you like me to submit this now?`,
      extractedData: fallback,
      isReadyToSubmit: true,
      suggestedActions: ['Submit Grievance', 'Edit Details', 'Cancel']
    };
  }
}

module.exports = {
  processVoiceDialogue,
  heuristicExtract,
  DEPARTMENTS,
  CATEGORIES,
  URGENCIES
};
