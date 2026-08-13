# 🏛️ ResolveNow — AI-Powered Digital Grievance Redressal System

<p align="center">
  <img src="public/banner.png" alt="ResolveNow Banner" width="800" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.15); max-width: 100%; height: auto; margin-bottom: 20px; shadow: 0 20px 40px rgba(0,0,0,0.5);" />
</p>

<div align="center">

### **Submit. Track. Resolve. Transparently.**

*A Next-Generation, Zero-Trust, AI-Driven Grievance Redressal Platform for Universities, Institutions & Enterprises*

[![React 18](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%20v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Motion-Framer%20Motion%20%2B%20GSAP-purple?style=for-the-badge&logo=framer&logoColor=white)](https://framer.com/motion)
[![Node.js / Express](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20%2F%20Postgres-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Google Gemini AI](https://img.shields.io/badge/AI_Engine-Google_Gemini%201.5-orange?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Clerk SSO](https://img.shields.io/badge/Auth-Clerk_SSO-6c47ff?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Executive Overview

**ResolveNow** is an enterprise-grade digital grievance redressal platform engineered to transform how higher-education institutions, corporate enterprises, civic bodies, and organizations handle complaints. It replaces slow, unmonitored paper files and email threads with an automated, end-to-end digital lifecycle.

Powered by **Google Gemini 1.5 AI**, ResolveNow automatically categorizes submitted narrative grievances, detects urgency priority and sentiment frustration indexes, routes tickets to the appropriate department head, tracks **24h–48h Service Level Agreement (SLA)** countdown timers, and provides real-time public milestone tracking using cryptographic ticket keys.

---

## ✨ 14 Core System Features

| Feature | Description | Category |
| :--- | :--- | :--- |
| 🔐 **Multi-Factor Authentication & SSO** | Secure identity verification with Clerk OAuth (Google/Microsoft) and local sandbox OTP login. | Security & Auth |
| 🧠 **Google Gemini AI Triage Engine** | Real-time semantic analysis, automated categorization, sentiment index, and urgency scoring. | AI Core |
| 💬 **Interactive AI ResolveBot** | Streaming conversational AI assistant providing immediate guidance and automated troubleshooting. | Assistant |
| 🔀 **Automated Departmental Routing** | Instant ticket dispatch to appropriate officer terminals based on AI classification. | Workflow |
| ⏱️ **SLA Countdown & Auto-Escalation** | Strict 24h–48h SLA timers enforcing officer accountability with automated alert triggers. | SLA Management |
| 🔍 **Public Ticket Tracking** | Instant milestone tracking using unique reference ticket keys (`#TKT-2026-XXXX`) without logging in. | Transparency |
| 📊 **Admin Executive Command Center** | Real-time workload graphs, departmental compliance metrics, and KPI analytics dashboards. | Analytics |
| 📁 **Secure Evidence Storage** | Attach evidence documents, photos, or screenshots up to 5MB via encrypted Supabase Storage buckets. | Storage |
| 📧 **Automated SMTP Email & SMS Alerts** | Instant email notifications dispatched on ticket filing, status reassignment, and resolution sign-off. | Notifications |
| 📑 **1-Click Executive Reports & Exports** | Generate verified PDF complaint dossiers, CSV data dumps, and Excel analytical reports instantly. | Reporting |
| 🛡️ **Immutable Audit Logging** | Row-level security (RLS) policies and complete security audit trails tracking every status modification. | Security |
| 👥 **Granular Role-Based Access (RBAC)** | Role clearances tailored for Students, Department Officers, Administrators, and Super Admins. | Clearances |
| 🎨 **High-End Doppelrand Glass UI** | Built with double-bezel concentric cards, floating island navbar, and GSAP typewriter motion. | User Interface |
| ⚡ **Production Ready Architecture** | Fully optimized React 18 SPA + Node/Express REST API with unit testing & post-build verification. | Performance |

---

## 🔄 End-to-End 8-Step Resolution Process

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. User Submits │ ────► │ 2. Gemini AI    │ ────► │ 3. Smart Auto   │ ────► │ 4. SLA Timer    │
│    Grievance    │       │    Triage Audit │       │    Routing      │       │    Calculated   │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
                                                                                       │
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐                │
│ 8. User 5-Star  │ ◄──── │ 7. Officer      │ ◄──── │ 6. Live Public  │ ◄──────────────┘
│    Feedback     │       │    Sign-Off     │       │    Tracking     │ (SMTP Email Alert)
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

### Detailed Lifecycle Stages:
1. **User Submits Grievance**: User enters grievance subject, narrative description, category, and optional evidence attachments.
2. **Gemini AI Triage Analysis**: Gemini 1.5 Pro analyzes narrative text to assign category, urgency score (Low / Medium / High / Critical), and sentiment index.
3. **Smart Auto-Routing**: Ticket is automatically assigned and dispatched to the designated department head's command queue.
4. **SLA Due Date Calculation**: System initializes a strict 24h–48h SLA timer and schedules escalation warnings.
5. **Automated Email Dispatch**: System sends an SMTP email receipt with a unique cryptographic tracking reference (`#TKT-2026-8812`).
6. **Real-Time Public Tracking**: User and stakeholders monitor live progress milestones via the public tracking portal.
7. **Officer Resolution Sign-Off**: Assigned officer investigates, attaches resolution notes/proof, and marks ticket as Resolved.
8. **User Feedback Rating**: User receives resolution notice and completes a 5-star quality rating and feedback survey.

---

## 🛠️ Technology Stack Architecture

### **Frontend Client**
- **Core Framework**: React 18, Vite
- **Styling System**: TailwindCSS v4, Vanilla CSS
- **Animation Physics**: Framer Motion, GSAP (`@gsap/react`), 21st.dev Design System
- **Icons & UI Utilities**: Lucide React, `clsx`, `tailwind-merge`, `class-variance-authority`
- **Charts & Export Tools**: Recharts, HTML2Canvas, jsPDF

### **Backend & Database**
- **Server Environment**: Node.js, Express REST API
- **Database Engine**: Supabase (PostgreSQL with Row-Level Security RLS)
- **AI Intelligence**: Google Gemini 1.5 API
- **Authentication**: Clerk React SDK, JWT (JSON Web Tokens) with refresh rotation, OTP Verification
- **Email System**: Nodemailer SMTP Integration

---

## 🚀 Quick Setup & Installation Guide

### Prerequisites
- Node.js `v18.x` or `v20.x`
- npm `v9.x` or higher
- Supabase Account & Project
- Google Gemini AI API Key
- Clerk Account (Optional for OAuth)

---

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/Sachinxcode-01/digitalgrievanceredressalsystem.git
cd digitalgrievanceredressalsystem
npm install
```

---

### Step 2: Configure Environment Variables (`.env`)
Create a `.env` file in the root directory:

```env
# Client Configurations
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
VITE_FRONTEND_URL=http://localhost:5173

# Server Configurations
PORT=5000
JWT_SECRET=your-secure-jwt-secret
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
GEMINI_API_KEY=your-google-gemini-api-key

# Notifications (SMTP Mail Server)
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SSL=false
SENDER_NAME="ResolveNow System"
ADMIN_EMAIL=admin-inbox@yourinstitution.edu
```

---

### Step 3: Database & Storage Initialization
1. Copy the SQL hardening script from [`server/config/database_hardening_v1.sql`](file:///c:/Users/kalin/.gemini/antigravity/scratch/digital-grievance-system/server/config/database_hardening_v1.sql).
2. Execute the script in the **SQL Editor** of your Supabase Dashboard to create tables, indexes, triggers, and RLS security policies.
3. In your Supabase Dashboard under **Storage**, create a public bucket named `attachments`.

---

### Step 4: Run Development Environment
Start both the React frontend client and the Express backend server concurrently:
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

---

## 🧪 Testing & Production Build

### Run Integration & Security Tests
```bash
npm test
```
*Executes Jest test suites verifying auth routes, security middleware, and API endpoints.*

### Build for Production
```bash
npm run build
```
*Compiles optimized Vite production assets and executes post-build verification script.*

---

## 📜 NPM Scripts Index

| NPM Command | Description |
| :--- | :--- |
| `npm run dev` | Runs client (Vite) and server (Express) concurrently |
| `npm run dev:client` | Launches Vite React development client |
| `npm run dev:server` | Launches Node Express API server with nodemon |
| `npm run build` | Builds production SPA bundle and runs asset verification |
| `npm test` | Runs Jest integration, security, and auth test suites |
| `npm run lint` | Checks codebase syntax and lint compliance |

---

## 📂 Project Directory Structure

```
digital-grievance-system/
├── public/                     # Static public assets and images
├── server/                     # Express REST API backend
│   ├── config/                 # Supabase, DB hardening, and SMTP configs
│   ├── controllers/            # Auth, Grievance, Admin controllers
│   ├── middleware/             # Security, JWT, Rate Limiter middleware
│   ├── repositories/           # Data repository layer
│   ├── routes/                 # Express API routes (/api/v1/...)
│   ├── services/               # Gemini AI & Email notification services
│   └── tests/                  # Jest integration & security tests
├── src/                        # React Frontend SPA
│   ├── api/                    # Axios client & token interceptors
│   ├── app/                    # Auth Context Provider & Router state
│   ├── components/             # Reusable UI, Glass, Motion & AI components
│   │   ├── ai/                 # ResolveBot Assistant
│   │   ├── grievances/         # Delivery tracking & detail widgets
│   │   └── ui/                 # Doppelrand GlassPanel, FeatureCard, FAQ, Navbar
│   ├── pages/                  # Application pages (Landing, Admin, Dashboards, Auth)
│   └── utils/                  # Auth mode, error handlers & helpers
├── scripts/                    # Post-build verification scripts
└── package.json                # Project dependencies & scripts
```

---

## 🔒 Security & Compliance
- **ISO-27001 Compliance**: Zero-trust authentication design with multi-factor OTP verification.
- **Row-Level Security (RLS)**: Supabase PostgreSQL security policies ensuring users only access authorized grievance records.
- **Token Interceptor**: Memory-based JWT storage with automatic 300ms fallback timeout.

---

<div align="center">

**Developed by [Sachinxcode-01](https://github.com/Sachinxcode-01)**  
*Empowering institutions with authoritative, transparent, and AI-driven grievance redressal.*

</div>
