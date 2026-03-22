---
phase: 2
plan: 1
wave: 1
gap_closure: false
---

# Plan 2.1: Neural Intelligence Integration (Gemini Pro)

## Objective
Upgrade the current logic-based triage and ResolveBot to use the **Google Gemini Pro** Generative AI model. This will allow for nuanced understanding of grievances and conversational AI capabilities in the chatbot.

## Context
Load these files for context:
- .gsd/SPEC.md
- server/index.js
- server/services/aiService.js
- server/routes/chatRoutes.js

## Tasks

<task type="auto">
  <name>Install Gemini SDK & Service Wrapper</name>
  <files>
    package.json
    server/services/geminiService.js
  </files>
  <action>
    1. Install '@google/generative-ai' via root package.json.
    2. Create a generic 'geminiService.js' that handles model initialization and prompting.
    3. Ensure it pulls GEMINI_API_KEY from environment variables.

    AVOID: Hardcoding API keys.
    USE: Safety settings in the model config to filter out harmful content.
  </action>
  <verify>
    npm list @google/generative-ai
  </verify>
  <done>
    SDK is installed and wrapper service correctly exports 'generateResponse' function.
  </done>
</task>

<task type="checkpoint:decision">
  <name>Collect Gemini API Key</name>
  <action>
    Pause to allow User to provide their Gemini API Key from Google AI Studio.
  </action>
</task>

## Must-Haves
- [ ] Integration with existing routes without breaking the pattern-matching fallback.

## Success Criteria
- [ ] Backend survives missing API key (Graceful degradation to pattern-matching).
- [ ] True neural responses generated when key is provided.
