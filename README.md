# 🚀 ReachInbox — Full-Stack Email Job Scheduler

A production-grade, distributed email scheduling service and real-time frontend dashboard built for scale. Accepts email send requests via API, schedules delayed jobs using **BullMQ + Redis**, persists campaigns & jobs in **PostgreSQL**, and dispatches emails using **Ethereal SMTP**.

---

## 🛠 Tech Stack

### Backend
- **Language**: TypeScript (`Node.js`)
- **Framework**: Express.js
- **Queue System**: BullMQ (backed by Redis)
- **Database**: PostgreSQL (`pg` connection pool with relational schema)
- **SMTP Engine**: Ethereal Email (`nodemailer`)
- **Authentication**: Google OAuth 2.0 (`google-auth-library` + `express-session`)

### Frontend
- **Framework**: React.js (`Vite`) with TypeScript
- **Routing**: TanStack Router
- **Data Fetching**: TanStack React Query
- **Styling**: Tailwind CSS v4 (Dark mode UI inspired by Figma design)
- **Notifications**: Sonner

---

## 📋 Features & Assignment Requirements Checklist

### 🖥 Backend Requirements
- [x] **Core Scheduler**: Accepts schedule requests via REST API, stores metadata in PostgreSQL, and enqueues delayed jobs into BullMQ.
- [x] **No Cron Jobs**: Driven entirely by BullMQ delayed jobs (`delay: ms`). Zero OS or Node cron libraries used.
- [x] **State Persistence & Survival on Restart**: Jobs and campaign states are committed to PostgreSQL prior to queue insertion. On server restart, BullMQ reads delayed jobs directly from Redis while PostgreSQL keeps full campaign history.
- [x] **Idempotency & Duplicate Prevention**: Database unique constraints on `idempotency_key` (`${campaignId}:${recipientEmail}`) combined with BullMQ custom `jobId` deduplication prevent duplicate email dispatches.
- [x] **Configurable Worker Concurrency**: BullMQ `Worker` instance reads `WORKER_CONCURRENCY` from environment variables (default: `3`).
- [x] **Minimum Delay Between Emails**: Configurable staggering (`delaySeconds`) between recipient dispatches within a campaign to mimic provider throttling.
- [x] **Rate Limiting (Emails Per Hour)**: Sliding hourly window counter in Redis (`rate:${hourWindow}`). When `HOURLY_RATE_LIMIT` (e.g. 100/hr) is hit, jobs are non-destructively delayed to the start of the next hour window rather than dropped.
- [x] **Multiple Senders**: Support for multiple sender profiles in PostgreSQL linked to users.

### 🎨 Frontend Requirements
- [x] **Google OAuth Login**: Authenticates via Google OAuth 2.0 and redirects to dashboard on completion.
- [x] **Header Profile Bar**: Displays authenticated user's name, email address, avatar, and a logout action button.
- [x] **Dashboard Layout**: Includes sub-routes for **All Emails**, **Scheduled Emails**, and **Sent Emails**.
- [x] **Compose New Email Modal**:
  - Subject and HTML/Text body inputs.
  - Interactive Lead File Uploader (CSV / TXT parsing with automatic email detection & deduplication).
  - Recipient chip management (add manually or upload batch).
  - Datetime picker for precise future scheduling.
- [x] **Status Tables**: Clean tables with color-coded status badges (`scheduled`, `sending`, `sent`, `failed`), loading indicators, and empty state illustrations.

---

## 🏗 Architecture Overview

```
 ┌──────────────────────┐         ┌──────────────────────┐
 │   React Frontend     │────────>│   Express API        │
 │  (Port 5173 / Vite)  │  HTTP   │  (Port 5000 / TS)    │
 └──────────────────────┘         └──────────┬───────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
            ┌──────────────────────┐                    ┌──────────────────────┐
            │   PostgreSQL DB      │                    │     Redis Cloud      │
            │ (Persisted Campaigns │                    │ (BullMQ Job Queue &  │
            │  & Scheduled Emails) │                    │  Hourly Rate Limit)  │
            └──────────────────────┘                    └──────────┬───────────┘
                                                                   │
                                                                   ▼
                                                        ┌──────────────────────┐
                                                        │   BullMQ Worker      │
                                                        │ (Concurrency & Delay)│
                                                        └──────────┬───────────┘
                                                                   │
                                                                   ▼
                                                        ┌──────────────────────┐
                                                        │    Ethereal SMTP     │
                                                        │  (Test Email Engine) │
                                                        └──────────────────────┘
```

### 1. How Scheduling Works
1. Client submits a POST to `/api/emails/schedule` containing subject, body, recipients list, and `scheduledAt`.
2. Backend creates a record in `email_campaigns` and individual records in `scheduled_emails` with a calculated `idempotency_key`.
3. For each recipient, a delayed job is pushed to BullMQ (`emailQueue.add('send-email', data, { delay, jobId })`).

### 2. How Persistence & Restart Survival Is Handled
- **Before Queueing**: Every job is recorded in PostgreSQL with status `'scheduled'`.
- **In-Queue**: BullMQ persists delayed jobs in Redis.
- **On Server Restart**: Redis retains queued delayed jobs; when Express starts back up, the BullMQ Worker automatically picks up pending jobs at their scheduled execution time.

### 3. Rate Limiting & Concurrency Architecture
- **Worker Concurrency**: Set via `WORKER_CONCURRENCY` env variable.
- **Hourly Rate Limiter**: The worker increments a Redis key `rate:<current_hour_timestamp>`. If the counter exceeds `HOURLY_RATE_LIMIT`, the worker calls `job.moveToDelayed(next_hour_timestamp)` to reschedule the email to the next available window without failing or losing the job.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18+` or `v20+`
- **PostgreSQL**: Local or Cloud instance (v12+)
- **Redis**: Local or Cloud instance (v5.0+)

---

### Setup & Installation

#### 1. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` (or copy `.env.example`):
```env
# Database
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/reachinbox-scheduler"

# Redis
REDIS_URL="redis://localhost:6379"

# Server
PORT=5000
NODE_ENV=development

# Session
SESSION_SECRET="your-super-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:5000/api/auth/google/callback"

# Frontend URL
FRONTEND_URL="http://localhost:5173"

# BullMQ / Email Settings
WORKER_CONCURRENCY=3
MIN_DELAY_MS=1000
HOURLY_RATE_LIMIT=100
```

Start the backend server:
```bash
npm run dev
```

#### 2. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file inside `frontend/`:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📧 Ethereal Email Verification

Sent email preview links are automatically logged to the backend console:
```text
✅  Email sent to target@example.com — preview: https://ethereal.email/message/...
```
You can click any logged link to view the delivered email in the Ethereal online inbox.

---
