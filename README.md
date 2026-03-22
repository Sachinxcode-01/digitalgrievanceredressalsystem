# 🚀 Digital Grievance Redressal System

A high-performance, enterprise-grade full-stack platform for institutional grievance management. Built with **React 19**, **Node.js**, **Supabase**, and **Google Gemini AI**.

---

## ✨ Features

- **🔐 Robust Authentication:** Secure user/admin login powered by Supabase Auth with real-time session persistence.
- **🧠 AI-Powered Triage:** Automatic categorization and urgency prediction for every submitted grievance via Google Gemini.
- **📧 Real-time Notifications:** Professional HTML email alerts for users (OTPs, Receipts) and high-priority SMS-style alerts for admins.
- **📊 Admin Control Center:** Live dashboard with data visualization (Recharts) to track resolution velocity and category distribution.
- **📱 Responsive Layout:** Glassmorphism UI optimized for all devices with a mobile-bottom navigation system.
- **💬 ResolveBot:** Integrated AI chatbot that attempts to resolve queries instantly before they become manual tickets.

---

## 🏗️ Technical Stack

- **Frontend:** React + Vite, TailwindCSS, Framer Motion, Lucide Icons
- **Backend:** Node.js, Express.js, Nodemailer
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
    SMTP_EMAIL=your_sender_email
    SMTP_PASSWORD=your_app_password
    ADMIN_EMAIL=target_admin_email
    ```

3.  **Run Development:**
    ```bash
    npm run dev
    ```

---

## 📡 API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/auth/send-otp` | Deliver secure OTP via SMTP |
| `POST` | `/api/grievances` | Submit new grievance + AI triage + Email |
| `GET` | `/api/grievances` | Fetch all records (Admin authorized) |
| `POST` | `/api/chat` | AI-based resolve bot interaction |

---

## 🗺️ Project Architecture

See the [Architecture Mapping](.gsd/ARCHITECTURE.md) for deep technical details and component flow diagrams.

---

<div align="center">
  <sub>Developed by **Sachinxcode-01** | Powering modern institutions.</sub>
</div>
