---
phase: 10
plan: 1
wave: 1
---

# Plan 10.1: Supabase Storage & AI Multilingual Triage

## Objective
Implement scalable document storage using Supabase buckets for grievance attachments and integrate multilingual auto-translation via Google Gemini for seamless triage across languages.

## Context
- .gsd/SPEC.md
- src/pages/UserDashboard.jsx
- server/services/geminiService.js

## Tasks

<task type="auto">
  <name>Implement Supabase Attachment Storage</name>
  <files>src/pages/UserDashboard.jsx</files>
  <action>
    - Replace the simulated `uploadFile` method with the real Supabase Storage API (`supabase.storage.from('attachments').upload()`).
    - Use a randomly generated UUID for the file name to prevent collisions.
    - Retrieve the public URL via `supabase.storage.from('attachments').getPublicUrl()` and return it.
    - Ensure appropriate error handling (e.g., if upload fails, throw an error or show a toast).
  </action>
  <verify>grep -A 10 "const uploadFile" src/pages/UserDashboard.jsx</verify>
  <done>uploadFile resolves to a real Supabase URL instead of simulation.storage.gov.</done>
</task>

<task type="auto">
  <name>Implement Multilingual AI Triage</name>
  <files>server/services/geminiService.js, src/pages/UserDashboard.jsx</files>
  <action>
    - In `server/services/geminiService.js`, update the prompt in `analyzeGrievance`:
      Add a rule asking Gemini to detect if the text is non-English. If so, provide an English translation under the `"english_translation"` key in the JSON response. If it is English, return an empty string or null for that key.
    - In `src/pages/UserDashboard.jsx`, update `handleAiAnalyze`. If the backend response includes an `english_translation`, append it to the user's `description` state (e.g., `setDescription(prev => prev + "\n\n--- English Translation ---\n" + data.english_translation)`).
  </action>
  <verify>grep "english_translation" server/services/geminiService.js</verify>
  <done>Gemini prompt requests translations, and UserDashboard appends the translation if present.</done>
</task>

## Success Criteria
- [ ] Users can upload actual files to Supabase instead of a mock URL.
- [ ] Non-English grievance descriptions are automatically translated when the AI Triage button is clicked.
