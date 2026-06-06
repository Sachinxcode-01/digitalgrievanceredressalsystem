# 🏁 Digital Grievance Redressal System v2.0 | System Handoff

Welcome to the definitive institutional portal for intelligent grievance management. This high-fidelity system bridges the gap between user concerns and administrative action using cutting-edge AI.

---

## 🏗️ System Overview

- **Frontend**: React 19 + Vite (Turbo-charged SPA)
- **Backend**: Node.js + Express (Neural Controller)
- **Database**: Supabase PostgreSQL (Persistence + Real-time)
- **Intelligence**: Google Gemini-1.5-Flash (Neural Triage & Performance Audit)

---

## 🧠 Intelligence Engine

The system features a dual-layer AI architecture:
1.  **Neural Triage**: Automatically categorizes grievances into **IT, Finance, Academic, or Maintenance** and calculates a **Frustration Index (1-10)** to help admins prioritize accurately.
2.  **ResolveBot**: A conversational interface that attempts to solve queries instantly before they escalate to manual tickets.
3.  **Auditor AI**: Analyzes full institutional data to generate **Executive Summaries** and identify systemic bottlenecks.

---

## 🛡️ Administrative Control Center

- **Strategic Dashboard**: Recharts-powered data visualization of grievance volume and resolution velocity.
- **Specialist Elevation**: One-click generation of technical briefings for Legal, IT, and Finance departments.
- **Zero-Trust Audit Logs**: A terminal-style interface accessible via the **Security Audit** tab to track all administrative actions with timestamped logs.
- **Rainbow UI Protocol**: High-feedback interactive elements (RainbowButtons) for critical tasks like Resolving and Reporting.

---

## 👤 User Experience (Grievant)

- **Neural Timeline**: Multi-step tracking with real-time updates as the ticket moves from *Submitted* → *In-Progress* → *Resolved*.
- **Evidence Attachment**: Full support for uploading images/PDFs to validate institutional claims.
- **Voice Synthesis (TTS)**: Audible resolution updates via ResolveBot for enhanced accessibility.
- **Zero-Lapse Session**: Persistent login state ensuring users can return to their dashboard anytime without losing context.
- **Interactive Neural Pulse**: A high-end, mouse-following radial glow effect that provides immediate visual feedback and a premium "Deep Space" feel.
- **SLA Countdown Tracking**: Real-time resolution timers for every ticket, calculated based on institutional urgency protocols.
- **Institutional Dossier Export**: One-click generation of branded PDF reports for every grievance, including full incident logs and metadata for offline records.

---

## 🔧 Infrastructure & Security (v2.1 Update)

- **Production Network Binding**: The backend is now explicitly bound to `0.0.0.0`, ensuring cross-platform reachability and resolving common local network conflicts.
- **Supabase RLS Hardening**: Implemented explicit security policies for the `otp_codes` table, securing the authentication pipeline while allowing the backend to manage transient state safely.
- **Optimized Proxying**: Vite configuration has been stabilized to target `127.0.0.1`, mitigating IPv6 resolution delays for a snappier development and production experience.

---

## ⚡ Deployment & Maintenance

1.  **Build**: `npm run build`
2.  **Cloud Deployment**: 
    - Frontend: Vercel / Netlify
    - Backend: Render / Heroku
3.  **Key Environment Variables**:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `GEMINI_API_KEY`
    - `SMTP_EMAIL` / `SMTP_PASSWORD`

---

## 🚀 Final Acceptance Checklist

- [x] Secure OTP-based or Google OAuth Login
- [x] Real-time Database Channels Active
- [x] AI Sentiment Analysis working correctly
- [x] Executive Report Generation (CSV + AI Summary)
- [x] SMTP Email Notification System
- [x] High-Fidelity Rainbow UI & Particle Backgrounds

**The Digital Grievance Redressal System is now fully operational and ready for institutional launch.** 🏆
