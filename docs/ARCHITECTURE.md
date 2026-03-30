# System Architecture - ResolveNow

## 🏗️ Technical Blueprint

ResolveNow is a high-performance, AI-driven grievance redressal portal built for maximum transparency and administrative efficiency. This document outlines the core architecture and data flow.

---

### 1. Frontend Architecture (React 19)
- **Component System**: Modular, atomic components styled with **Tailwind CSS** and custom Glassmorphism tokens.
- **State Management**: React Hooks + Context (for global theme/session) with **Realtime Supabase Channels** for live data sync.
- **Animations**: **Framer Motion** for physics-based UI transitions and reactive background gradients.
- **Theming**: Variable-based CSS system allowing instant switching between `Ocean` (High Contrast Blue) and `Midnight` (Deep Space Indigo).

### 2. Backend Engine (Node.js Express)
- **API Services**:
  - `grievanceService`: CRUD operations on Supabase with server-side validation.
  - `aiService`: Interfacial layer for the **Google Gemini 1.5 Pro** neural network.
  - `emailService`: **Nodemailer** transport layer for OTP and Status Trigger emails.
- **Security**: 
  - JWT Session verification for sensitive dashboard access.
  - Role-Based Access Control (RBAC) separating Authorizers (Users) from Controllers (Admins).

### 3. Neural Intelligence Layer (Google Gemini)
The system uses generative AI for:
- **Zero-Touch Triage**: Analyzing grievance descriptions to automatically assign category and urgency.
- **Sentiment Audit**: Calculating a `Frustration Index` (1-10) to help admins prioritize emotionally charged issues.
- **Neural Resolution Drafts**: Generating context-aware responses for admins to deploy with one click.

### 4. Data Layer (Supabase/PostgreSQL)
- **Relational Integrity**: 
  - `profiles`: User account metadata and role assignments.
  - `grievances`: The core ticket store with UUIDs and audit logs.
  - `ticket_comments`: Narrative history for every issue.
- **Realtime Pipeline**: Postgres Changes notifications broadcasted to the frontend for zero-refresh updates.

---

## 🚦 Security Protocol
- **Data at Rest**: AES-256 encryption via Supabase internal layers.
- **Verification**: 6-digit OTP Multi-Factor Authentication for identity assurance.
- **Admin Isolation**: Admin routes are protected by a middleware barrier ensuring only `role === 'admin'` can execute global resolutions.

---

## 🚀 Deployment Overview
The project is optimized for **Render.com** (Frontend/Backend) and uses **Supabase Cloud** for a distributed database footprint.
