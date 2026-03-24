import { create } from 'zustand';

export interface WebSocketEvent {
  type: string;
  payload: {
    message?: string;
    tool?: string;
    toolName?: string;
    input?: unknown;
    output?: unknown;
    txHash?: string;
    [key: string]: unknown;
  };
  timestamp: number;
  id: string;
}

// ─── Risk Profile ──────────────────────────────────────────────────────────────
export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';

export const RISK_CONFIG: Record<RiskProfile, {
  label: string; emoji: string; color: string; bg: string; border: string;
  description: string; actionFrequency: string;
}> = {
  conservative: {
    label: 'Conservative', emoji: '🟢', color: '#22c55e',
    bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)',
    description: 'Stable returns, minimal risk. AI acts cautiously.',
    actionFrequency: 'AI waits for full maturity before acting.',
  },
  balanced: {
    label: 'Balanced', emoji: '🟡', color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
    description: 'Optimized for yield + stability balance.',
    actionFrequency: 'AI compounds at strategic intervals.',
  },
  aggressive: {
    label: 'Aggressive', emoji: '🔴', color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)',
    description: 'Maximum compounding, faster reinvestment cycles.',
    actionFrequency: 'AI acts immediately on any yield opportunity.',
  },
};

// ─── AI Status ────────────────────────────────────────────────────────────────
export type AIStatus = 'active' | 'monitoring' | 'executing';

// ─── AI Recommendation ────────────────────────────────────────────────────────
export interface AIRecommendation {
  id: string;
  title: string;
  message: string;
  action: string; // e.g. "Withdraw now", "Reinvest"
  urgency: 'low' | 'medium' | 'high';
  insight?: string; // extra AI reasoning
}

// ─── Performance Metrics ──────────────────────────────────────────────────────
export interface PerformanceMetrics {
  totalTxExecuted: number;
  automationSuccessRate: number; // 0-100
  yieldGrowthPercent: number;
  lastUpdated: number;
}

// ─── Onboarding ───────────────────────────────────────────────────────────────
export type OnboardingStep = 0 | 1 | 2 | 3 | 4; // 0 = not started, 4 = done

interface AppState {
  // Navigation
  activeView: 'chat' | 'dao' | 'scheduler' | 'activity';
  setActiveView: (view: 'chat' | 'dao' | 'scheduler' | 'activity') => void;

  // Demo mode
  isDemoMode: boolean;
  setDemoMode: (val: boolean) => void;

  // Autopilot mode
  isAutopilot: boolean;
  setAutopilot: (val: boolean) => void;

  // Risk Profile
  riskProfile: RiskProfile;
  setRiskProfile: (p: RiskProfile) => void;

  // AI Status (for global status bar)
  aiStatus: AIStatus;
  setAIStatus: (s: AIStatus) => void;

  // Pending AI Recommendation (decision engine)
  pendingRecommendation: AIRecommendation | null;
  setPendingRecommendation: (r: AIRecommendation | null) => void;

  // Performance metrics
  metrics: PerformanceMetrics;
  updateMetrics: (delta: Partial<PerformanceMetrics>) => void;
  incrementTx: (success: boolean) => void;

  // Onboarding
  onboardingStep: OnboardingStep;
  setOnboardingStep: (s: OnboardingStep) => void;
  onboardingDismissed: boolean;
  dismissOnboarding: () => void;

  // Portfolio automation complete overlay
  showPortfolioComplete: boolean;
  setShowPortfolioComplete: (v: boolean) => void;

  // WebSocket events - single source of truth
  events: WebSocketEvent[];
  isConnected: boolean;
  addEvent: (event: Omit<WebSocketEvent, 'id'>) => void;
  setConnected: (val: boolean) => void;
  clearEvents: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'chat',
  setActiveView: (view) => set({ activeView: view }),

  isDemoMode: false,
  setDemoMode: (val) => set({ isDemoMode: val }),

  isAutopilot: false,
  setAutopilot: (val) => set({ isAutopilot: val }),

  riskProfile: 'balanced',
  setRiskProfile: (p) => set({ riskProfile: p }),

  aiStatus: 'monitoring',
  setAIStatus: (s) => set({ aiStatus: s }),

  pendingRecommendation: null,
  setPendingRecommendation: (r) => set({ pendingRecommendation: r }),

  metrics: {
    totalTxExecuted: 0,
    automationSuccessRate: 100,
    yieldGrowthPercent: 0,
    lastUpdated: Date.now(),
  },
  updateMetrics: (delta) =>
    set((state) => ({
      metrics: { ...state.metrics, ...delta, lastUpdated: Date.now() },
    })),
  incrementTx: (success) =>
    set((state) => {
      const total = state.metrics.totalTxExecuted + 1;
      const successCount = Math.round((state.metrics.automationSuccessRate / 100) * (total - 1)) + (success ? 1 : 0);
      return {
        metrics: {
          ...state.metrics,
          totalTxExecuted: total,
          automationSuccessRate: Math.round((successCount / total) * 100),
          lastUpdated: Date.now(),
        },
      };
    }),

  onboardingStep: 0,
  setOnboardingStep: (s) => set({ onboardingStep: s }),
  onboardingDismissed: false,
  dismissOnboarding: () => set({ onboardingDismissed: true, onboardingStep: 4 }),

  showPortfolioComplete: false,
  setShowPortfolioComplete: (v) => set({ showPortfolioComplete: v }),

  events: [],
  isConnected: false,
  addEvent: (event) =>
    set((state) => {
      const newEvent: WebSocketEvent = {
        ...event,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
      const updated = [newEvent, ...state.events];
      return { events: updated.slice(0, 200) };
    }),
  setConnected: (val) => set({ isConnected: val }),
  clearEvents: () => set({ events: [] }),
}));
