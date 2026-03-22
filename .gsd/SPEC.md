---
status: FINALIZED
version: 1.0.0
updated: 2026-03-22
---

# Project Specification - Digital Grievance System

## 🎯 Vision Statement

Deliver a professional-grade portal that empowers users at institutions to file grievances, while using AI (Google Gemini) to categorize, prioritize, and assist in real-time resolutions, significantly reducing administrative overhead and increasing transparency.

## 🛠️ Technology Stack

- **Framework:** React 19 + Vite (Frontend)
- **Engine:** Node.js Express (Backend API)
- **Database:** Supabase (PostgreSQL + Realtime Channels)
- **Auth:** Supabase Auth (JWT & Magic Links)
- **Email:** NodeMailer (SMTP Transport Layer)
- **AI:** Google Gemini Neural Network (`@google/genai`)
- **Visuals:** Recharts, Framer Motion, TailwindCSS (Glassmorphism)

## 📦 Core Functional Requirements

### 1. User Authentication System
- Secure login for Grievants and Administrators.
- Persistent session storage in localStorage.
- Auto-routing based on User Role (Admin vs Authorize).

### 2. Intelligent Grievance Submission
- Multi-step form for subject, description, category, and urgency.
- Real-time AI Triage: Predicting the category and urgency level via description analysis.
- Live Realtime Sync: Dashboard updates automatically as soon as a new grievance is saved in Supabase.

### 3. Automated Notification Pipeline
- User Side: Instant verification OTPs and submission receipts via SMTP HTML templates.
- Admin Side: Automatic alerts for "High Urgency" action items.

### 4. ResolveBot (The AI Assistant)
- Floating Chat Widget that attempts to "Intercept" tickets by providing immediate solutions based on query analysis (Self-service module).

### 5. Admin Analytics Suite
- Distribution charts for grievance categories.
- Resolution velocity tracking.
- Global ticket management (Update status, resolution notes, AI-generated response suggestions).

## 🚀 Deployment Targets

- **Cloud Hub:** Render.com (Monorepo Node/React)
- **Repository:** GitHub (Master branch)

---

## 🔬 Success Metrics

- [x] Sub-500ms API response time.
- [x] 100% email delivery rate for OTPs.
- [x] Correct AI categorization for IT, Finance, and Academic queries.
- [ ] Successful public web accessible URL.
