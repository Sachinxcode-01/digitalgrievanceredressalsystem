const { GoogleGenerativeAI } = require("@google/generative-ai");
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Core AI Service Engine (Gemini Pro)
 */
const geminiService = {
  /**
   * Neural Triage Analysis
   * Performs deep semantic analysis to categorize and prioritize grievances.
   */
  async analyzeGrievance(description) {
    if (!genAI) return null; // Fallback to legacy logic in aiService

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are an institutional grievance analyzer. Analyze this grievance description:
        "${description}"

        Rules:
        1. Categorize as: 'Financial', 'Academic', 'Maintenance', or 'IT Support'.
        2. Assign Urgency: 'High', 'Medium', or 'Low'.
        3. Respond ONLY in JSON format: { "category": "...", "urgency": "..." }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON (strip markdown if necessary)
      const cleanJson = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson);
    } catch (err) {
      console.error("Gemini Neural Triage Error:", err);
      return null;
    }
  },

  /**
   * Neural Chat Intercept
   * Conversational resolution bot.
   */
  async getChatResponse(userMessage) {
    if (!genAI) return null;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
      console.error("Gemini Chat Neural Error:", err);
      return null;
    }
  },

  /**
   * Neural Admin Suggestion Prototype
   * Helps admins draft professional and effective resolutions.
   */
  async generateResolutionSuggestion(ticket) {
    if (!genAI) return null;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
      console.error("Gemini Resolution Suggestion Error:", err);
      return null;
    }
  }
};

module.exports = geminiService;
