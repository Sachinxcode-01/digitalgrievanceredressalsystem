# Phase 10 Research: Scalable Intelligence & Storage

## 1. Document/Evidence Storage (Supabase)
**Current State:** 
In `UserDashboard.jsx`, the `uploadFile` function is currently simulated, returning a fake `simulation.storage.gov` URL. 
**Implementation Strategy:**
- We need to create a bucket named `attachments` in the Supabase project.
- We must update `uploadFile` in `UserDashboard.jsx` to use `supabase.storage.from('attachments').upload(...)`.
- We then need to retrieve the public URL via `supabase.storage.from('attachments').getPublicUrl(...)` and return that actual URL to be saved in the database.
- The `grievances` table already supports inserting `attachment_url` (it is sent in the payload but currently receives the simulated URL and gets saved).
- Note: The bucket should be public so that admins and users can view the attachments without signed URLs for simplicity, or we use signed URLs if it's private. Given the platform, a public bucket with unguessable UUID paths is easiest for Phase 10.

## 2. Multilingual Triage Support (Gemini)
**Current State:**
The AI categorizes text into Financial, Academic, Maintenance, or IT Support, and assigns Urgency and Frustration.
**Implementation Strategy:**
- We can modify the `analyzeGrievance` prompt in `server/services/geminiService.js` to also translate the text to English if it detects a foreign language.
- The AI will return a new JSON key `"english_translation"`.
- We will update the frontend's `handleAiAnalyze` to append this translation to the user's description (e.g., `Original: ... \n\n Translated (English): ...`), or we modify `ticket` creation on the backend.
- Modifying the frontend `handleAiAnalyze` is better because the user can visibly see and verify the translation before submission!

**Conclusion:** 
These two updates require modifying `UserDashboard.jsx` and `server/services/geminiService.js`.
