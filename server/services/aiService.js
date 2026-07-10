const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');
const axios = require('axios');
const configService = require('./configService');

dotenv.config({ path: path.join(__dirname, '../../.env') });

let genAIInstance = null;
let activeApiKey = null;

const getGenAI = () => {
  const apiKey = configService.getSetting('gemini_api_key', process.env.GEMINI_API_KEY || '');
  if (!apiKey) {
    return null;
  }

  if (genAIInstance && activeApiKey === apiKey) {
    return genAIInstance;
  }

  genAIInstance = new GoogleGenerativeAI(apiKey);
  activeApiKey = apiKey;
  return genAIInstance;
};

// Canonical enums — must stay in sync with grievanceValidator + the frontend dropdowns.
const VALID_CATEGORIES = [
  'Financial', 'Academic', 'Maintenance', 'IT Support',
  'Public Infrastructure', 'Eco-Sustainability', 'Social Welfare'
];
const VALID_URGENCY = ['High', 'Medium', 'Low'];

// Default Gemini model. gemini-1.5-flash was deprecated (returns 404 on generateContent),
// so we default to a current GA model and allow override via the GEMINI_MODEL env var or
// the `gemini_model` system setting.
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

/**
 * Extracts a JSON object from an LLM response even if it's wrapped in markdown
 * fences or surrounded by prose. Returns null if nothing parseable is found.
 */
function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.replace(/```json|```/gi, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last < first) return null;
  try {
    return JSON.parse(cleaned.slice(first, last + 1));
  } catch {
    return null;
  }
}

/** Deterministic keyword heuristics used when the AI is unavailable or invalid. */
function keywordHeuristics(description) {
  const d = (description || '').toLowerCase();
  let category = 'IT Support';
  let urgency = 'Medium';
  let frustration_index = 4;

  if (/(fee|payment|pay|money|scholarship|refund|fine|invoice|salary)/.test(d)) category = 'Financial';
  else if (/(class|teacher|professor|grade|course|exam|syllabus|faculty|lecture|attendance)/.test(d)) category = 'Academic';
  else if (/(road|street|drain|garbage|park|footpath|streetlight|sewage|pavement)/.test(d)) category = 'Public Infrastructure';
  else if (/(pollution|waste|recycl|environment|green energy|tree|plastic|emission)/.test(d)) category = 'Eco-Sustainability';
  else if (/(harassment|discrimination|ragging|safety|counsel|welfare|abuse)/.test(d)) category = 'Social Welfare';
  else if (/(clean|water|broken|wall|door|leak|electric|light|toilet|fan|repair|furniture|building)/.test(d)) category = 'Maintenance';
  else if (/(wifi|internet|login|password|network|server|portal|software|system|app|website|email)/.test(d)) category = 'IT Support';

  if (/(urgent|emergency|immediately|asap|crash|danger|serious|critical)/.test(d)) { urgency = 'High'; frustration_index = 8; }
  else if (/(whenever|when you can|no rush|later|suggestion|minor|small)/.test(d)) { urgency = 'Low'; frustration_index = 2; }
  else if (/(mad|angry|furious|terrible|worst|disgust|unacceptable|ridiculous|fed up)/.test(d)) { frustration_index = 9; }

  return { category, urgency, frustration_index };
}

/** Builds a concise one-line summary from the description as a fallback. */
function buildSummary(description) {
  const clean = (description || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0];
  return firstSentence.length <= 140 ? firstSentence : `${clean.slice(0, 120).trim()}…`;
}

/**
 * Validates and fills an analysis object so callers ALWAYS receive a complete,
 * schema-valid result — whether it came from the AI or from the heuristic fallback.
 * Any invalid/missing field is repaired using keyword heuristics.
 */
function normalizeAnalysis(raw, description) {
  const r = raw || {};
  const heur = keywordHeuristics(description);

  const rawCategory = typeof r.category === 'string' ? r.category.trim() : '';
  const category = VALID_CATEGORIES.find(c => c.toLowerCase() === rawCategory.toLowerCase()) || heur.category;

  const rawUrgency = typeof r.urgency === 'string' ? r.urgency.trim() : '';
  const urgency = VALID_URGENCY.find(u => u.toLowerCase() === rawUrgency.toLowerCase()) || heur.urgency;

  let frustration_index = parseInt(r.frustration_index, 10);
  if (!Number.isFinite(frustration_index)) frustration_index = heur.frustration_index;
  frustration_index = Math.min(10, Math.max(1, frustration_index));

  const detected_language = (typeof r.detected_language === 'string' && r.detected_language.trim()) || 'English';
  const english_translation = typeof r.english_translation === 'string' ? r.english_translation.trim() : '';
  const summary = (typeof r.summary === 'string' && r.summary.trim()) || buildSummary(description);

  return { category, urgency, frustration_index, detected_language, english_translation, summary };
}

const aiService = {
  /**
   * Analyzes the grievance description and provides smart triage suggestions.
   * Leverages Gemini neural triage with keyword fallback.
   */
  async analyzeGrievance(description) {
    if (!description) {
      throw new Error('Description is required for AI analysis');
    }

    const genAI = getGenAI();
    let parsed = null;

    if (genAI) {
      const categorizationEnabled = configService.getSetting('enable_ai_categorization', true);
      const sentimentEnabled = configService.getSetting('enable_sentiment_analysis', true);
      const urgencyEnabled = configService.getSetting('enable_urgency_detection', true);

      if (categorizationEnabled || sentimentEnabled || urgencyEnabled) {
        try {
          const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
          const model = genAI.getGenerativeModel({ model: modelName });

          const prompt = `
            You are an institutional grievance analyzer. Analyze the grievance below.
            Description: "${description}"

            Rules:
            1. category: choose EXACTLY one of: ${VALID_CATEGORIES.map(c => `'${c}'`).join(', ')}. (Use 'IT Support' if categorization is disabled: ${!categorizationEnabled}).
            2. urgency: 'High', 'Medium', or 'Low'. (Use 'Low' if urgency detection is disabled: ${!urgencyEnabled}).
            3. frustration_index: integer 1-10 (1 = calm/polite, 10 = extremely angry/aggressive). (Use 1 if sentiment analysis is disabled: ${!sentimentEnabled}).
            4. detected_language: the language name of the description (e.g. "English", "Hindi", "Spanish").
            5. english_translation: if the text is NOT English, its English translation; if English, an empty string "".
            6. summary: a concise, neutral one-sentence summary (max 20 words) of the core issue.
            7. Respond with ONLY minified JSON, no markdown, exactly:
               {"category":"...","urgency":"...","frustration_index":5,"detected_language":"...","english_translation":"...","summary":"..."}
          `;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          parsed = extractJson(response.text());
        } catch (err) {
          // AI failure must never block submission — we fall through to heuristics.
          console.error('Gemini Neural Triage Error:', err.message);
        }
      }
    }

    // normalizeAnalysis guarantees a complete, schema-valid result whether `parsed`
    // came from the AI, was partial/invalid, or is null (AI unavailable / no API key).
    return normalizeAnalysis(parsed, description);
  },

  async getChatResponse(userMessage) {
    const genAI = getGenAI();
    if (!genAI) return null;

    try {
      const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
        You are the "ResolveBot", an AI helpful assistant for institutional grievances.
        User says: "${userMessage}"

        Goal: 
        1. If the user is asking for help with university/office issues (WiFi, fees, broken stuff, logins), provide immediate, helpful instructions.
        2. Keep it professional, empathetic, and concise (max 3 sentences).
        3. If it's too complex, tell them to "File a manual ticket for administrator review".
        4. Do NOT mention you are an AI.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.error('Gemini Chat Neural Error:', err);
      return null;
    }
  },

  async *getChatResponseStream(userMessage) {
    const genAI = getGenAI();
    if (!genAI) return;

    try {
      const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
        You are the "ResolveBot", an AI helpful assistant for institutional grievances.
        User says: "${userMessage}"

        Goal: 
        1. If the user is asking for help with university/office issues (WiFi, fees, broken stuff, logins), provide immediate, helpful instructions.
        2. Keep it professional, empathetic, and concise (max 3 sentences).
        3. If it's too complex, tell them to "File a manual ticket for administrator review".
        4. Do NOT mention you are an AI.
      `;

      const result = await model.generateContentStream(prompt);
      for await (const chunk of result.stream) {
        yield chunk.text();
      }
    } catch (err) {
      console.error('Gemini Chat Neural Stream Error:', err);
      throw err;
    }
  },

  async generateResolutionSuggestion(ticket) {
    const genAI = getGenAI();
    if (!genAI) return null;

    const suggestionsEnabled = configService.getSetting('enable_ai_suggestions', true);
    if (!suggestionsEnabled) {
      return 'AI suggestions are disabled in settings.';
    }

    try {
      const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
        You are a resolution specialist. Draft a professional, empathetic, and actionable response for the following ticket:
        Ticket ID: ${ticket.ticket_id}
        Subject: ${ticket.title}
        Category: ${ticket.category}
        Description: "${ticket.description}"

        Rules for response:
        1. Professional and empathetic tone.
        2. State specific next steps (e.g. "We have notified the [Category] department...").
        3. Mention our goal for resolution within 48 hours.
        4. Max 3 sentences.
        5. Do NOT include placeholders like [Name]. Use "The support team" instead.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      console.error('Gemini Resolution Suggestion Error:', err);
      return null;
    }
  },

  async generateDepartmentBriefing(ticket, department) {
    const genAI = getGenAI();
    if (!genAI) return null;

    try {
      const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
        You are an AI assistant briefing a specialist in the ${department} department.
        Subject: ${ticket.title}
        Description: ${ticket.description}
        Category: ${ticket.category}
        Urgency: ${ticket.urgency}
        Current Frustration: ${ticket.frustration_index}/10
        
        Task: Provide a 2-sentence highly technical summary and the immediate first step for a human specialist in ${department} to solve this.
        Tone: Professional, succinct, and internal-facing.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      console.error('Gemini Department Briefing Error:', err);
      return 'Error generating briefing. Please review manually.';
    }
  },

  async generatePerformanceSummary(tickets) {
    const genAI = getGenAI();
    if (!genAI || tickets.length === 0) return 'Not enough data for AI analysis or Gemini is unconfigured.';

    try {
      const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const stats = {
        total:  tickets.length,
        cats:   tickets.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {}),
        urg:    tickets.reduce((acc, t) => { acc[t.urgency] = (acc[t.urgency] || 0) + 1; return acc; }, {}),
        f_avg: (tickets.reduce((acc, t) => acc + (t.frustration_index || 0), 0) / tickets.length).toFixed(1)
      };

      const prompt = `
        You are a senior auditor for an institutional grievance system.
        Total Tickets: ${stats.total}
        Categories: ${JSON.stringify(stats.cats)}
        Urgency distribution: ${JSON.stringify(stats.urg)}
        Average User Frustration: ${stats.f_avg}/10
        
        Task: Provide a 3-paragraph executive summary analyze institutional bottlenecks, sentiment trends, and one actionable recommendation for the institution.
        Tone: Professional, analytic, and assertive.
      `;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      console.error('Gemini Performance Summary Error:', err);
      return 'Performance analysis engine unreachable.';
    }
  },

  async analyzeImage(base64Image, mimeType) {
    const genAI = getGenAI();
    if (!genAI) return null;

    try {
      const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
        Analyze this image evidence for a grievance report. 
        Identify what is in the image, the severity of any visible issues (e.g. broken equipment, mess, leak, etc.), 
        and provide a concise, technical 2-sentence summary for an administrator.
      `;
      
      const imageParts = [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType || 'image/jpeg'
          }
        }
      ];

      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      console.error('Gemini Vision Analysis Error:', err);
      return 'Vision analysis failed. Manual verification required.';
    }
  },

  async analyzeVisionFromUrl(imageUrl) {
    if (!imageUrl) throw new Error('No image URL provided');

    // Fetch image from URL using axios
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    const mimeType = response.headers['content-type'];
    
    return this.analyzeImage(base64, mimeType);
  },

  async composeBroadcastEmail(intent, tone = 'professional') {
    const genAI = getGenAI();
    if (!genAI) return 'AI composition system offline.';

    try {
      const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
        You are the Institutional Communications Officer. Write a broadcast email to all students and staff based on this intent:
        "${intent}"

        Tone Requirement: ${tone}
        
        Rules:
        1. Professional subject line.
        2. Clear, structured body.
        3. Use placeholders like [Recipient Name] where appropriate.
        4. End with "Sincerely, The Administration".
        5. Respond ONLY with the email content (Subject: ... followed by Body: ...).
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (err) {
      console.error('Gemini Broadcast Composition Error:', err);
      return 'Failed to generate broadcast draft.';
    }
  }
};

module.exports = aiService;
