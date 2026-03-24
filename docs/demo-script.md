# Hackathon Demo Script

This script is designed to rapidly showcase the full power of the CKB Autonomous Yield Agent under 3 minutes.

## Preparation
*   Ensure the backend and frontend servers are running (`npm run dev`).
*   Ensure **Simulation Mode** is toggled ON in the dashboard to avoid waiting for testnet epochs.
*   Open the Next.js Dashboard on screen.

## Step-by-Step Flow & Talking Points

### Step 1: The AI Chat Interface & Context Setup
*   **Action:** Point to the dashboard and the clean, intuitive UI.
*   **Say:** *"Managing crypto assets can be intimidating, especially navigating unique structures like the Nervos DAO. Our project abstract this complexity away using a Multi-Agent system powered by Anthropic's Claude. Let me demonstrate."*

### Step 2: The Intent & Multi-Agent Routing
*   **Action:** Type and submit the prompt: *"I have some idle CKB. What is the smartest way to generate yield on it right now?"*
*   **Key Highlight:** Point to the Activity Feed showing the agent thinking.
*   **Say:** *"Watch our agents collaborate. Our orchestrator routed this question to the **Strategy Agent**, which is actively reading the current DAO APY. Instead of just executing, it’s acting as a financial advisor."*

### Step 3: Explanation & Execution
*   **Action:** Wait for the Strategy Agent to suggest depositing into the DAO. Accept the prompt's suggestion to deposit 5000 CKB.
*   **Key Highlight:** The real-time streaming of the tool execution as the **Wallet Agent** checks balances and the **DAO Agent** executes the transaction.
*   **Say:** *"We just approved the deposit. You can see the Wallet Agent verifying our UTXOs, and delegating the rest to the DAO Agent. The blockchain state is modified, and our funds are now earning interest."*

### Step 4: The Harvest Workflow & Simulation Mode
*   **Action:** Type the prompt: *"Can we simulate jumping forward a few epochs and harvesting my yield?"*
*   **Key Highlight:** Explain the Simulation Engine briefly and highlight the complex Phase 1 and Phase 2 lifecycle.
*   **Say:** *"Nervos DAO has a complex 2-phase withdrawal cycle to protect the network. For this demo, we're using our built-in **Simulation Engine** to fast-forward time. The Agent has just calculated our accrued yield, handled the Phase 1 withdrawal, waited for the epoch jump, and executed the Phase 2 unlock entirely autonomously. It then re-invested the yield to compound it."*

### Step 5: Conclusion
*   **Say:** *"By combining the reasoning power of Claude with the underlying infrastructure of Nervos CKB, we have built a truly hands-off, autonomous asset manager. Thank you."*
