# TrustLayer — Autonomous AI Payment & Project Agent

> **Programmable Trust for Freelance Work**

A full-stack hackathon project that acts as an **AI intermediary between employers and freelancers**, autonomously managing project milestones, escrow payments, and quality verification using GPT-4o.

---

## 🧠 What It Does

| Feature | Description |
|---|---|
| **AI Milestone Generation** | Employer submits a project description → GPT-4o breaks it into structured milestones with checklists, deadlines, and payment splits |
| **Autonomous Escrow** | Funds locked at project start, released programmatically based on AI quality verdict |
| **AI Quality Assurance** | Every freelancer submission evaluated by GPT-4o — returns COMPLETE / PARTIAL / FAILED + confidence score |
| **Decision Engine** | ≥80% → full release · 50–79% → partial · <50% → refund to employer |
| **PFI Score** | 300–850 reputation score for freelancers based on completion rate, on-time delivery, AI quality |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Node.js + Express (ESM) |
| Database | MongoDB + Mongoose |
| AI | OpenAI GPT-4o (`gpt-4o`) |
| Auth | JWT + bcryptjs |

---

## 📁 Project Structure

```
autonomous-agent/
├── client/                     # Next.js 14 frontend
│   ├── app/
│   │   ├── page.jsx            # Landing page
│   │   ├── login/              # Auth pages
│   │   ├── register/
│   │   ├── employer/
│   │   │   ├── dashboard/      # Employer dashboard
│   │   │   ├── projects/       # Project list + detail
│   │   │   │   ├── new/        # AI project creation
│   │   │   │   └── [id]/       # Project detail
│   │   │   └── escrow/         # Escrow manager
│   │   ├── freelancer/
│   │   │   ├── dashboard/      # Freelancer dashboard + PFI
│   │   │   ├── projects/       # Assigned projects
│   │   │   └── earnings/       # PFI score + earnings
│   │   └── milestone/[id]/     # Milestone detail + submission
│   ├── components/
│   │   ├── layout/             # DashboardLayout (sidebar)
│   │   ├── dashboard/          # MilestoneTimeline, ProjectCard
│   │   └── ui/                 # GlassCard, StatusBadge, etc.
│   └── lib/
│       ├── api.js              # Axios client with JWT
│       └── auth.jsx            # Auth context + hooks
│
└── server/                     # Express backend
    ├── index.js                # Entry point
    ├── models/
    │   ├── User.js             # Users (employer/freelancer)
    │   ├── Project.js          # Projects + escrow
    │   ├── Milestone.js        # Milestones + checklist
    │   └── Submission.js       # Submissions + AI scores
    ├── routes/
    │   ├── auth.js             # /api/auth/*
    │   ├── projects.js         # /api/projects/*
    │   ├── milestones.js       # /api/milestones/*
    │   ├── submissions.js      # /api/submissions/*
    │   ├── escrow.js           # /api/escrow/*
    │   └── pfi.js              # /api/pfi/*
    ├── services/
    │   ├── openai.js           # AI prompts + decision engine
    │   └── pfi.js              # PFI score calculation
    └── middleware/
        └── auth.js             # JWT authentication
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- OpenAI API key

---

### 1. Clone & Install

```bash
# Clone the repo
git clone <your-repo-url>
cd autonomous-agent

# Install all dependencies
npm run install:all
# Or manually:
cd server && npm install
cd ../client && npm install
```

---

### 2. Configure Environment Variables

**Server** — copy and edit `server/.env.example`:
```bash
cp server/.env.example server/.env
```

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/autonomous-agent
JWT_SECRET=your_super_secret_key_change_this
OPENAI_API_KEY=sk-your-openai-api-key
CLIENT_URL=http://localhost:3000
```

**Client** — copy and edit `client/.env.example`:
```bash
cp client/.env.example client/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

### 3. Start MongoDB

```bash
# If running locally:
mongod

# Or use MongoDB Atlas — paste the connection string into MONGODB_URI
```

---

### 4. Run the Development Servers

**Option A — Run both together (from root):**
```bash
npm install          # installs concurrently
npm run dev          # starts both server + client
```

**Option B — Run separately:**
```bash
# Terminal 1 — Backend
cd server && npm run dev
# Runs on http://localhost:5000

# Terminal 2 — Frontend
cd client && npm run dev
# Runs on http://localhost:3000
```

---

## 🔌 API Reference

### Authentication
```
POST /api/auth/register   { name, email, password, role }
POST /api/auth/login      { email, password }
GET  /api/auth/me         (requires Bearer token)
```

### Projects
```
POST /api/projects        { title, description, totalFunds } — AI generates milestones
GET  /api/projects        — List projects for current user
GET  /api/projects/:id    — Project + milestones
PATCH /api/projects/:id/assign { freelancerId }
```

### Milestones
```
GET  /api/milestones/:projectId     — All milestones for a project
GET  /api/milestones/single/:id     — Single milestone
POST /api/milestones                — Manual creation
```

### Submissions
```
POST /api/submissions     { milestoneId, repoLink, deployLink, notes }
GET  /api/submissions/:milestoneId
```

### Escrow
```
POST /api/escrow/deposit  { projectId, amount }
POST /api/escrow/release  { projectId, amount }
POST /api/escrow/refund   { projectId }
```

### PFI
```
GET /api/pfi/:freelancerId
```

---

## 🤖 AI Prompts

### Requirement Analyzer (Project Creation)
```
"Analyze the following freelance project description and break it into 3–5 
structured milestones with deadlines, deliverables, and estimated payment 
distribution. Return as structured JSON."
```

### Quality Assurance (Submission Review)
```
"Evaluate whether the submission satisfies the milestone requirements. 
Return status: COMPLETE, PARTIAL, or FAILED with a confidence score (0–1)."
```

### Decision Engine Logic
```
confidenceScore >= 0.8  → RELEASE_FULL    → 100% payment
confidenceScore >= 0.5  → RELEASE_PARTIAL → (score × amount) payment
confidenceScore < 0.5   → REFUND          → employer refund
```

---

## 📊 Database Schemas

### User
```js
{ name, email, password (hashed), role, pfiScore (300-850),
  completedMilestones, totalMilestones, onTimeDeliveries, avgAiScore }
```

### Project
```js
{ title, description, employerId, freelancerId, totalFunds,
  escrowBalance, status, aiAnalysisComplete, techStack, estimatedDuration }
```

### Milestone
```js
{ projectId, title, description, checklist [{item, completed}],
  paymentAmount, deadline, order, status, aiScore, aiVerdict }
```

### Submission
```js
{ milestoneId, projectId, freelancerId, repoLink, deployLink, notes,
  aiScore, aiVerdict, aiAnalysis, status, paymentReleased, paymentAmount }
```

---

## 🏆 Hackathon Highlights

- **End-to-end AI automation** — from project creation to payment release, no human intervention needed
- **GPT-4o JSON mode** — structured milestone generation with `response_format: json_object`
- **Async AI evaluation** — submissions processed in background, UI polls for updates
- **PFI score system** — weighted formula (completion 40% + on-time 25% + AI quality 35%) scaled 300–850
- **Glassmorphism dark UI** — Quantum Noir aesthetic with IBM Plex Mono + Syne fonts
- **Role-based access** — employer vs freelancer routes with JWT middleware

---

## 🔧 Production Deployment

```bash
# Build frontend
cd client && npm run build && npm start

# Backend (PM2 recommended)
cd server && npm start
```

For deployment: Vercel (frontend) + Railway/Render (backend) + MongoDB Atlas (database).

---

Built with ⚡ for hackathon demo purposes. Replace `OPENAI_API_KEY` with a real key to enable AI features.
