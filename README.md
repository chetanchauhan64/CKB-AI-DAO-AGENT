# CKB Autonomous Asset & DAO Yield Agent

An AI-powered DeFi portfolio manager for the **Nervos Network** that automates asset management, DAO yield optimization, and on-chain actions using natural language.

 A fully autonomous AI agent that monitors, analyzes, and executes blockchain transactions on your behalf.

---

## 🌐 Live Demo
(Add your deployed link here)

---

## Dashboard Preview
![Dashboard](./docs/dashboard.png)

---

## 📑 Table of Contents
- [Overview](#-ckb-autonomous-asset--dao-yield-agent)
- [How to Use the Platform](#-how-to-use-the-platform)
  - [Connect Wallet](#connect-wallet)
  - [Check Portfolio](#check-portfolio)
  - [Deposit into DAO](#deposit-into-dao)
  - [Withdraw from DAO](#withdraw-from-dao)
  - [Enable Autopilot Mode](#enable-autopilot-mode)
  - [AI Recommendations](#ai-recommendations)
  - [Story Timeline](#story-timeline)
- [Modules](#-modules)
- [Tech Stack](#-tech-stack)
- [Setup Guide](#-setup-guide)
- [Architecture](#-architecture)
- [Future Scope](#-future-scope)

---

# How to Use the Platform

## Connect Wallet
- Connect your Nervos wallet to start using the platform  
- The AI agent will fetch your balance and DAO positions  

![Wallet](./docs/wallet.png)

---

## Check Portfolio
- Ask AI: **"Check my balance"**  
- View total assets, DAO deposits, and rewards  

![Portfolio](./docs/portfolio.png)

---

## Deposit into DAO
1. Enter deposit amount  
2. Confirm transaction  
3. Funds start earning yield  

![Deposit](./docs/deposit.png)

---

## Withdraw from DAO
1. Select DAO position  
2. Withdraw after maturity  
3. Claim rewards  

![Withdraw](./docs/withdraw.png)

---

## Enable Autopilot Mode
- AI automatically:
  - Withdraws matured funds  
  - Claims rewards  
  - Reinvests for compounding  

![Autopilot](./docs/autopilot.png)

---

## AI Recommendations
- AI suggests actions like:
  - Reinvest idle funds  
  - Claim rewards  
  - Optimize yield  

![AI Panel](./docs/ai-panel.png)

---

## Story Timeline
- Converts blockchain activity into readable logs  
- Shows lifecycle:
  - Earning → Unlocking → Claim → Completed  

![Timeline](./docs/timeline.png)

---

# Modules

## AI Decision Engine
- Natural language processing using Claude  
- Executes blockchain actions  
- Provides smart recommendations  

---

## Autopilot Engine
- Fully automated yield strategy  
- Handles reinvestment cycles  
- Real-time execution tracking  

---

## Portfolio Dashboard
- Displays assets, DAO positions  
- Live updates using WebSockets  
- Tracks yield growth  

---

## Smart Insights System
- Detects:
  - Idle funds  
  - Claimable rewards  
  - Optimization opportunities  

---

## Risk Management Module
- Risk Profiles:
  - 🟢 Conservative  
  - 🟡 Balanced  
  - 🔴 Aggressive  
- AI adjusts behavior accordingly  

---

## Activity Timeline Module
- Converts raw blockchain logs  
- Adds AI-generated insights  
- Improves user understanding  

---

## Global State Management
- Zustand-based centralized store  
- Syncs UI, backend, and blockchain events  

---

# Tech Stack

### Frontend
- Next.js  
- React.js  
- Tailwind CSS  
- Zustand  
- Socket.io-client  

### Backend
- Node.js  
- Express.js  
- Socket.io  
- Anthropic SDK (Claude)  

### Blockchain
- Nervos Network (CKB Testnet)  
- @ckb-lumos/lumos  

---

# Setup Guide

## Prerequisites
- Node.js 18+  
- npm 9+  
- Nervos wallet (testnet funded)  
- Anthropic API Key  

---

## 1️⃣ Setup Environment Variables
Create `.env` inside backend:

```env
ANTHROPIC_API_KEY=your_api_key
```

---

## 2️⃣ Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## 3️⃣ Run the Project
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

- Frontend → http://localhost:3000  
- Backend → http://localhost:3001  

---

# Architecture
See detailed system design:

```
docs/architecture.md
```

---

# Future Scope
- Multi-chain support  
- Advanced AI trading strategies  
- Mobile app  
- Smart portfolio diversification  

---

## Deployed Contracts

| Contract Name        | Description                              | Network |
|---------------------|------------------------------------------|---------|
| Nervos DAO          | DAO deposit & yield mechanism            | CKB Testnet |
| AI Execution Layer  | Handles automated AI-driven transactions | Off-chain + On-chain |
| Wallet Integration  | User wallet interaction & balance fetch  | CKB Testnet |

> ℹ️ Note: This project interacts directly with the Nervos DAO protocol using Lumos SDK.  
> You can explore transactions via the Nervos Explorer based on your wallet address.

---

## Contributing Guidelines

We welcome contributions to improve this AI-powered DeFi agent 

To get started:
- Fork the repository  
- Create a new branch (`feature/your-feature-name`)  
- Commit your changes  
- Push and create a Pull Request  

For major changes, please open an issue first to discuss what you would like to improve.

---

## Contact

If you have any questions or suggestions, feel free to connect:

**Chetan Chauhan**  
📧 thakurchetan7275@gmail.com  
💼 LinkedIn: https://www.linkedin.com/in/chetanchauhan64/  
🐙 GitHub: https://github.com/chetanchauhan64  

## Thank You ❤️ 


