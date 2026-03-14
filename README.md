
# TrustLayer — Autonomous AI Payment & Project Agent

> **Programmable Trust for Freelance Work**

TrustLayer is a full-stack platform that acts as an **AI intermediary between employers and freelancers**. It autonomously manages project milestones, holds funds in escrow, enforces deadlines, and verifies the quality of submitted work using **OpenAI GPT-5-mini** before releasing payments.

---

## 🚀 Core Functionalities

### 1. AI-Driven Project & Milestone Generation
- Employers submit a plain-text project description along with a budget and deadline.
- **GPT-5-mini** analyzes the request and autonomously breaks the project into **3–5 structured milestones**.
- Each milestone contains a checklist, deadline, estimated duration, and a payment distribution that sums to 100%.

### 2. Autonomous Escrow System
- When an employer creates and funds a project, the budget is locked in a secure **Escrow balance**.
- Payments are NOT released manually — they are driven purely by AI verification.
- **Decision Engine Logic:**
  - AI Confidence Score **≥ 80%** → Full Payment Released.
  - AI Confidence Score **50% – 79%** → Partial Payment Released (proportional to score).
  - AI Confidence Score **< 50%** → Submission Rejected, funds remain in escrow or are refunded.

### 3. AI Quality Assurance (Robotic Reviewer)
- Freelancers submit their work (repo links, deployment links, notes) against a milestone.
- **GPT-5-mini acts as the reviewer:** It evaluates whether the submission satisfies the milestone's predefined checklist.
- Returns an objective verdict (`COMPLETE`, `PARTIAL`, or `FAILED`), a **confidence score (0–1)**, and detailed analysis justifying the decision.

### 4. Deadline Enforcement System
- Employers set deadlines when creating projects.
- A background **deadline enforcer** runs periodically and:
  - Automatically deletes unclaimed projects past their deadline.
  - Deducts payment from freelancers who miss a deadline after picking up a project.

### 5. PFI Score (Platform Fidelity Index)
- Freelancers start with a score of **0** and build up to a maximum of **850**.
- The score increases based on:
  - **Timely project submissions** — delivering before the deadline.
  - **Quality of work** — as evaluated by the AI reviewer's confidence score.
- Higher PFI scores signal reliability and trustworthiness to employers.

### 6. Interactive Dashboard Chatbot
- A built-in **rule-based AI chatbot** is embedded directly in the dashboard.
- Supports context-aware quick replies, project/milestone lookups, payment info, PFI score queries, and platform guidance.
- Features a floating, eye-catching pill-shaped button with pulsing animation.

---

## 🏗️ Technical Architecture & Stack

The project is structured as a mono-repo with separated Frontend (`client`) and Backend (`server`) folders.

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express.js (ES Modules), Nodemon |
| **Database** | MongoDB + Mongoose (hosted via MongoDB Atlas) |
| **AI Integration** | OpenAI GPT-5-mini (Chat Completions API with JSON response format) |
| **Authentication** | JWT (JSON Web Tokens) with `bcryptjs` for secure password hashing |
| **Real-time** | Background deadline enforcer service (interval-based) |

---

## 🛣️ User Journey Workflows

### 👔 The Employer Flow
1. **Register/Login:** Creates an account as an 'employer'.
2. **Dashboard:** Views an overview of active projects, escrow balance, completed projects, and AI verifications.
3. **Create Project:** Enters a project title, budget, deadline, and description. GPT-5-mini generates the milestones automatically.
4. **Fund Escrow:** Employer deposits the required budget into the project's escrow.
5. **Monitor:** Watches as freelancers pick up the project, submit work, and the AI automatically evaluates and releases funds.

### 💻 The Freelancer Flow
1. **Register/Login:** Creates an account as a 'freelancer' (starting PFI score: 0).
2. **Find Work:** Browses available open projects needing assignment.
3. **Dashboard:** Tracks their **PFI Score**, current earnings, and active milestones.
4. **Submit Work:** When a milestone is ready, the freelancer submits repo links, deploy links, and notes.
5. **Get Paid:** If the AI reviewer approves the work, payment is instantly transferred from escrow to the freelancer's earnings.

---

## 🚦 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- MongoDB (Atlas URI or local instance)
- OpenAI API Key

### 1. Clone & Install
```bash
git clone https://github.com/roraks24/bitbybit.git
cd bitbybit

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Environment Variables
Create a `.env` file inside the `server/` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_api_key
CLIENT_URL=http://localhost:3000
```

### 3. Run the App
```bash
# Terminal 1 — Start the backend
cd server && npm run dev

# Terminal 2 — Start the frontend
cd client && npm run dev
```
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive JWT |
| `GET` | `/api/auth/me` | Get authenticated user profile |
| `POST` | `/api/projects` | Create project (triggers AI milestone generation) |
| `GET` | `/api/projects` | List user's projects |
| `GET` | `/api/projects/:id` | Get project details |
| `GET` | `/api/milestones/:projectId` | Get milestones for a project |
| `GET` | `/api/milestones/single/:id` | Get single milestone |
| `POST` | `/api/submissions` | Submit work for a milestone |
| `POST` | `/api/escrow/release` | Release escrow payment |
| `GET` | `/api/pfi/:freelancerId` | Get freelancer's PFI score |
| `GET` | `/api/chat/welcome` | Get chatbot welcome message |
| `POST` | `/api/chat` | Send message to chatbot |

---

## 🤖 AI Integration

### Requirement Analyzer (Project Creation)
GPT-5-mini receives the project description and budget, then returns structured JSON with milestones, tech stack, estimated duration, and risk level.

### Quality Assurance (Submission Review)
GPT-5-mini evaluates submissions against milestone checklists and returns a verdict, confidence score, completed/missing items, and recommendations.

### Decision Engine
```
confidenceScore ≥ 0.8  → RELEASE_FULL    → 100% payment
confidenceScore ≥ 0.5  → RELEASE_PARTIAL → (score × amount) payment
confidenceScore < 0.5  → REFUND          → employer refund
```

---

## 📊 Database Schemas

### User
```js
{ name, email, password (hashed), role, pfiScore (0–850),
  completedMilestones, totalMilestones, onTimeDeliveries, avgAiScore }
```

### Project
```js
{ title, description, employerId, freelancerId, totalFunds,
  escrowBalance, status, deadline, techStack, estimatedDuration }
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

## 🏆 Key Highlights

- **End-to-end AI automation** — from project creation to payment release, no human intervention needed
- **GPT-5-mini JSON mode** — structured milestone generation and quality assurance
- **Deadline enforcement** — automatic cleanup of expired projects and penalty for missed deadlines
- **PFI score system** — builds from 0 to 850 based on timely delivery and AI quality scores
- **Rule-based chatbot** — context-aware assistant with quick replies and live data lookups
- **Glassmorphism dark UI** — warm aesthetic with DM Sans/Nunito fonts, particle canvas, and dark mode toggle
- **Role-based access** — employer vs freelancer dashboards with JWT middleware
- **Fully responsive** — optimized for mobile (375px+) through desktop

---

## 🔧 Production Deployment

```bash
# Build frontend
cd client && npm run build && npm start

# Backend (PM2 recommended)
cd server && npm start
```

Recommended: **Vercel** (frontend) + **Railway/Render** (backend) + **MongoDB Atlas** (database).

---

Built with ⚡ for **Cognizance 2026**