/**
 * apiClient.ts
 * Typed HTTP client for the CKB DAO Agent backend.
 *
 * Reads the backend URL from either:
 *   NEXT_PUBLIC_API_BASE_URL   (canonical name)
 *   NEXT_PUBLIC_BACKEND_URL    (legacy name)
 * Falls back to http://localhost:3001 if neither is set.
 */

// Support both env var names so the frontend always resolves correctly
import type { ChatResponse } from '@/types/agent';

// Support both env var names so the frontend always resolves correctly
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  'http://localhost:3001';

// Inline DAO cell type to avoid cross-project path resolution issues
export interface DaoCell {
  outPoint: { txHash: string; index: string };
  capacity: string;
  capacityCKB: string;
  status: 'deposited' | 'withdrawing' | 'unlockable' | 'claimed';
  estimatedRewardCKB?: string;
}

/**
 * Core fetch wrapper.
 * - Gives a clear error when the backend is unreachable (connection refused)
 * - Throws on non-success API responses with the backend error message
 */
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}/api/v1${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      ...options,
    });
  } catch (networkErr) {
    // Thrown when the backend is not running or a CORS preflight fails
    throw new Error(
      `Cannot reach backend at ${API_BASE}. Is the backend running? (run "npm run dev" in /backend)\n` +
      `Original error: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`,
    );
  }

  let json: { success: boolean; data?: T; error?: string };
  try {
    json = await res.json();
  } catch {
    throw new Error(`Backend returned non-JSON response (HTTP ${res.status}) from ${url}`);
  }

  if (!json.success) {
    throw new Error(json.error ?? `Backend error (HTTP ${res.status})`);
  }

  return json.data as T;
}

/** Ping the backend health endpoint. Returns true if reachable. */
export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  /** Send a message to the AI agent and get a structured response */
  chat: (message: string, sessionId = 'default') =>
    apiFetch<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, sessionId }),
    }),

  /** Full wallet status: address, CKB balance, DAO cell counts */
  getBalance: () =>
    apiFetch<{
      address: string;
      ckbBalance: string;
      ckbBalanceShannons: string;
      daoCellCount?: number;
      depositedCount?: number;
      withdrawingCount?: number;
    }>('/wallet/balance'),

  /** Wallet address only */
  getAddress: () => apiFetch<{ address: string }>('/wallet/address'),

  /** All DAO cells with status */
  getDAOCells: () => apiFetch<{ cells: DaoCell[]; count: number }>('/dao/cells'),

  /** Current epoch number, progress, and cycle info */
  getEpochInfo: () => apiFetch<Record<string, unknown>>('/dao/epoch'),

  /** Auto-harvest scheduler status */
  getScheduleStatus: () =>
    apiFetch<{ enabled: boolean; thresholdEpochs: number }>('/schedule/harvest/status'),

  /** Enable/disable auto-harvest and set epoch threshold */
  setSchedule: (enabled: boolean, threshold_epochs = 5) =>
    apiFetch<{ enabled: boolean; thresholdEpochs: number }>('/schedule/harvest', {
      method: 'POST',
      body: JSON.stringify({ enabled, threshold_epochs }),
    }),

  /** List all scheduled recurring payments */
  getPayments: () =>
    apiFetch<Array<{ id: string; to: string; amount_ckb: number; cron: string; label: string }>>(
      '/schedule/payments'
    ),

  /** Create a new recurring payment */
  createPayment: (to: string, amount_ckb: number, cron: string, label?: string) =>
    apiFetch<{ id: string; to: string; amount_ckb: number; cron: string; label: string }>(
      '/schedule/payment',
      { method: 'POST', body: JSON.stringify({ to, amount_ckb, cron, label }) }
    ),

  /** Cancel a scheduled payment by ID */
  cancelPayment: (id: string) =>
    apiFetch<{ id: string; cancelled: true }>(`/schedule/payment/${id}`, { method: 'DELETE' }),

  /** Send CKB to an address */
  sendCKB: (to: string, amount_ckb: number) =>
    apiFetch<{ txHash: string; fromAddress: string; toAddress: string; amountCKB: string }>(
      '/wallet/send',
      { method: 'POST', body: JSON.stringify({ to, amount_ckb }) },
    ),

  /** Network / chain info */
  getNetworkInfo: () =>
    apiFetch<{ chain: string; tipBlockNumber: string; isMainnet: boolean }>('/wallet/network'),

  // ── Simulation (Hackathon Demo feature) ──────────────────────────────────

  getSimulationMode: () =>
    apiFetch<{ enabled: boolean }>('/simulation'),

  setSimulationMode: (enabled: boolean) =>
    apiFetch<{ enabled: boolean }>('/simulation', {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
};
