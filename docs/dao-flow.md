# Nervos DAO Flow

This document outlines the lifecycle of assets within the Nervos DAO and how the Autonomous Agent interacts with these smart contracts.

## 1. DAO Lifecycle (Deposit → Withdraw → Unlock)

The Nervos DAO operates on a unique layered cell model. Managing assets in the DAO is not a simple transfer; it requires a specific lifecycle:

### Step 1: Deposit
*   **Action:** The user (or Agent on their behalf) creates a transaction locking CKB into a DAO-specific cell.
*   **State:** The cell begins accruing yield (compensation for secondary issuance inflation).

### Step 2: Withdraw (Phase 1)
*   **Action:** To access the funds, the user cannot simply transfer them out. The agent must first send a Phase 1 withdrawal transaction.
*   **State:** This converts the DAO deposit cell into a "Withdrawing" state. Wait periods apply based on the blockchain epoch.

### Step 3: Unlock (Phase 2)
*   **Action:** Once the maturity period has passed, the Agent triggers the Phase 2 transaction.
*   **State:** The CKB is fully unlocked and returned to the user's standard wallet balance, along with any generated yield.

## 2. Harvest Workflow

The **Harvest Workflow** is an automated protocol designed by the Strategy Agent to intelligently compound returns.
*   The system monitors active DAO deposits.
*   When a deposit's generated yield surpasses the network transaction fees by a predefined threshold, the agent prompts a harvest.
*   The agent runs the Phase 1 + Phase 2 withdrawal cycle, and immediately re-deposits the original principal plus the new yield to maximize compounding returns.

## 3. Automation Logic

The project incorporates an **Automation Scheduler** (cron jobs) to remove the need for manual user intervention:
*   **Yield Monitoring:** Every hour, a background job queries the chain for the current APY and the user's accrued interest.
*   **Action Triggers:** If conditions meet the Strategy Engine's "Harvest Workflow" thresholds, the Agent is autonomously triggered to execute the necessary transactions.
*   **Action Reports:** The agent logs these actions and prepares a summary for the user's dashboard.

## 4. Simulation Mode Behavior

For testing, hackathons, and demonstrations, the Nervos DAO requires epoch cycles to pass, which can be too slow for an immediate presentation. 
*   **Toggled via Dashboard:** The frontend includes a simple Simulation Toggle.
*   **Instant Epochs:** When Simulation Mode is active, the agent bypasses the real CKB Testnet RPC.
*   **Mock State:** The backend utilizes an in-memory simulation engine that fakes the passage of time (epochs) and immediately approves withdraw/unlock transactions. This allows presenters to demonstrate the entire multi-step Nervos DAO lifecycle in under 60 seconds.
