// Shared agent and AI types

export type IntentType =
  | 'deposit'
  | 'withdraw_phase1'
  | 'withdraw_phase2'
  | 'check_balance'
  | 'list_dao_cells'
  | 'get_epoch_info'
  | 'calculate_rewards'
  | 'schedule_harvest'
  | 'cancel_schedule'
  | 'explain_dao'
  | 'unknown';

export interface ParsedIntent {
  intent: IntentType;
  confidence: number;
  params: Record<string, unknown>;
  rawMessage: string;
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
}

export interface ToolCall {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolUseId: string;
}

export interface ToolResult {
  toolUseId: string;
  content: string;
  isError: boolean;
}
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

export interface AgentRunResult {
  response: string;
  toolCalled?: string;
  toolInput?: Record<string, unknown>;
  toolResult?: unknown;
  txHash?: string;
  intent?: IntentType;
  tokensUsed?: number;
  strategy?: StrategyRecommendation;
  explanation?: AgentExplanation;
  agentFlow?: string[];
}

// WebSocket event types
export type WebSocketEventType =
  | 'TX_BROADCAST'
  | 'TX_CONFIRMED'
  | 'TX_FAILED'
  | 'HARVEST_INITIATED'
  | 'HARVEST_PHASE2_READY'
  | 'REWARDS_CLAIMED'
  | 'EPOCH_ALERT'
  | 'DAO_MONITOR_TICK'
  | 'AGENT_THINKING'
  | 'AGENT_TOOL_CALL'
  | 'AGENT_MESSAGE_CHUNK';

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: Record<string, unknown>;
  timestamp: number;
}
