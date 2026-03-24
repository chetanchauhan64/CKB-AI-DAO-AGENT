# 🧠 CKB Autonomous Asset & DAO Yield Agent

A premium, AI-driven fintech dashboard that acts as your personal asset manager for the **Nervos Network**. 

By combining Anthropic's Claude with the CKB blockchain, this agent understands natural language, analyzes your wallet, executes transactions, and optimally harvests your Nervos DAO yield—all from a sleek, fully automated conversational interface.

---

## ✨ Features & Upgrades: Autonomous AI Wealth Manager

This application has been upgraded into a **production-ready demo** with premium UI/UX interactions that transform it into a fully autonomous, storytelling-driven AI portfolio manager:

### 🤖 Autonomous AI Decision Engine & Autopilot
- **AI Recommendation Engine:** Slides up before major actions with context-aware advice, urgency levels, and reasoning.
- **Autopilot Mode:** When enabled, the AI completely takes over—auto-withdrawing at maturity, claiming rewards, and reinvesting. Triggers seamless auto-execution with countdown timers.
- **Global Status Bar:** A live sticky header tracking the AI's real-time state (`🟡 MONITORING`, `🟢 AI ACTIVE`, `🔵 EXECUTING`) along with total transactions, automation success rate, and yield growth.

### 🧠 Smart Insights & Risk Management
- **Smart Insights Panel:** Dynamically generates contextual advice (idle funds warnings, claimable position alerts, compounding ROI tips) and rotates them cleanly in the dashboard.
- **Risk Profile Selector:** Choose between 🟢 Conservative, 🟡 Balanced, or 🔴 Aggressive profiles. The UI and AI adapt their behavior and action frequency based on your risk tolerance.

### 📖 Storytelling DeFi Timeline
- **Agent Story Timeline:** Technical blockchain logs are transformed into a human-readable narrative feed with `🤖 AI Insight` quote cards appended directly to actions.
- **Lifecycle Tracking:** Active DAO vault deposits show beautiful storytelling badges (💚 Earning → ⏳ Unlocking → ✅ Ready to Claim → 🏁 Completed) with smooth, pulsing colored glow effects.

### 🏆 Premium "Wow" Micro-Interactions
- **Portfolio Automated Overlay:** A stunning, full-screen glassmorphic celebration sequence that fires after a successful reinvestment cycle to confirm your portfolio is optimized. 
- **Onboarding Demo Flow:** A floating, guided step-by-step tour that sends real chat commands to the agent (Check Balance → Deposit → Withdraw → Reinvest) to seamlessly walk users through the "Aha!" moment.
- **Glassmorphism UI:** Agent chat bubbles, status banners, and widgets feature premium `backdrop-blur` styling with animated transitions.

### 📡 Global Event Synchronization
- The entire dashboard is synced via a centralized Zustand store (`useAppStore`), ensuring that AI tool calls, WebSocket events, and timeline updates are instantly reflected across every component without React hydration mismatches.

---

## 🛠️ Tech Stack

**Frontend:** Next.js (App Router), React, Tailwind CSS, Zustand, Socket.io-client, React Markdown.  
**Backend:** Node.js, Express, Socket.io, Anthropic SDK (Claude 3.5 Sonnet).  
**Blockchain:** Nervos Network (CKB Testnet), `@ckb-lumos/lumos`.

---

## 🚀 Setup & Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- CKB Testnet funded wallet (use [faucet.nervos.org](https://faucet.nervos.org/))
- Anthropic API key (Claude)

### 1. Environment Variables
Create `.env` in the `backend/` directory from `.env.example` and fill in your values.

### 2. Installation
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install
```

### 3. Run the Application
You will need two terminal windows:

```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev
```

- Backend runs on `http://localhost:3001`  
- Frontend runs on `http://localhost:3000`

---

## 🏗️ Architecture

See [architecture.md](docs/architecture.md) for the full system design and sequence diagrams.
