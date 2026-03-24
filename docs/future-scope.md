# Future Scope

While the current CKB Autonomous Yield Agent demonstrates robust capabilities within the Nervos ecosystem, the architecture is designed to scale horizontally across chains and financial operations. Here is the roadmap for future expansion.

## 1. Multi-Chain Support
Currently anchored on Nervos CKB, the modular `ToolRegistry` and `blockchain` backend core can be expanded to encompass cross-chain operations using protocols like CKB's **Force Bridge** or **Axelar**. This would allow a user to prompt: *"Bridge my USDC from Ethereum to CKB and deposit it into the DAO."*

## 2. Deep DeFi Integrations
The Agent will expand past simple DAO staking to integrate with complex DeFi protocols on chains like Godwoken or layer-2 environments. The Strategy Agent will dynamically rebalance portfolios across Yield Farms, Liquidity Pools (DEXs), and Lending Protocols based on real-time APY differentials.

## 3. Real Trading Strategies
Currently focused on safe, predictable yield, the introduction of a new "Trading Agent" could integrate with centralized (Binance, Coinbase) or decentralized exchanges. This agent would execute advanced logic like TWAP (Time-Weighted Average Price) strategies or momentum hedging autonomously based on natural language market sentiment markers.

## 4. Native Mobile Application
To push the natural language interaction further, the Next.js frontend will be paired with a fully native React Native mobile application. This app would feature voice-to-text integration, allowing users to verbally command their autonomous portfolio on the go natively from their smartphones, utilizing secure enclave biometrics for transaction approvals.

## 5. AI Portfolio Optimization (Machine Learning)
While the current Strategy Engine utilizes LLM reasoning against calculated metrics, the next phase will integrate deep-learning models (like LSTMs or Transformers trained on historical blockchain data). This AI will generate highly personalized risk profiles for users, proposing complex, probabilistic risk-adjusted portfolios rather than simple linear yields.
