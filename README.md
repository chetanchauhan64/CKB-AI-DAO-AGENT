# CKB Autonomous Asset & DAO Yield Agent

An AI-powered DeFi portfolio manager for the **Nervos Network** that automates asset management, DAO yield optimization, and on-chain actions using natural language.
 A fully autonomous AI agent that monitors, analyzes, and executes blockchain transactions on your behalf.

**Deployed on Vercel:** [https://ckb-ai-agent.vercel.app/](https://ckb-ai-agent.vercel.app/)

## Dashboard

a. View your complete portfolio, DAO deposits, and AI agent status in real-time.

<img width="1470" height="837" alt="Dashboard" src="https://github.com/user-attachments/assets/ee09ea7f-a75b-4cbb-a874-792384952c2d" />

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
- The AI agent fetches wallet address, balance, and DAO positions in real-time  

<img width="1470" height="837" alt="Wallet" src="https://github.com/user-attachments/assets/50232dc3-863f-4b15-b5f7-54ff8340deef" />

---

## Check Portfolio
- Ask AI: **"Check my balance"**  
- View total assets, DAO deposits, and rewards  

<img width="1470" height="837" alt="Portfolio" src="https://github.com/user-attachments/assets/fcfc57ab-6887-4f23-a7d0-e14e0626cd8d" />

---

## Deposit into DAO
1. Enter deposit amount  
2. Confirm transaction  
3. Funds start earning yield  

<img width="1470" height="837" alt="Deposit" src="https://github.com/user-attachments/assets/cb4fb82e-6cc1-4703-b6ca-b6a6c2a85abe" />

---

## Withdraw from DAO
1. Select DAO position  
2. Withdraw after maturity  
3. Claim rewards  

<img width="1470" height="837" alt="Withdraw" src="https://github.com/user-attachments/assets/9a648d58-af4a-4e12-aa4b-fdcc16d7aecb" />

---

## Enable Autopilot Mode
- AI automatically:
  - Withdraws matured funds  
  - Claims rewards  
  - Reinvests for compounding  

<img width="1470" height="837" alt="Autopilot" src="https://github.com/user-attachments/assets/9364bc52-1797-407e-a7e8-f1a86900451d" />

---

## AI Recommendations
- AI suggests actions like:
  - Reinvest idle funds  
  - Claim rewards  
  - Optimize yield  

<img width="1470" height="837" alt="AI panel" src="https://github.com/user-attachments/assets/be36483c-8701-40e6-8459-37e7fa279cd2" />

---

## Story Timeline
- Converts blockchain activity into readable logs  
- Shows lifecycle:
  - Earning → Unlocking → Claim → Completed  

<img width="1470" height="837" alt="Activity " src="https://github.com/user-attachments/assets/6fefacd2-9e2d-4881-aed4-7550b8dcdddf" />

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

## 🔗 On-Chain Details

| Component            | Address / Reference                                      | Explorer Link |
|----------------------|----------------------------------------------------------|---------------|
| Wallet Address       | `ckt1qyqr9xazv277kwmr9svqved5wrggf9a6zrgqjk935j`         | [View](https://pudge.explorer.nervos.org/address/ckt1qyqr9xazv277kwmr9svqved5wrggf9a6zrgqjk935j) |
| Nervos DAO Protocol  | Native DAO on CKB Testnet                                | [View](https://docs.nervos.org/docs/basics/guides/dao) |
| Transactions         | DAO deposits, withdrawals, and rewards                   | Linked to wallet explorer |

> ℹ️ This project interacts directly with the Nervos DAO protocol using Lumos SDK.  
> All on-chain operations (deposit, withdraw, harvest) are executed via the user's wallet on CKB Testnet.

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

For any questions, feedback, or collaboration opportunities, please feel free to reach out:

**Chetan Chauhan**  
Email: thakurchetan7275@gmail.com  
LinkedIn: https://www.linkedin.com/in/chetanchauhan64/  
GitHub: https://github.com/chetanchauhan64  

---

Thank you for reviewing this project ♥️










