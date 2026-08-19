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
  if (!apiKey) return null;

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
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

/**
 * Call OpenRouter AI API.
 */
const callOpenRouterAI = async (prompt, systemPrompt = '', temperature = 0.5) => {
  const apiKey = configService.getSetting('openrouter_api_key', process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY);
  if (!apiKey) return null;

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages,
        temperature,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'ResolveNow Grievance System'
        },
        timeout: 15000
      }
    );
    return response.data.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn('[OpenRouter API Warning — attempting fallback]:', err.response?.data || err.message);
    return null;
  }
};

/**
 * Call NVIDIA Nim Neural AI API (Llama 3.1 8B).
 */
const callNvidiaAI = async (prompt, systemPrompt = '', temperature = 0.5) => {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY;
  if (!apiKey) return null;

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await axios.post(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        model: 'meta/llama-3.1-8b-instruct',
        messages,
        temperature,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );
    return response.data.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn('[NVIDIA API Warning — attempting Gemini fallback]:', err.response?.data || err.message);
    return null;
  }
};

/**
 * Universal AI Caller: Tries OpenRouter first, then NVIDIA Nim API, then Gemini API as fallback.
 */
const callAI = async (prompt, systemPrompt = '', temperature = 0.5) => {
  // 1. Try OpenRouter AI
  const openRouterReply = await callOpenRouterAI(prompt, systemPrompt, temperature);
  if (openRouterReply) return openRouterReply;

  // 2. Try NVIDIA AI
  const nvidiaReply = await callNvidiaAI(prompt, systemPrompt, temperature);
  if (nvidiaReply) return nvidiaReply;

  // 3. Try Gemini AI
  const genAI = getGenAI();
  if (genAI) {
    try {
      const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
      const model = genAI.getGenerativeModel({ model: modelName });
      const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text()?.trim() || null;
    } catch (err) {
      console.warn('[Gemini AI Warning]:', err.message);
    }
  }

  return null;
};

/**
 * Extracts a JSON object from an LLM response even if wrapped in markdown.
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

/** Deterministic keyword heuristics used when AI is unavailable. */
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

function buildSummary(description) {
  const clean = (description || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const firstSentence = clean.split(/(?<=[.!?])\s/)[0];
  return firstSentence.length <= 140 ? firstSentence : `${clean.slice(0, 120).trim()}…`;
}

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
  async analyzeGrievance(description) {
    if (!description) {
      throw new Error('Description is required for AI analysis');
    }

    const systemPrompt = 'You are an institutional grievance triage AI. Output ONLY minified JSON without markdown.';
    const prompt = `
      Analyze the grievance description: "${description}"
      Rules:
      1. category: EXACTLY one of: ${VALID_CATEGORIES.map(c => `'${c}'`).join(', ')}.
      2. urgency: 'High', 'Medium', or 'Low'.
      3. frustration_index: integer 1-10 (1 = calm/polite, 10 = extremely angry/aggressive).
      4. detected_language: language name (e.g. "English", "Hindi", "Spanish").
      5. english_translation: if text is NOT English, translate to English; else "".
      6. summary: concise one-sentence summary (max 20 words).
      Respond ONLY with JSON format:
      {"category":"...","urgency":"...","frustration_index":5,"detected_language":"...","english_translation":"...","summary":"..."}
    `;

    const rawResponse = await callAI(prompt, systemPrompt, 0.2);
    const parsed = extractJson(rawResponse);
    return normalizeAnalysis(parsed, description);
  },

  async getChatResponse(userMessage) {
    const systemPrompt = 'You are ResolveBot, an empathetic, professional AI assistant for an institutional grievance redressal system. Provide helpful, concise answers in 2-3 sentences or direct users to submit a ticket if needed.';
    const reply = await callAI(userMessage, systemPrompt, 0.6);

    if (reply) return reply;

    // Intelligent Fallback Rules
    const text = (userMessage || '').toLowerCase();
    if (text.includes('password') || text.includes('cannot login') || text.includes('reset')) {
      return "It sounds like you need a password reset! You don't actually need to file an IT Ticket for this. You can instantly reset your credentials by visiting the 'Settings' section, bypassing the wait time. 🚀";
    } else if (text.includes('wifi') || text.includes('internet') || text.includes('connecting')) {
      return "Campus Wi-Fi (EduNet) is currently undergoing scheduled maintenance in Wing B. If you are in Wing A or C, please ensure your DNS is set to automatic. Does this solve your issue, or should we still file a ticket?";
    } else if (text.includes('scholarship') || text.includes('fee') || text.includes('payment')) {
      return "Financial queries are generally processed within 48 hours. If you need immediate tuition receipts, you can download them directly from the Student Portal without filing a grievance.";
    }
    return "Hello! I am your AI Resolve Assistant. Before you file a manual ticket, describe your issue to me and I will see if I can resolve it instantly!";
  },

  async *getChatResponseStream(userMessage) {
    const openRouterApiKey = configService.getSetting('openrouter_api_key', process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY);

    if (openRouterApiKey) {
      try {
        const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model,
            messages: [
              {
                role: 'system',
                content: 'You are ResolveBot, an empathetic AI assistant for institutional grievances. Give immediate, helpful 2-3 sentence answers.'
              },
              { role: 'user', content: userMessage }
            ],
            stream: true,
            temperature: 0.5,
            max_tokens: 500
          },
          {
            headers: {
              'Authorization': `Bearer ${openRouterApiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'http://localhost:5173',
              'X-Title': 'ResolveNow Grievance System'
            },
            responseType: 'stream',
            timeout: 15000
          }
        );

        for await (const chunk of response.data) {
          const lines = chunk.toString('utf8').split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') return;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices[0]?.delta?.content;
                if (delta) yield delta;
              } catch { /* malformed SSE chunk — skip and continue streaming */ }
            }
          }
        }
        return;
      } catch (err) {
        console.warn('[OpenRouter Stream Fallback]:', err.message);
      }
    }

    const apiKey = process.env.NVIDIA_API_KEY || process.env.VITE_NVIDIA_API_KEY;

    if (apiKey) {
      try {
        const response = await axios.post(
          'https://integrate.api.nvidia.com/v1/chat/completions',
          {
            model: 'meta/llama-3.1-8b-instruct',
            messages: [
              {
                role: 'system',
                content: 'You are ResolveBot, an empathetic AI assistant for institutional grievances. Give immediate, helpful 2-3 sentence answers.'
              },
              { role: 'user', content: userMessage }
            ],
            stream: true,
            temperature: 0.5,
            max_tokens: 500
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            responseType: 'stream',
            timeout: 15000
          }
        );

        for await (const chunk of response.data) {
          const lines = chunk.toString('utf8').split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') return;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices[0]?.delta?.content;
                if (delta) yield delta;
              } catch { /* malformed SSE chunk — skip and continue streaming */ }
            }
          }
        }
        return;
      } catch (err) {
        console.warn('[NVIDIA Stream Fallback]:', err.message);
      }
    }

    // Gemini stream fallback
    const genAI = getGenAI();
    if (genAI) {
      try {
        const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = `You are ResolveBot, an empathetic AI assistant. User says: "${userMessage}". Give a concise 2-3 sentence resolution.`;
        const result = await model.generateContentStream(prompt);
        for await (const chunk of result.stream) {
          yield chunk.text();
        }
        return;
      } catch (err) {
        console.warn('[Gemini Stream Error]:', err.message);
      }
    }

    // Smart Mock Stream fallback
    const reply = await this.getChatResponse(userMessage);
    const words = reply.split(' ');
    for (const word of words) {
      yield word + ' ';
      await new Promise(r => setTimeout(r, 40));
    }
  },

  async generateResolutionSuggestion(ticket) {
    const systemPrompt = 'You are a grievance resolution specialist. Draft a professional, empathetic 2-3 sentence response with clear action steps.';
    const prompt = `
      Ticket ID: ${ticket.ticket_id}
      Subject: ${ticket.title}
      Category: ${ticket.category}
      Description: "${ticket.description}"
    `;

    const reply = await callAI(prompt, systemPrompt, 0.4);
    if (reply) return reply;

    return `We have received your ${ticket.category || 'grievance'} report (#${ticket.ticket_id}). Our dedicated support team has logged the issue and is actively coordinating a resolution within 48 hours.`;
  },

  async generateDepartmentBriefing(ticket, department) {
    const systemPrompt = `You are an AI assistant briefing a specialist in the ${department} department. Provide a 2-sentence technical summary and action item.`;
    const prompt = `
      Subject: ${ticket.title}
      Description: ${ticket.description}
      Category: ${ticket.category}
      Urgency: ${ticket.urgency}
    `;

    const reply = await callAI(prompt, systemPrompt, 0.3);
    if (reply) return reply;

    return `High priority ${ticket.category} incident reported. Assigned to ${department} team for immediate verification and triage.`;
  },

  async generatePerformanceSummary(tickets) {
    if (!tickets || tickets.length === 0) return 'Not enough data for performance analysis.';

    const stats = {
      total: tickets.length,
      cats: tickets.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + 1; return acc; }, {}),
      urg: tickets.reduce((acc, t) => { acc[t.urgency] = (acc[t.urgency] || 0) + 1; return acc; }, {})
    };

    const systemPrompt = 'You are a senior institutional auditor. Write a 3-paragraph executive performance report on grievance trends.';
    const prompt = `
      Total Tickets: ${stats.total}
      Categories: ${JSON.stringify(stats.cats)}
      Urgency: ${JSON.stringify(stats.urg)}
    `;

    const reply = await callAI(prompt, systemPrompt, 0.4);
    if (reply) return reply;

    return `Executive Performance Summary:\n\nTotal grievances processed across all categories: ${stats.total}.\nPrimary issue category accounts for high volume in IT and Academic support.\nRecommendation: Maintain proactive infrastructure monitoring to minimize SLA breaches.`;
  },

  async analyzeImage(base64Image, mimeType) {
    const genAI = getGenAI();
    if (!genAI) return 'Vision analysis offline. Manual inspection required.';

    try {
      const modelName = configService.getSetting('gemini_model', DEFAULT_GEMINI_MODEL);
      const model = genAI.getGenerativeModel({ model: modelName });
      const prompt = 'Analyze this image evidence for a grievance report. Describe visible issues in 2 technical sentences.';
      const imageParts = [{ inlineData: { data: base64Image, mimeType: mimeType || 'image/jpeg' } }];
      const result = await model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      return response.text().trim();
    } catch {
      return 'Image evidence received and attached. Manual verification required.';
    }
  },

  async analyzeVisionFromUrl(imageUrl) {
    if (!imageUrl) throw new Error('No image URL provided');
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      const mimeType = response.headers['content-type'];
      return this.analyzeImage(base64, mimeType);
    } catch {
      return 'Attached image evidence logged.';
    }
  },

  async composeBroadcastEmail(intent, tone = 'professional') {
    const systemPrompt = `You are the Institutional Communications Officer. Write a broadcast email based on the intent: "${intent}". Tone: ${tone}. Include Subject: and Body: lines.`;
    const reply = await callAI(intent, systemPrompt, 0.5);
    if (reply) return reply;

    return `Subject: Institutional Announcement regarding ${intent}\n\nBody: Dear Students & Staff,\n\nPlease be advised regarding the following institutional update: ${intent}.\n\nSincerely,\nThe Administration`;
  },

  async smartRouteGrievance(ticketData) {
    const { title = '', description = '', category = 'General', urgency = 'Medium' } = ticketData || {};

    const systemPrompt = 'You are an institutional grievance routing specialist. Respond ONLY with JSON format without markdown.';
    const prompt = `
      Analyze grievance:
      Title: "${title}"
      Description: "${description}"
      Category: "${category}"
      Urgency: "${urgency}"

      Output JSON with fields:
      - recommended_department: One of ["IT Support & Campus Wi-Fi", "Academic Affairs", "Facilities & Maintenance", "Financial Services", "Hostel & Social Welfare"]
      - predicted_sla_hours: Integer (12, 24, 48, or 72)
      - sentiment: One of ["Calm", "Frustrated", "Urgent", "Critical"]
      - suggested_action: Concise professional 2-sentence resolution draft for assigned nodal officer.

      Respond ONLY with JSON:
      {"recommended_department":"...","predicted_sla_hours":24,"sentiment":"...","suggested_action":"..."}
    `;

    const rawResponse = await callAI(prompt, systemPrompt, 0.2);
    const parsed = extractJson(rawResponse);

    if (parsed && parsed.recommended_department) {
      return {
        recommended_department: parsed.recommended_department,
        predicted_sla_hours: parseInt(parsed.predicted_sla_hours, 10) || (urgency === 'High' ? 24 : 48),
        sentiment: parsed.sentiment || (urgency === 'High' ? 'Urgent' : 'Calm'),
        suggested_action: parsed.suggested_action || `Grievance #${title} logged and routed to ${parsed.recommended_department} for action within ${parsed.predicted_sla_hours || 48} hours.`
      };
    }

    // Heuristics fallback
    const text = `${title} ${description}`.toLowerCase();
    let recommended_department = 'Facilities & Maintenance';
    let predicted_sla_hours = 48;
    let sentiment = 'Calm';

    if (/(wifi|internet|network|portal|login|password|software|email)/.test(text)) {
      recommended_department = 'IT Support & Campus Wi-Fi';
      predicted_sla_hours = 24;
    } else if (/(fee|money|payment|scholarship|refund|fine|dues)/.test(text)) {
      recommended_department = 'Financial Services';
      predicted_sla_hours = 24;
    } else if (/(exam|marks|grade|course|class|professor|lecture|syllabus)/.test(text)) {
      recommended_department = 'Academic Affairs';
      predicted_sla_hours = 48;
    } else if (/(hostel|mess|room|canteen|food|ragging|harassment)/.test(text)) {
      recommended_department = 'Hostel & Social Welfare';
      predicted_sla_hours = 12;
      sentiment = 'Urgent';
    }

    if (urgency === 'High' || /(urgent|immediately|emergency)/.test(text)) {
      sentiment = 'Urgent';
      predicted_sla_hours = Math.min(predicted_sla_hours, 24);
    }

    return {
      recommended_department,
      predicted_sla_hours,
      sentiment,
      suggested_action: `Logged under ${category}. Recommended routing to ${recommended_department} with target resolution within ${predicted_sla_hours} hours.`
    };
  },

  /**
   * AI Duplicate Detection Engine
   * Compares incoming grievance draft against active grievances to identify duplicates.
   */
  async checkDuplicateGrievance({ title, description, category }, existingGrievances = []) {
    if (!title && !description) {
      return { is_duplicate: false, match_confidence: 0, matching_ticket: null, reason: 'Insufficient text for duplicate analysis.' };
    }

    const candidateTickets = existingGrievances
      .filter(g => g.status !== 'Resolved' && g.status !== 'Closed')
      .slice(0, 15);

    if (candidateTickets.length === 0) {
      return { is_duplicate: false, match_confidence: 0, matching_ticket: null, reason: 'No active tickets found for comparison.' };
    }

    const systemPrompt = `You are an expert AI Grievance Triage & Duplicate Resolution Engine for an institutional grievance system.
Compare the user's NEW grievance submission against the list of EXISTING active tickets.
Determine if the NEW grievance describes the SAME underlying incident/issue as any existing ticket (e.g. Wi-Fi down in same block, water leak in same building, grade verification delay for same semester).`;

    const formattedCandidates = candidateTickets.map((t, idx) => 
      `[${idx + 1}] Ticket ID: ${t.ticket_id || t.id} | Category: ${t.category || 'General'} | Title: "${t.title}" | Description: "${t.description}"`
    ).join('\n');

    const prompt = `NEW SUBMISSION:
Title: "${title}"
Description: "${description}"
Category: "${category || 'General'}"

EXISTING ACTIVE TICKETS:
${formattedCandidates}

Task:
Determine if NEW SUBMISSION is a duplicate or directly related to any EXISTING ACTIVE TICKET.

Respond ONLY with valid JSON in this exact structure:
{
  "is_duplicate": boolean,
  "match_confidence": integer (0 to 100),
  "matching_ticket_id": string (ticket_id of the matching ticket, or null if none),
  "reason": "1-sentence explanation of why it is or is not a duplicate"
}`;

    const rawResponse = await callAI(prompt, systemPrompt, 0.1);
    const parsed = extractJson(rawResponse);

    if (parsed && typeof parsed.is_duplicate === 'boolean') {
      const matched = candidateTickets.find(t => t.ticket_id === parsed.matching_ticket_id || t.id === parsed.matching_ticket_id);
      return {
        is_duplicate: parsed.is_duplicate && parsed.match_confidence >= 65,
        match_confidence: parsed.match_confidence || 0,
        matching_ticket: matched || (parsed.is_duplicate ? candidateTickets[0] : null),
        reason: parsed.reason || 'Semantic similarity analysis completed.'
      };
    }

    // Heuristics fallback (Keyword / Token overlap)
    const newTokens = `${title} ${description}`.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 3);
    let bestMatch = null;
    let highestScore = 0;

    for (const ticket of candidateTickets) {
      const candidateTokens = `${ticket.title} ${ticket.description}`.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 3);
      const overlap = newTokens.filter(w => candidateTokens.includes(w));
      const score = Math.round((overlap.length * 2 / (newTokens.length + candidateTokens.length)) * 100);

      if (score > highestScore) {
        highestScore = score;
        bestMatch = ticket;
      }
    }

    const isDuplicate = highestScore >= 35;
    return {
      is_duplicate: isDuplicate,
      match_confidence: Math.min(Math.round(highestScore * 1.8), 95),
      matching_ticket: isDuplicate ? bestMatch : null,
      reason: isDuplicate 
        ? `High keyword & semantic overlap detected with existing ticket ${bestMatch?.ticket_id}.`
        : 'No duplicate grievances detected.'
    };
  }
};

module.exports = aiService;

