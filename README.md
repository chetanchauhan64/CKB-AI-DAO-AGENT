# 🧠 CKB Autonomous Asset & DAO Yield Agent

An AI-powered DeFi portfolio manager for the **Nervos Network** that automates asset management, DAO yield optimization, and on-chain actions using natural language.

> 🚀 Built as a next-gen autonomous AI agent combining blockchain + intelligent decision-making.

---

## ✨ Key Highlights

- 🤖 **AI-Powered Asset Manager**
  - Understands natural language commands
  - Analyzes wallet + DAO positions
  - Executes transactions automatically

- ⚡ **Autopilot Mode**
  - Auto-withdraws DAO deposits at maturity
  - Claims rewards & reinvests seamlessly
  - Fully hands-free yield optimization

- 📊 **Real-Time Portfolio Intelligence**
  - Live AI status tracking (Monitoring / Active / Executing)
  - Transaction analytics & yield growth insights
  - Smart alerts for idle funds & opportunities

- 🧠 **Smart Risk Management**
  - Risk profiles: Conservative / Balanced / Aggressive
  - AI adapts strategy based on user preference

- 📖 **Storytelling DeFi Experience**
  - Converts blockchain logs into readable activity timeline
  - Tracks lifecycle: Earning → Unlocking → Claim → Completed

- 🎯 **Premium UI/UX**
  - Glassmorphism design
  - Smooth animations & micro-interactions
  - Guided onboarding demo for instant understanding

---

## 🛠️ Tech Stack

### Frontend
- Next.js (App Router)
- React.js
- Tailwind CSS
- Zustand
- Socket.io-client

### Backend
- Node.js
- Express.js
- Socket.io
- Anthropic SDK (Claude 3.5 Sonnet)

### Blockchain
- Nervos Network (CKB Testnet)
- @ckb-lumos/lumos

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Nervos Testnet wallet (fund via faucet)
- Anthropic API Key

---

### 1️⃣ Setup Environment Variables
Create `.env` inside `backend/`:

```env
ANTHROPIC_API_KEY=your_api_key