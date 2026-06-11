# 🏛️ ResolveNow — Digital Grievance Redressal System

<p align="center">
  <img src="public/banner.png" alt="ResolveNow Banner" width="100%" style="border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); margin-bottom: 24px;" />
</p>

<div align="center">

### *High-Performance, AI-Driven Institutional Grievance Redressal Platform*

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-Node%20%2F%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-Supabase%20%2F%20Postgres-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Google_Gemini%201.5-orange?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Auth](https://img.shields.io/badge/Auth-Clerk_SSO-6c47ff?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)
[![Styles](https://img.shields.io/badge/Styling-Tailwind_CSS_4.0-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## 📖 Project Overview

**ResolveNow** is an enterprise-grade, full-stack grievance management platform built for institutional transparency, fast resolution cycles, and intelligent administration. By merging **React 19** with **Supabase real-time sync**, secure **Clerk SSO auth**, and **Google Gemini AI**, ResolveNow completely automates the workflow from submission to resolution.

---

## ✨ System Features

*   **🔐 Clerk & Supabase Hybrid Auth:** Dual authentication security layer. Authenticates users via Clerk SDK (providing OAuth login for Google/Microsoft and session tokens) and propagates details atomically to Supabase tables via trigger functions.
*   **🧠 Gemini AI Triage & Translation:** Automates grievance classification (`Financial`, `Academic`, `Maintenance`, or `IT Support`), priorities (`High`, `Medium`, `Low`), and calculates a **Frustration Index (1-10)** from the user's input. Detects and translates non-English text automatically.
*   **💬 ResolveBot Streaming Assistant:** Features an interactive resolution chatbot with **Web Speech Text-to-Speech (TTS)** support. Users get streaming, context-aware answers generated via Gemini APIs.
*   **✏️ Neural Resolution Drafts:** Generates empathetic response suggestions and draft responses for administrators.
*   **🏢 Specialist Department Briefings:** Produces high-fidelity technical briefs for human specialists in finance, legal, IT, and maintenance based on grievance context.
*   **👁️ Gemini Vision Evidence Analysis:** Processes image attachments and PDF reports using multimodal vision models to extract damage severity and issues automatically.
*   **📢 Broadcast Email Composition:** AI-assisted communication tool allowing administrators to compose, review, and format institutional emails to users.
*   **📱 Android SMS Gateway Integration:** Integrates with local Android devices using the `android-sms-gateway` API to queue and send real-time SMS alerts (OTPs, urgent notifications).
*   **📧 SMTP Transactional Mailer:** Automated HTML notifications for verification OTPs, submission receipts, and status transitions using Nodemailer.
*   **🛡️ Terminal Audit Firewall:** Administrative panel logging sensitive security actions (`event`, `user_email`, `ip_address`, `location`, `level`) in real time, with PostgreSQL event replication.
*   **🌈 Premium High-Fidelity UI:** High-contrast design, supporting glassmorphism aesthetics, responsive layouts, Canvas Confetti triggers, and seamless theme switching (`Ocean` Indigo vs. `Midnight` Space).

---

## 🏗️ Technology Stack

| Core Layer | Technologies & Libraries |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS 4.0, Framer Motion, Lucide Icons, Recharts, Canvas-Confetti, vis.gl Google Maps |
| **Backend** | Node.js, Express.js, Nodemailer, android-sms-gateway |
| **Databases** | Supabase (PostgreSQL), Postgres Realtime Channels |
| **AI / ML** | Google Gemini 1.5 Flash (Generative AI & Multimodal Vision APIs) |
| **Testing & Tooling** | Jest, Supertest, ESLint, Concurrently, Nodemon |

---

## ⚡ Setup & Installation

### 📋 Prerequisites

Ensure you have the following installed on your system:
- **Node.js** `(>= 20.0.0)`
- **npm** `(>= 10.0.0)`
- A **Supabase** database project
- A **Clerk** application setup
- A **Google Gemini API Key**

---

### 🔧 Step-by-Step Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/Sachinxcode-01/digitalgrievanceredressalsystem.git
cd digitalgrievanceredressalsystem
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Setup Environment Configuration
Create a `.env` file in the root directory and add the following parameters:

```env
# Client-Side Variables (Vite)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
VITE_FRONTEND_URL=http://localhost:5173

# Server-Side Ports & Authentication
PORT=5000
JWT_SECRET=your-secure-jwt-secret-string

# Supabase Server SDK Credentials
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Clerk Server Credentials
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# Neural Intelligence API
GEMINI_API_KEY=your-google-gemini-api-key

# Transactional Mail Server (SMTP)
SMTP_EMAIL=your-system-sender-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SSL=false
SENDER_NAME="ResolveNow System"

# Administrative Alert Settings
ADMIN_EMAIL=admin-inbox@yourinstitution.edu

# Optional: Android SMS Gateway Configurations
SMS_GATEWAY_URL=http://your-phone-ip:8080/api/v1
SMS_GATEWAY_LOGIN=your_sms_gateway_login
SMS_GATEWAY_PASSWORD=your_sms_gateway_password
```

---

#### 4. Database Setup & Hardening
Apply database migrations to your Supabase PostgreSQL instance:
1. Open the **SQL Editor** in your Supabase Dashboard.
2. Open the file [database_hardening_v1.sql](file:///c:/Users/kalin/.gemini/antigravity/scratch/digital-grievance-system/server/config/database_hardening_v1.sql).
3. Copy its contents and run the script inside your Supabase SQL Editor. This will configure:
   - Optimized composite indexes for user sessions, OTPs, and grievances.
   - The atomic `register_user` stored procedure.
   - The atomic `sync_clerk_user` synchronization function.

#### 5. Supabase Storage Configuration
1. Go to the **Storage** section in your Supabase Dashboard.
2. Create a new public bucket named `attachments`.
3. Set the access policies to `Public` (or configure appropriate Select/Insert policies for authenticated users).

#### 6. Run the Application
Start the development server (client and server concurrently):
```bash
npm run dev
```

---

## 📡 API Reference Router

### AI & Triage Endpoints
| HTTP Method | Route Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/ai/analyze` | Generates category, urgency, and frustration sentiment |
| `POST` | `/api/ai/summarize` | Executive summary generator of institutional trends |
| `POST` | `/api/ai/elevate` | Compiles specialist briefings for designated departments |
| `POST` | `/api/ai/resolution` | Suggests draft resolutions for grievances |
| `POST` | `/api/chat` | Resolved Bot conversational chat interaction |

### Grievances & Auth Sync
| HTTP Method | Route Endpoint | Purpose |
| :--- | :--- | :--- |
| `POST` | `/api/auth/sync` | Syncs Clerk user session attributes into Supabase |
| `POST` | `/api/grievances` | Create a new grievance with attachments |
| `GET` | `/api/grievances` | Lists grievances (filtered by role or student ID) |
| `GET` | `/api/grievances/:id` | Fetch detailed grievance information & comment log |
| `PUT` | `/api/grievances/:id/status` | Transitions ticket status (`Open` -> `In Progress` -> `Resolved`) |

---

## ⚙️ NPM Scripts Index

| NPM Command | Execution Script | Description |
| :--- | :--- | :--- |
| `npm run dev` | `concurrently ...` | Launch Vite React dev server and Express nodemon API concurrently |
| `npm run dev:client` | `vite` | Launch Vite client development server (Localhost:5173) |
| `npm run dev:server` | `nodemon server/index.js`| Start Node API dev server with file reload |
| `npm run build` | `vite build && ...` | Compile production static code and run verification tests |
| `npm test` | `jest server/tests` | Execute security, auth, and database integration tests |
| `npm run lint` | `eslint .` | Verify codebase compliance against ESLint configuration |
| `npm start` | `node server/index.js`| Start backend server in production environment |

---

<div align="center">
  <sub>Developed by <b>Sachinxcode-01</b> | Built for modern institutions with secure, intelligent resolution.</sub>
</div>
