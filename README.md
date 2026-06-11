# 🏛️ ResolveNow — Digital Grievance Redressal System

<p align="center">
  <img src="public/banner.png" alt="ResolveNow Banner" width="700" style="border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1); max-width: 100%; height: auto; margin-bottom: 16px;" />
</p>

<div align="center">

### *High-Performance, AI-Driven Institutional Grievance Redressal Platform*

[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Backend](https://img.shields.io/badge/Backend-Node%20%2F%20Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Database](https://img.shields.io/badge/Database-Supabase%20%2F%20Postgres-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![AI Engine](https://img.shields.io/badge/AI_Engine-Google_Gemini%201.5-orange?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![Auth](https://img.shields.io/badge/Auth-Clerk_SSO-6c47ff?style=for-the-badge&logo=clerk&logoColor=white)](https://clerk.com)

</div>

---

## 📖 What is ResolveNow?

**ResolveNow** is an intelligent web portal that makes submitting, tracking, and resolving institutional complaints (like university or workplace issues) fast, secure, and fully automated.

*   🔐 **Secure Logins:** Sign in securely with Google, Microsoft, or Email (powered by **Clerk**).
*   🧠 **Smart AI Triage:** The system uses **Google Gemini AI** to read complaints, categorize them instantly, and direct them to the correct department.
*   💬 **ResolveBot Assistant:** An AI-powered interactive chatbot with Text-to-Speech to help resolve simple issues instantly.
*   📱 **Instant Alerts:** Real-time updates via **Email** and **SMS notifications** as your complaint progresses.
*   🛡️ **Admin Audit Logs:** Real-time administrative firewall console to monitor system logs.

---

## ⚡ Quick 4-Step Setup

### Step 1: Clone and Install
Get the codebase and download all package dependencies:
```bash
git clone https://github.com/Sachinxcode-01/digitalgrievanceredressalsystem.git
cd digitalgrievanceredressalsystem
npm install
```

### Step 2: Environment Setup (`.env`)
Create a `.env` file at the project root and add your keys:
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

### Step 3: Initialize Supabase Database
1. Copy the code inside [database_hardening_v1.sql](file:///c:/Users/kalin/.gemini/antigravity/scratch/digital-grievance-system/server/config/database_hardening_v1.sql).
2. Paste and run it in the **SQL Editor** of your Supabase Dashboard to create indexes and sync functions.
3. Under **Storage** in Supabase, create a new public bucket named `attachments`.

### Step 4: Run the App
Launch both the frontend client and the backend server concurrently:
```bash
npm run dev
```
*Open `http://localhost:5173` to see it in action!*

---

## ⚙️ NPM Scripts Index

| NPM Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both client (React) and server (Express) concurrently |
| `npm run dev:client` | Launch Vite React development server |
| `npm run dev:server` | Launch Node Express backend server with nodemon auto-restart |
| `npm run build` | Builds production-optimized frontend bundle |
| `npm test` | Runs Jest integration and security tests |
| `npm run lint` | Checks codebase styling and lint compliance |

---

<div align="center">
  <sub>Developed by <b>Sachinxcode-01</b> | Built for modern institutions with secure, intelligent resolution.</sub>
</div>
