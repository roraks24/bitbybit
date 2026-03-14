
# BitByBit — Autonomous AI Payment & Project Agent

> **Programmable Trust for Freelance Work**

BitByBit is a full-stack platform that acts as an **AI intermediary between employers and freelancers**. It autonomously manages project milestones, holds funds in escrow, and verifies the quality of submitted work using Google's Gemini before releasing payments.

---

## 🚀 Core Functionalities

### 1. AI-Driven Project & Milestone Generation
- Employers submit a plain-text project description.
- **Gemini** analyzes the request and autonomously breaks the project down into **structured milestones**.
- Each milestone contains a checklist, strict deadlines, and an estimated payment distribution.

### 2. Autonomous Escrow System
- When an employer creates a project and funds it, the funds are locked in a secure **Escrow balance**.
- Payments are NOT released manually. They are tied purely to the completion and AI verification of each milestone.
- **Decision Engine Logic:**
  - AI Confidence Score **≥ 80%** → Full Payment Released.
  - AI Confidence Score **50% – 79%** → Partial Payment Released.
  - AI Confidence Score **< 50%** → Submission Rejected, funds either stay in escrow or get refunded based on project rules.

### 3. AI Quality Assurance (Robotic Reviewer)
- Freelancers submit their work (repo links, deployment links, notes) to a milestone.
- **Gemini acts as the reviewer:** It evaluates whether the submission satisfies the milestone's predefined checklist within the time limit.
- It returns an objective status (`COMPLETE`, `PARTIAL`, or `FAILED`), an **AI Score**, and detailed feedback justifying the decision.

### 4. PFI Score (Programmable Freelancer Index)
- To maintain quality, freelancers are assigned a dynamic reputation score (ranging from 300 to 850).
- This score works like a credit score and is highly affected by:
  - **Completion Rate (40%)**: How many milestones the freelancer successfully completes.
  - **On-Time Delivery (25%)**: Whether submissions meet hard deadlines.
  - **AI Quality Score (35%)**: The average score given by the AI reviewer to their submissions.

### 5. Interactive Dashboard Chatbot
- Included directly within the dashboard is a built-in AI chatbot helper.
- Users can ask questions seamlessly while managing their projects or finding new work.

---

## 🏗️ Technical Architecture & Stack

The project is structured as a mono-repo with separated Frontend (`client`) and Backend (`server`) folders.

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, Framer Motion (for animations) |
| **Backend** | Node.js, Express.js (ES Modules) |
| **Database** | MongoDB + Mongoose (hosted via MongoDB Atlas or Local) |
| **AI Integration** | Gemini API (with JSON mode for structured outputs) |
| **Authentication** | JWT (JSON Web Tokens) with `bcryptjs` for secure password hashing |

---

## 🛣️ User Journey Workflows

### 👔 The Employer Flow
1. **Register/Login:** Creates an account as an 'employer'.
2. **Dashboard:** Views an overview of active projects and total funds in escrow.
3. **Create Project:** Enters a project budget, deadline, and description. The AI generates the milestones.
4. **Fund Escrow:** Employer deposits the required budget into the project's escrow.
5. **Monitoring:** Watches as freelancers pick up the project, submit work, and the AI automatically evaluates and releases funds.

### 💻 The Freelancer Flow
1. **Register/Login:** Creates an account as a 'freelancer'.
2. **Find Work:** Browses available / open projects needing assignment.
3. **Dashboard:** Tracks their **PFI Score**, current earnings, and active milestones.
4. **Submit Work:** When a milestone is ready, the freelancer submits links and notes. 
5. **Get Paid:** If the AI reviewer approves the work, the payment is instantly transferred from the employer's escrow to the freelancer's earnings.

---

## 🚦 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on `mongodb://localhost:27017` or an Atlas URI)
- Gemini API Key

### 1. Installation
Clone the repository and install dependencies for both the client and server.
```bash
# Clone the repository
git clone <your-repo-url>
cd bitbybit

# Install dependencies concurrently
npm run install:all
```

### 3. Running the App
From the root directory, you can run both servers simultaneously using `concurrently`:
```bash
npm run dev
```
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

---

## 📡 API Endpoints Overview

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- **Projects:** `POST /api/projects` (AI Milestone Gen), `GET /api/projects`, `GET /api/projects/:id`
- **Milestones:** `GET /api/milestones/:projectId`, `GET /api/milestones/single/:id`
- **Submissions & Escrow:** `POST /api/submissions`, `POST /api/escrow/release`
- **Freelancer PFI:** `GET /api/pfi/:freelancerId`

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
- **Gemini JSON mode** — structured milestone generation with `response_mime_type: application/json`
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

Built with ⚡ for hackathon demo purposes. Replace `GEMINI_API_KEY` with a real key to enable AI features.