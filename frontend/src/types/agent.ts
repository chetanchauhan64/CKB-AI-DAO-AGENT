export interface StrategyRecommendation {
  action: string;
  reason: string;
  expectedOutcome: string;
}

export interface AgentExplanation {
  decision: string;
  reason: string;
  action: string;
  outcome: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalled?: string;
  txHash?: string;
  explanation?: AgentExplanation;
  agentFlow?: string[];
  timestamp: number;
  loading?: boolean;
  streaming?: boolean;   // true while typewriter interval is still running
}

export interface ChatResponse {
  response: string;
  toolCalled?: string;
  txHash?: string;
  intent?: string;
  strategy?: StrategyRecommendation;
  explanation?: AgentExplanation;
  agentFlow?: string[];
}
