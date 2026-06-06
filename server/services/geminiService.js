const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
const path = require('path');
const configService = require('./configService');

dotenv.config({ path: path.join(__dirname, '../../.env') });

let genAIInstance = null;
let activeApiKey = null;

/**
 * Returns a dynamically instantiated GoogleGenerativeAI instance based on current settings
 */
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

/**
 * Core AI Service Engine (Gemini Pro)
 */
const geminiService = {
  /**
   * Neural Triage Analysis
   * Performs deep semantic analysis to categorize and prioritize grievances.
   */
  async analyzeGrievance(description) {
    const genAI = getGenAI();
    if (!genAI) {
      console.warn('[Gemini Service] API Key unconfigured. Skipping AI grievance analysis.');
      return null;
    }

    // Check configuration toggles
    const categorizationEnabled = configService.getSetting('enable_ai_categorization', true);
    const sentimentEnabled = configService.getSetting('enable_sentiment_analysis', true);
    const urgencyEnabled = configService.getSetting('enable_urgency_detection', true);

    if (!categorizationEnabled && !sentimentEnabled && !urgencyEnabled) {
      return null;
    }

    try {
      const modelName = configService.getSetting('gemini_model', 'gemini-1.5-flash');
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const prompt = `
        You are an institutional grievance analyzer. Analyze this grievance description for sentiment and urgency:
        "${description}"

        Rules:
        1. Categorize as: 'Financial', 'Academic', 'Maintenance', or 'IT Support'. (Set to 'IT Support' if categorization is disabled: ${!categorizationEnabled}).
        2. Assign Urgency: 'High', 'Medium', or 'Low'. (Set to 'Low' if urgency detection is disabled: ${!urgencyEnabled}).
        3. Assign a frustration_index: Integer 1-10 (1 = calm/polite, 10 = extremely angry/frustrated/aggressive). (Set to 1 if sentiment analysis is disabled: ${!sentimentEnabled}).
        4. Detect the language of the description. If it is NOT English, provide an English translation. If it is English, return an empty string.
        5. Respond ONLY in JSON format exactly like this:
           {
             "category": "...",
             "urgency": "...",
             "frustration_index": 5,
             "english_translation": "..."
           }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON (strip markdown if necessary)
      const cleanJson = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.error('Gemini Neural Triage Error:', err);
      return null;
    }
  },

  /**
   * Neural Chat Intercept
   * Conversational resolution bot.
   */
  async getChatResponse(userMessage) {
    const genAI = getGenAI();
    if (!genAI) return null;

    try {
      const modelName = configService.getSetting('gemini_model', 'gemini-1.5-flash');
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

  /**
   * Neural Chat Intercept Stream
   * Yields responses chunk-by-chunk from Gemini.
   */
  async *getChatResponseStream(userMessage) {
    const genAI = getGenAI();
    if (!genAI) return;

    try {
      const modelName = configService.getSetting('gemini_model', 'gemini-1.5-flash');
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

  /**
   * Neural Admin Suggestion Prototype
   * Helps admins draft professional and effective resolutions.
   */
  async generateResolutionSuggestion(ticket) {
    const genAI = getGenAI();
    if (!genAI) return null;

    const suggestionsEnabled = configService.getSetting('enable_ai_suggestions', true);
    if (!suggestionsEnabled) {
      return 'AI suggestions are disabled in settings.';
    }

    try {
      const modelName = configService.getSetting('gemini_model', 'gemini-1.5-flash');
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

  /**
   * Neural Specialist Briefing
   * Generates technical context for a specific department.
   */
  async generateDepartmentBriefing(ticket, department) {
    const genAI = getGenAI();
    if (!genAI) return null;

    try {
      const modelName = configService.getSetting('gemini_model', 'gemini-1.5-flash');
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

  /**
   * Performance Analysis Summary
   * Summarizes monthly trends for executive reports.
   */
  async generatePerformanceSummary(tickets) {
    const genAI = getGenAI();
    if (!genAI || tickets.length === 0) return 'Not enough data for AI analysis or Gemini is unconfigured.';

    try {
      const modelName = configService.getSetting('gemini_model', 'gemini-1.5-flash');
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

  /**
   * Neural Vision Evidence Analysis
   * Validates photographic evidence using Gemini.
   */
  async analyzeImage(base64Image, mimeType) {
    const genAI = getGenAI();
    if (!genAI) return null;

    try {
      const modelName = configService.getSetting('gemini_model', 'gemini-1.5-flash');
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

  /**
   * Neural Broadcast Composition
   * Drafts a professional institutional announcement based on admin intent.
   */
  async composeBroadcastEmail(intent, tone = 'professional') {
    const genAI = getGenAI();
    if (!genAI) return 'AI composition system offline.';

    try {
      const modelName = configService.getSetting('gemini_model', 'gemini-1.5-flash');
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

module.exports = geminiService;
