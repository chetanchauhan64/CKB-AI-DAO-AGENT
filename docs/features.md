# Features

The CKB Autonomous Asset & DAO Yield Agent boasts a sophisticated set of features designed to abstract the complexities of Web3 down to natural language prompts.

## AI Chat Agent
The primary interface is a ChatGPT-like natural language dashboard. It allows users to issue commands like *"Withdraw 100 CKB from the DAO"* rather than manually finding and interacting with complex block explorers or dApps. The AI dynamically understands the intent, current context, and required parameters without rigid command structures.

## Strategy Engine
The Intelligence Engine ensures that users make profitable decisions. Rather than blindly executing what the user asks, it projects the financial outcome. If a user asks to withdraw assets right before a major epoch maturity payout, the strategy engine will warn them about the opportunity cost and suggest optimal timing.

## Automation Scheduler
Financial markets don't sleep, and neither does the Yield Agent. The system implements continuous background cron-jobs that monitor the Nervos Testnet. It automatically checks accumulated yield and can systematically trigger harvest and re-deposit loops, capitalizing on compound interest without the user needing to manually log in.

## Multi-Agent System
To cleanly separate concerns, the system splits tasks into specialized personas:
*   **Strategy Agent:** Acts as the brain, analyzing market data and projecting yield returns.
*   **Wallet Agent:** Acts as the cashier, managing UTXOs, validating sufficient balances, and preparing network signatures.
*   **DAO Agent:** Acts as the smart-contract specialist, managing the multi-phased state transitions of Nervos DAO cells.

Working in tandem, they provide robust, error-resistant execution.

## Explanation System
Crypto shouldn't be a black box. The Explanation System streams the inner "thoughts" and reasoning of the agents in real-time. Before money is moved, the Dashboard displays a structured decision explanation detailing exactly *what* is about to happen, *why*, and *how much* it will cost in transaction fees.

## Simulation Mode
Built specifically for hackathons and immediate demonstrations, Simulation Mode bypasses the grueling latency of real-time block generation. It utilizes a fast, in-memory state engine that fakes blockchain epoch cycles, allowing developers to show the full multi-phase CKB DAO lifecycle seamlessly in a live presentation.
