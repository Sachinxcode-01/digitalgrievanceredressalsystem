# 🚀 Digital Grievance Redressal System v2.0

A high-performance, enterprise-grade full-stack platform for institutional grievance management. Built with **React 19**, **Node.js**, **Supabase**, and **Google Gemini AI**.

---

## ✨ Features

- **🔐 Robust Authentication:** Secure user/admin login powered by Supabase Auth with real-time session persistence.
- **🧠 AI-Powered Triage:** Automatic categorization and urgency prediction for every submitted grievance via Google Gemini.
- **📧 Real-time Notifications:** Professional HTML email alerts for users (OTPs, Receipts) and high-priority SMS-style alerts for admins.
- **📊 Executive Control Center:** Advanced dashboard with AI Performance Summaries and "Frustration Index" tracking.
- **🎙️ Neural Accessibility:** ResolveBot integrated with **Web Speech TTS** for audible AI assistance.
- **🛡️ Zero-Trust Security:** Terminal-style security audit logs tracking every sensitive administrative action.
- **🌈 Premium UI:** High-fidelity glassmorphism interface with **Rainbow Components** and dynamic particle backgrounds.
- **📁 Evidence Handling:** Full support for file attachments (Images/PDFs) to validate institutional claims.

---

## 🏗️ Technical Stack

- **Frontend:** React 19 + Vite, TailwindCSS, Framer Motion, Lucide Icons, Recharts, Canvas-Confetti
- **Backend:** Node.js, Express.js, Nodemailer
- **AI Engine:** Google Gemini 1.5 Flash (Performance Audits & Triage)
- **Database:** Supabase (PostgreSQL) + Realtime Channels
- **Methodology:** [GSD (Get Shit Done)](.gsd/ARCHITECTURE.md) for Antigravity

---

## ⚡ Quick Start

1.  **Clone & Install:**
    ```bash
    git clone https://github.com/Sachinxcode-01/digitalgrievanceredressalsystem.git
    npm install
    ```

2.  **Environment Setup:**
    Configure your `.env` file at the root:
    ```env
    VITE_SUPABASE_URL=your_url
    VITE_SUPABASE_ANON_KEY=your_key
    GEMINI_API_KEY=your_google_ai_key
    SMTP_EMAIL=your_sender_email
    SMTP_PASSWORD=your_app_password
    ADMIN_EMAIL=target_admin_email
    ```

3.  **OAuth Configuration (Institutional SSO):**
    To use Google or Microsoft (Azure) login:
    - Enable **Google** and **Azure** providers in your Supabase Auth Dashboard.
    - Set the **Redirect URLs** in Supabase to both `http://localhost:5173` and your Production Application URL.

3.  **Run Development:**
    ```bash
    npm run dev
    ```

---

## 📡 AI API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/ai/summarize` | AI-generated executive institutional audit |
| `POST` | `/api/ai/elevate` | Generate specialist briefing for legal/IT/finance |
| `POST` | `/api/chat` | AI-based resolve bot conversational interface |
| `POST` | `/api/grievances` | Submit grievance with automated AI triage |

---

## 🗺️ Project Architecture

See the [Architecture Mapping](.gsd/ARCHITECTURE.md) for deep technical details and component flow diagrams.

---

<div align="center">
  <sub>Developed by **Sachinxcode-01** | Powering modern institutions with Intelligent Redressal.</sub>
</div>
