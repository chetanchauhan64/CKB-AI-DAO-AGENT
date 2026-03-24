# API Reference

The backend exposes a REST API built on Express.js to communicate with the Next.js frontend. Below are the primary endpoints used to interact with the Multi-Agent System.

---

## 1. Health Check

Used to verify the backend is running and reachable.

**Endpoint:** `GET /api/v1/health`

**Response format (200 OK):**
```json
{
  "status": "ok",
  "uptime": 12345.67,
  "timestamp": "2026-03-19T12:00:00.000Z"
}
```

---

## 2. Execute Agent Prompt

This is the primary endpoint for sending a natural language intent to the autonomous agents. It returns an immediate HTTP response as well as triggering the asynchronous WebSocket stream.

**Endpoint:** `POST /api/v1/agent/prompt`

**Request Body:**
```json
{
  "prompt": "Deposit 500 CKB into the DAO and tell me the yield.",
  "sessionId": "usr_session_123456",
  "simulationMode": true
}
```

**Response format (200 OK):**
```json
{
  "status": "processing",
  "message": "Agent has received the intent and is beginning execution.",
  "sessionId": "usr_session_123456"
}
```

---

## 3. Retrieve Wallet Balance

Fetches the current accessible CKB balance for the configured wallet.

**Endpoint:** `GET /api/v1/wallet/balance`

**Request Body:** None

**Response format (200 OK):**
```json
{
  "balance": "10500.00",
  "unit": "CKB",
  "network": "testnet"
}
```

---

## 4. Retrieve DAO Yield Information

Fetches current DAO deposits, total locked value, and generated yield.

**Endpoint:** `GET /api/v1/dao/yield`

**Request Body:** None

**Response format (200 OK):**
```json
{
  "totalLocked": "5000.00",
  "currentApy": "2.45",
  "accruedYield": "12.3",
  "deposits": [
    {
      "id": "dep_01",
      "amount": "5000.00",
      "status": "locked",
      "depositedAt": "2026-03-10T10:00:00Z"
    }
  ]
}
```

---

## WebSocket Stream

While the REST APIs handle discrete state queries, the heavy lifting of agent logs is streamed.

**Connection:** `ws://localhost:3001`

**Event:** `agent-log`

**Example Payload:**
```json
{
  "type": "thought",
  "message": "I need to check the user's balance before I can deposit 500 CKB.",
  "agentPersona": "Wallet Agent",
  "timestamp": 1679000000000
}
```
