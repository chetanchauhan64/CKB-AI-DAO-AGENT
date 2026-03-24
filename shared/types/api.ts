// Shared API types between frontend and backend

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  response: string;
  intent?: string;
  toolCalled?: string;
  toolResult?: unknown;
  txHash?: string;
}

export interface WalletBalanceResponse {
  address: string;
  ckbBalance: string;      // human-readable CKB
  ckbBalanceShannons: string;  // raw shannons as string
  daoCellCount: number;
}

export interface ScheduleRequest {
  thresholdEpochs: number;
  enabled: boolean;
}

export interface ScheduleResponse {
  jobId: string;
  enabled: boolean;
  thresholdEpochs: number;
  nextRun: string;
}
