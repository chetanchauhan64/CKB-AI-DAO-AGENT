# Agent Flow

The intelligence of the CKB Yield Agent is powered by an advanced LLM-based agent runner. This document details how user input is interpreted and transformed into on-chain actions through a structured multi-agent flow.

## 1. How User Input is Processed

Everything begins with the user's natural language intent submitted via the Next.js dashboard (e.g., *"Deposit 500 CKB into the DAO and tell me the expected yield"*). 

1.  **Ingestion:** The frontend captures the text and opens a WebSocket listener using a unique session ID.
2.  **Context Construction:** The backend pairs the user's prompt with system instructions that define the persona of the autonomous agent, as well as a schema of available functional tools (Toolbox).
3.  **LLM Routing:** The compiled payload is dispatched to the Anthropic Claude API.

## 2. How the Agent Decides Actions

Claude analyzes the intent against current contextual data (such as wallet balance or current DAO APY). It utilizes a technique known as **Chain of Thought Reasoning**:
*   **Observation:** The agent identifies what is being asked.
*   **Planning:** The agent decides which persona needs to be invoked.
*   **Tool Selection:** In order to fulfill the plan, the agent responds with a structured JSON object requesting to use specific system tools (e.g., `get_balance`, `deposit_dao`, `calculate_yield`).

## 3. How Tools are Executed

When the LLM requests a tool call:
1.  **Interception:** The backend intercepts the response from Claude, matching the requested tool name to a registered function in the `ToolRegistry.ts`.
2.  **Execution (Real vs Simulated):** 
    *   If running in **Production mode**, the tool interacts directly with the Nervos CKB Testnet to perform real on-chain state changes.
    *   If running in **Simulation mode**, the tool interacts with the local simulation state, immediately modifying balances and epoch times for demo purposes.
3.  **Result Injection:** The result of the transaction (or the error) is injected back into the LLM conversation history. The agent is queried again to interpret the outcome for the user.

## 4. Integration of the Strategy Engine

The **Strategy Intelligence Engine** is a distinct module responsible for yield optimization. It does not execute transactions directly. Instead, when a user asks about returns, the Main Agent delegates the question to the Strategy Engine.
*   The Strategy Engine calculates APY projections, compounding timeframes, and opportunity costs.
*   It generates a structured decision explanation that is relayed back to the user, advising them whether it is a good time to deposit or harvest.

## 5. Simulating the Multi-Agent Flow

To provide transparency, the system simulates a Multi-Agent environment on the backend. Though primarily routed through one core LLM session, the system explicitly structures the logs and UI to show collaboration:
*   **Strategy Phase:** Analyzes whether the action makes financial sense.
*   **Wallet Phase:** Validates that sufficient funds exist to pay for transaction fees and the deposit.
*   **DAO Phase:** Constructs the specialized cell structures required for Nervos DAO.

The UI's real-time Activity Feed visually separates these phases, giving the user complete visibility into how the autonomous "team" is handling their funds.
