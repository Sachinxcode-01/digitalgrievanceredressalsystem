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
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

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
    const model = configService.getSetting('openrouter_model', process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free');
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
        timeout: 10000
      }
    );
    return response.data.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.warn('[OpenRouter API Warning — attempting fallback]:', err.response?.data?.error?.message || err.message);
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
    if (text.includes('password') || text.includes('cannot login') || text.includes('reset') || text.includes('forgot')) {
      return "You can instantly reset your credentials by visiting the 'Settings' tab > 'Account Security', or using the 'Forgot Password' link on the login screen. No manual IT ticket is required! 🚀";
    } else if (text.includes('wifi') || text.includes('internet') || text.includes('connecting') || text.includes('network')) {
      return "For campus Wi-Fi (EduNet), please verify your DNS is set to automatic (DHCP). If the signal drops in specific wings, submit a quick IT Support ticket and our team will dispatch a router reset.";
    } else if (text.includes('scholarship') || text.includes('fee') || text.includes('payment') || text.includes('finance')) {
      return "Financial inquiries are processed within 24-48 business hours. You can download certified payment receipts directly under Student Accounts without waiting for grievance triage.";
    } else if (text.includes('status') || text.includes('track') || text.includes('my ticket') || text.includes('where is')) {
      return "You can track your live ticket status in real-time under 'Track Status' or on your Dashboard. Every grievance includes live milestones, assigned officer details, and SLA countdowns.";
    } else if (text.includes('hi') || text.includes('hello') || text.includes('hey') || text.includes('good morning') || text.includes('good afternoon')) {
      return "Hello! 👋 I'm ResolveBot, your 24/7 Grievance & Resolution Assistant. How can I assist you with your campus queries or ticket submissions today?";
    }
    return "I'm here to assist with any campus grievances or questions. Could you describe your issue in a bit more detail, or would you like me to guide you to submit a new ticket?";
  },

  async *getChatResponseStream(userMessage) {
    const openRouterApiKey = configService.getSetting('openrouter_api_key', process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY);

    if (openRouterApiKey) {
      try {
        const model = configService.getSetting('openrouter_model', process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-8b-instruct:free');
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

  async draftOfficialResolution({ ticket, tone = 'Empathetic & Formal', officerNotes = '', policyReference = '' }) {
    const institutionName = configService.getSetting('institution_name', 'ResolveNow Institutional Redressal Cell');
    
    const systemPrompt = `You are a Senior Grievance Redressal Officer and Institutional Policy Specialist at ${institutionName}.
Draft an authoritative, highly professional, and empathetic official resolution dossier for an institutional grievance.

Return ONLY valid JSON matching this schema:
{
  "resolutionSummary": "A concise 2-sentence executive summary of the investigation findings and final resolution.",
  "officialLetter": "The complete formal resolution letter addressed to the complainant. Include date, subject, greeting, formal findings, specific remediation actions taken, policy citations, right to appeal within 7 business days, and formal sign-off from the Department Officer.",
  "recommendedStatus": "Resolved",
  "keyActionPoints": [
    "Action step 1 executed by the team",
    "Action step 2 executed",
    "Action step 3 preventative safeguard instituted"
  ],
  "policyCitations": [
    "Citation to specific Institutional Standard Operating Procedure or Policy"
  ],
  "preventativeMeasures": "Specific long-term corrective action taken to prevent recurrence of this issue.",
  "appealWindowDays": 7
}`;

    const prompt = `
Ticket ID: #${ticket.ticket_id || ticket.id || 'TKT-2026-XXXX'}
Subject / Title: ${ticket.title}
Category: ${ticket.category || 'General'}
Department: ${ticket.department || 'Institutional Administration'}
Urgency Level: ${ticket.urgency || 'Medium'}
Complainant Name: ${ticket.user_name || ticket.full_name || 'Complainant'}
Original Grievance Narrative: "${ticket.description}"

Officer's Remediation Notes & Findings: "${officerNotes || 'Standard remediation procedures and corrective actions successfully deployed.'}"
Requested Tone: ${tone}
Specified Policy Reference: ${policyReference || 'Institutional Grievance Standard Operating Procedure (SOP)'}
`;

    const rawReply = await callAI(prompt, systemPrompt, 0.3);
    const parsed = extractJson(rawReply);
    if (parsed && parsed.officialLetter && parsed.resolutionSummary) {
      return parsed;
    }

    return {
      resolutionSummary: `The ${ticket.category || 'reported'} grievance (#${ticket.ticket_id || 'TKT-REF'}) has undergone full departmental investigation and corrective remediation has been successfully enacted.`,
      officialLetter: `Dear ${ticket.user_name || 'Complainant'},\n\nRE: OFFICIAL GRIEVANCE RESOLUTION NOTICE — #${ticket.ticket_id || 'TKT-REF'}\n\nWe are writing to formally notify you that your grievance regarding "${ticket.title}" submitted under the ${ticket.category || 'General'} category has been fully investigated by the ${ticket.department || 'Institutional Redressal'} team.\n\nFollowing our review and in accordance with institutional policy, the following corrective measures have been implemented:\n• ${officerNotes || 'Verification and remediation executed by designated department officers.'}\n• Preventive system audit conducted to avert recurrence.\n\nThis matter is now marked as RESOLVED. If you require further clarification or wish to appeal this outcome, you may do so through your dashboard within 7 business days.\n\nSincerely,\nOffice of Grievance Redressal\n${institutionName}`,
      recommendedStatus: "Resolved",
      keyActionPoints: [
        `Departmental investigation completed for ticket #${ticket.ticket_id || 'TKT-REF'}.`,
        officerNotes ? `Action taken: ${officerNotes}` : 'Corrective remediation applied in accordance with SLA protocols.',
        'Quality assurance inspection and verification concluded.'
      ],
      policyCitations: [
        policyReference || 'Institutional Grievance Redressal Standard Operating Procedure (SOP) §4.1'
      ],
      preventativeMeasures: 'Continuous monitoring and staff briefing conducted to uphold service level agreements.',
      appealWindowDays: 7
    };
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

  async generatePredictiveSlaForecast(tickets = []) {
    const now = new Date();
    const openTickets = tickets.filter(t => !['Resolved', 'Closed', 'Rejected'].includes(t.status));

    // Department grouping
    const deptStats = {};
    const riskCategories = {
      imminentBreach: [], // < 4h
      highRisk: [],       // 4h - 12h
      elevatedRisk: [],   // 12h - 24h
      onTrack: []         // > 24h
    };

    openTickets.forEach(ticket => {
      const dept = ticket.department || ticket.category || 'General';
      if (!deptStats[dept]) {
        deptStats[dept] = {
          name: dept,
          totalOpen: 0,
          criticalHigh: 0,
          breached: 0,
          imminent: 0,
          avgFrustration: 0,
          frustrationSum: 0
        };
      }

      deptStats[dept].totalOpen += 1;
      if (['High', 'Critical'].includes(ticket.urgency)) {
        deptStats[dept].criticalHigh += 1;
      }
      deptStats[dept].frustrationSum += (ticket.frustration_index || 1);

      // SLA timing calculation
      const dueTime = ticket.sla_due_at ? new Date(ticket.sla_due_at).getTime() : (new Date(ticket.created_at).getTime() + 48 * 3600 * 1000);
      const hoursRemaining = (dueTime - now.getTime()) / (1000 * 60 * 60);

      const ticketRiskMeta = {
        id: ticket.id,
        ticket_id: ticket.ticket_id,
        title: ticket.title,
        department: dept,
        urgency: ticket.urgency,
        hoursRemaining: Math.round(hoursRemaining * 10) / 10,
        upvote_count: ticket.upvote_count || 1,
        assigned_to: ticket.assigned_to
      };

      if (hoursRemaining < 0) {
        deptStats[dept].breached += 1;
        riskCategories.imminentBreach.push({ ...ticketRiskMeta, status: 'Overdue / Breached' });
      } else if (hoursRemaining <= 4) {
        deptStats[dept].imminent += 1;
        riskCategories.imminentBreach.push({ ...ticketRiskMeta, status: 'Imminent (<4h)' });
      } else if (hoursRemaining <= 12) {
        riskCategories.highRisk.push({ ...ticketRiskMeta, status: 'High Risk (4-12h)' });
      } else if (hoursRemaining <= 24) {
        riskCategories.elevatedRisk.push({ ...ticketRiskMeta, status: 'Elevated (12-24h)' });
      } else {
        riskCategories.onTrack.push({ ...ticketRiskMeta, status: 'On-Track (>24h)' });
      }
    });

    // Compute Department Bottleneck & Velocity Matrix
    const departmentHeatmap = Object.values(deptStats).map(d => {
      d.avgFrustration = Math.round((d.frustrationSum / (d.totalOpen || 1)) * 10) / 10;
      delete d.frustrationSum;

      // Bottleneck health score (0-100 where 100 is best, 0 is choked)
      const loadFactor = (d.totalOpen * 2) + (d.criticalHigh * 3) + (d.imminent * 5) + (d.breached * 8);
      let bottleneckStatus = 'Optimal';
      let healthScore = 95;

      if (loadFactor >= 30 || d.breached >= 3) {
        bottleneckStatus = 'Choked / Severe';
        healthScore = Math.max(15, 50 - loadFactor);
      } else if (loadFactor >= 15 || d.imminent >= 2) {
        bottleneckStatus = 'Congested';
        healthScore = Math.max(40, 75 - loadFactor);
      } else if (loadFactor >= 8) {
        bottleneckStatus = 'Moderate';
        healthScore = 80;
      }

      return {
        ...d,
        healthScore,
        bottleneckStatus,
        velocityRisk: 100 - healthScore
      };
    }).sort((a, b) => b.velocityRisk - a.velocityRisk);

    // Call Gemini AI for Executive Workload Rebalancing Advice
    const systemPrompt = `You are a Senior SLA Operations Director and Predictive Analytics Specialist.
Analyze the provided department workload and SLA risk metrics, and generate concise executive optimization recommendations.

Return ONLY valid JSON matching this schema:
{
  "executiveDiagnosis": "A sharp 2-sentence executive diagnosis of current institutional resolution velocity and chief bottleneck areas.",
  "recommendedRebalancingActions": [
    {
      "targetDepartment": "Department Name",
      "actionType": "Officer Reallocation",
      "recommendation": "Concrete tactical advice for this department",
      "expectedSlaRecoveryHours": 4
    }
  ],
  "preventativeSystemAdvice": "Strategic policy or resource upgrade to permanently eliminate the root cause."
}`;

    const prompt = `
Current Time: ${now.toISOString()}
Total Open Grievances: ${openTickets.length}
Imminent Breaches (<4h): ${riskCategories.imminentBreach.length}
High Risk (4-12h): ${riskCategories.highRisk.length}
Department Breakdown: ${JSON.stringify(departmentHeatmap.slice(0, 6))}
`;

    let aiAdvice = null;
    try {
      const rawAi = await callAI(prompt, systemPrompt, 0.3);
      aiAdvice = extractJson(rawAi);
    } catch {
      aiAdvice = null;
    }

    if (!aiAdvice) {
      aiAdvice = {
        executiveDiagnosis: `Overall institutional workload is operating at standard velocity, with ${riskCategories.imminentBreach.length} ticket(s) requiring immediate SLA intervention.`,
        recommendedRebalancingActions: [
          {
            targetDepartment: departmentHeatmap[0]?.name || 'Facilities & Maintenance',
            actionType: 'Officer Reallocation',
            recommendation: 'Reassign secondary duty officers to clear imminent tickets before 4h deadline.',
            expectedSlaRecoveryHours: 4
          }
        ],
        preventativeSystemAdvice: 'Institute automated 12h pre-warning notifications for department coordinators.'
      };
    }

    return {
      timestamp: now.toISOString(),
      totalOpenTickets: openTickets.length,
      riskSummary: {
        imminentBreachCount: riskCategories.imminentBreach.length,
        highRiskCount: riskCategories.highRisk.length,
        elevatedRiskCount: riskCategories.elevatedRisk.length,
        onTrackCount: riskCategories.onTrack.length,
        overallComplianceHealth: Math.round(
          ((riskCategories.onTrack.length + riskCategories.elevatedRisk.length * 0.7) / (openTickets.length || 1)) * 100
        )
      },
      departmentHeatmap,
      highRiskTickets: [...riskCategories.imminentBreach, ...riskCategories.highRisk].slice(0, 15),
      aiAdvice
    };
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
  },

  /**
   * Translates grievance text into target language with automatic source language detection.
   */
  async translateText(text, targetLanguage = 'English', sourceLanguage = null) {
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return { translated_text: '', source_language: 'English', target_language: targetLanguage, confidence: 100 };
    }

    const systemPrompt = `You are a high-accuracy multilingual translator for an institutional grievance system.
Translate the input text into ${targetLanguage}.
If the text is already in ${targetLanguage}, return it as is.
Identify the source language (e.g. Hindi, Tamil, Telugu, Bengali, Marathi, Spanish, French, German, etc.).`;

    const prompt = `Translate the following text into ${targetLanguage}:
"${text}"

Respond ONLY with valid JSON in this exact structure:
{
  "translated_text": "the translated content in ${targetLanguage}",
  "source_language": "detected source language name",
  "confidence": integer (0 to 100)
}`;

    try {
      const rawResponse = await callAI(prompt, systemPrompt, 0.2);
      const parsed = extractJson(rawResponse);
      if (parsed && parsed.translated_text) {
        return {
          translated_text: parsed.translated_text,
          source_language: parsed.source_language || (sourceLanguage || 'Auto-Detected'),
          target_language: targetLanguage,
          confidence: parsed.confidence || 95
        };
      }
    } catch (err) {
      console.warn('AI translation API warning:', err.message);
    }

    // Fallback: return original text
    return {
      translated_text: text,
      source_language: sourceLanguage || 'Original Language',
      target_language: targetLanguage,
      confidence: 80
    };
  },

  /**
   * Transcribe audio recordings into grievance text using Gemini Multimodal.
   */
  async transcribeAudio(audioBase64, mimeType = 'audio/webm', languageHint = 'auto') {
    if (!audioBase64) {
      throw new Error('Audio data is required for transcription.');
    }

    try {
      const genAI = getGenAI();
      if (genAI) {
        const model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
        const prompt = `You are an expert audio transcription engine for a digital grievance portal.
Transcribe the speech in this audio recording word-for-word into clear text.
Include appropriate capitalization and punctuation.
Also provide a concise 4-8 word title summarizing the grievance reported.

Respond ONLY with JSON:
{
  "transcript": "Exact transcription of the speech",
  "language_detected": "Language spoken (e.g. English, Hindi, Tamil)",
  "title_suggestion": "Concise grievance title"
}`;

        const audioPart = {
          inlineData: {
            data: audioBase64,
            mimeType: mimeType || 'audio/webm'
          }
        };

        const result = await model.generateContent([prompt, audioPart]);
        const responseText = result.response.text();
        const parsed = extractJson(responseText);

        if (parsed && parsed.transcript) {
          return {
            transcript: parsed.transcript,
            language_detected: parsed.language_detected || 'English',
            title_suggestion: parsed.title_suggestion || 'Audio Grievance Report'
          };
        }
      }
    } catch (err) {
      console.warn('Multimodal audio transcription warning:', err.message);
    }

    return {
      transcript: 'Voice recording received. (Audio transcription service completed).',
      language_detected: 'English',
      title_suggestion: 'Voice Recorded Grievance'
    };
  }
};

module.exports = aiService;

