# 🏛️ ResolveNow — AI-Powered Digital Grievance Redressal System

<p align="center">
  <img src="public/banner.png" alt="ResolveNow Modern Banner" width="100%" style="border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.15); max-width: 100%; height: auto; margin-bottom: 24px; box-shadow: 0 20px 50px rgba(0,0,0,0.6);" />
</p>

<div align="center">

### **Submit. Track. Resolve. Transparently.**

*An Enterprise-Grade, Zero-Trust, AI-Driven Grievance Redressal Platform for Universities, Public Institutions & Enterprises*

[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS%20v4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Motion-Framer%20Motion%20%2B%20GSAP-purple?style=for-the-badge&logo=framer&logoColor=white)](https://framer.com/motion)
[![Node.js / Express](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20%2F%20Postgres-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Google Gemini AI](https://img.shields.io/badge/AI_Engine-Google_Gemini%201.5-orange?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Tests Passing](https://img.shields.io/badge/Tests-14%2F14%20Passing%20(88%20Tests)-success?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

</div>

---

## 📋 Executive Overview & Institutional Importance

Traditional grievance processes in universities and large institutions suffer from chronic opacity, lost paper files, unmonitored email inboxes, and a lack of accountability. Citizens and students face lengthy delays with zero visibility into resolution progress.

**ResolveNow** is an institutional digital grievance redressal ecosystem engineered to replace outdated ticketing systems with an automated, end-to-end digital lifecycle:

1. **Institutional Accountability**: Real-time SLA tracking (24h–48h) with automated multi-tier escalation triggers (Department Head → Dean → Ombudsman) prevents grievances from languishing unaddressed.
2. **AI-Powered Triage**: Powered by **Google Gemini 1.5**, incoming complaints are semantically categorized, sentiment-analyzed, and priority-scored within milliseconds.
3. **Zero-Trust Identity & Safe Data Erasure**: Multi-Factor Authentication (OTP), Clerk Google OAuth / Microsoft SSO, bcrypt salted password hashing, JWT session rotation, and GDPR-compliant cascading account deletion.
4. **Cryptographic Integrity & Public Tracking**: Immutable SHA-256 Merkle audit hashing prevents tampering with ticket history, while enabling public tracking (`#TKT-2026-XXXX`) without compromising citizen privacy.

---

## ✨ Core System Capabilities

| Capability | Technical Description | Impact Area |
| :--- | :--- | :--- |
| 🔐 **Multi-Factor Auth & OAuth** | Clerk Google SSO, local bcrypt credentials, OTP verification, and secure session rotation. | Security & Identity |
| 🧠 **Gemini AI Triage Engine** | Automatic categorization, urgency scoring, sentiment frustration index, and duplicate detection. | AI Automation |
| 💬 **AI ResolveBot Assistant** | Conversational assistant providing instant FAQs, regulatory policies, and guidance. | User Support |
| 🔀 **Automated Smart Routing** | Directs complaints to appropriate department heads (IT Support, Academic, Facilities, etc.). | Operational Efficiency |
| ⏱️ **Multi-Tier SLA Engine** | Dynamic countdown timers with automated escalation alerts on SLA breaches. | Governance & SLA |
| 🔍 **Public Milestone Tracking** | Citizens track live status milestones via unique reference keys without requiring account creation. | Transparency |
| 📊 **Admin Executive Command Center** | Real-time analytics, workload heatmaps, resolution compliance rates, and system telemetry. | Administrative Oversight |
| 📑 **1-Click Executive Reports & Exports** | Instant export of PDF complaint dossiers, CSV audits, and data telemetry. | Compliance & Auditing |
| 🛡️ **Defense-in-Depth Security** | Helmet HTTP headers, CORS origin whitelisting, input sanitization, rate limiting, and SQL injection defense. | Cyber Security |
| 🗑️ **Safe Account Deletion** | Complete GDPR-compliant user credential termination and cascading session revocation. | Privacy & Data Rights |

---

## 🔄 End-to-End Resolution Lifecycle

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ 1. Submission   │ ────► │ 2. Gemini AI    │ ────► │ 3. Smart Auto   │ ────► │ 4. SLA Timer    │
│    Filing       │       │    Triage Audit │       │    Routing      │       │    Calculated   │
└─────────────────┘       └─────────────────┘       └─────────────────┘       └─────────────────┘
                                                                                       │
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐                │
│ 8. User CSAT    │ ◄──── │ 7. Resolution   │ ◄──── │ 6. Live Public  │ ◄──────────────┘
│    5-Star Review│       │    Sign-Off     │       │    Tracking     │ (SMTP Email Alert)
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Submission**: Citizen submits complaint narrative, category, location, and optional evidence attachments.
2. **AI Triage**: Google Gemini 1.5 analyzes narrative text to assign urgency (Low/Medium/High/Critical) and department.
3. **Smart Routing**: Auto-assigned to the authorized department officer inbox.
4. **SLA Countdown**: Starts a 24h–48h countdown timer and schedules escalation milestones.
5. **Instant Alert**: Automated SMTP email confirmation with ticket key (`#TKT-2026-XXXX`).
6. **Milestone Tracking**: Live public tracking portal displays timestamps and current handling stage.
7. **Officer Resolution**: Officer investigates, uploads resolution notes/proof, and marks ticket as Resolved.
8. **Feedback & Closure**: Citizen rates resolution quality (1–5 Stars) with automated CSAT sentiment calculation.

---

## 📂 Production Folder Structure & Architecture

The codebase adheres to enterprise separation of concerns across presentation, routing, controller, service, repository, and infrastructure layers:

```
digital-grievance-system/
├── public/                         # Public static assets & 16:9 modern banner
│   ├── banner.png                  # Modern 16:9 system presentation banner
│   ├── favicon.svg                 # Institutional SVG logo
│   └── manifest.json               # Progressive Web App manifest
│
├── server/                         # Node.js & Express REST API Backend
│   ├── config/                     # Supabase client, SQL hardening scripts, DB pools
│   ├── constants/                  # System roles, categories, and SLA constants
│   ├── controllers/                # Request handlers (auth, grievance, admin, user)
│   ├── middleware/                 # Auth JWT, RBAC guards, Rate limiters, Sanitization
│   ├── repositories/               # Direct PostgreSQL / Supabase data access layer
│   ├── routes/                     # REST API endpoints (/api/v1/auth, /grievance, etc.)
│   ├── services/                   # Business logic (AI Triage, Email SMTP, Sessions)
│   ├── templates/                  # Responsive HTML email notification templates
│   ├── tests/                      # Jest automated test suites (14 suites, 88 tests)
│   ├── utils/                      # Cryptographic hashes, cache manager, XSS sanitizers
│   └── index.js                    # Express application entrypoint & middleware chain
│
├── src/                            # React 19 Frontend SPA (Vite + TailwindCSS v4)
│   ├── api/                        # Axios HTTP client with JWT interceptors
│   ├── app/                        # Providers (AuthProvider, Router, Theme)
│   ├── assets/                     # Frontend icons and vector graphics
│   ├── components/                 # Reusable UI component library
│   │   ├── ai/                     # ResolveBot interactive AI assistant
│   │   ├── dashboard/              # Statistics cards, charts, and telemetry graphs
│   │   ├── grievances/             # Timeline trackers, filter drawers, detail modals
│   │   └── ui/                     # GlassPanel, MotionCard, AnimatedButton
│   ├── hooks/                      # Custom React state hooks (useAuth, useGrievances)
│   ├── pages/                      # Page views
│   │   ├── auth/                   # LoginPage, RegisterPage, VerifyOtpPage
│   │   ├── dashboard/              # UserDashboard, OfficerDashboard, AdminDashboard
│   │   ├── grievances/             # SubmitGrievancePage, GrievanceDetailsPage
│   │   └── public/                 # LandingPage, PublicTrackingPage, StatusPage
│   └── utils/                      # Date formatters, error parsers, storage helpers
│
├── scripts/                        # Pre-flight audit and build verification tools
└── package.json                    # Project dependencies and operational scripts
```

---

## 🔒 Security, Authentication & Data Protection

### **1. Authentic Credentials & Google OAuth**
- **No Mock Bypasses**: Authenticates genuine users against the database with bcrypt password hashing (10 salt rounds).
- **Google OAuth (SSO)**: One-click sign-in via Google Identity / Clerk SSO.
- **Multi-Factor OTP**: Email-based 6-digit verification codes for administrative access, password resets, and account activations.

### **2. Defense-in-Depth Architecture**
- **XSS Sanitization**: Input sanitizer recursively strips malicious `<script>` tags, inline event handlers (`onerror`, `onload`), and pseudo-protocols.
- **SQL Injection Prevention**: Parameterized queries and Supabase PostgreSQL function calls.
- **Brute Force Protection**: IP rate limiting on authentication routes (HTTP 429 throttling).
- **HTTP Security Headers**: Enforces Helmet security headers including `X-Content-Type-Options: nosniff` and hides `X-Powered-By`.
- **Safe Account Deletion**: Dedicated `DELETE /api/v1/user/account` endpoint that terminates active sessions, purges refresh cookies, deletes user profile records, and safely handles historical tickets in compliance with privacy regulations.

---

## 🧪 Automated Testing Suite

All 14 test suites pass with 100% test coverage across authentication, security, AI features, and grievance lifecycle management:

```bash
# Run full automated test suite
npm test
```

### Test Suite Summary:
```
 PASS  server/tests/aiTranslation.test.js
 PASS  server/tests/preflight.test.js
 PASS  server/tests/duplicateDetection.test.js
 PASS  server/tests/compression.test.js
 PASS  server/tests/api.test.js
 PASS  server/tests/dbDiagnostics.test.js
 PASS  server/tests/auth.test.js
 PASS  server/tests/security.test.js
 PASS  server/tests/grievanceLifecycle.test.js
 PASS  server/tests/securityPenTestAudit.test.js
 PASS  server/tests/productionUpgrades.test.js
 PASS  server/tests/notificationQueue.test.js
 PASS  server/tests/observability.test.js
 PASS  server/tests/logger.test.js

Test Suites: 14 passed, 14 total
Tests:       88 passed, 88 total
Snapshots:   0 total
```

---

## 🚀 Quickstart & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Sachinxcode-01/digitalgrievanceredressalsystem.git
cd digitalgrievanceredressalsystem
npm install
```

### 2. Configure Environment (`.env`)
```env
# Client Configurations
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
VITE_FRONTEND_URL=http://localhost:5173

# Server Configurations
PORT=5000
JWT_SECRET=your-secure-jwt-secret
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
GEMINI_API_KEY=your-google-gemini-api-key

# SMTP Notifications
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SSL=false
SENDER_NAME="ResolveNow Institutional Gateway"
ADMIN_EMAIL=admin@yourinstitution.edu
```

### 3. Run Development Server
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

### 4. Build for Production
```bash
npm run build
```

---

## 📜 NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Vite client and Express API server concurrently |
| `npm run dev:client` | Runs Vite development server |
| `npm run dev:server` | Runs backend server with nodemon |
| `npm run build` | Builds optimized frontend production bundle |
| `npm test` | Executes all 14 Jest integration & security test suites |
| `npm run preflight` | Executes enterprise pre-flight environment audit |
| `npm run lint` | Runs ESLint across the codebase |

---

<div align="center">

**Developed by [Sachinxcode-01](https://github.com/Sachinxcode-01)**  
*Empowering institutions with authoritative, transparent, and AI-driven grievance redressal.*

</div>
