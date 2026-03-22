# Express.js Backend for Digital Grievance System

This is the Node.js/Express.js backend for the Digital Grievance System.

## Setup

1. The backend is located in the `server/` directory.
2. Dependencies are already installed if you ran `npm install` in the root (via postinstall or manual run).
3. The environment variables are loaded from `server/.env`.

## Endpoints

- `GET /` - Health check.
- `GET /api/grievances` - Fetch all grievances.
- `POST /api/grievances` - Create a new grievance.
- `POST /api/ai/analyze` - AI-powered triage of grievance descriptions.

## Running

You can run the backend independently from the `server/` directory:
```bash
npm start
```

Or from the root directory along with the frontend:
```bash
npm run dev
```
