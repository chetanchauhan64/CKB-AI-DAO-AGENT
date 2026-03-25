'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { TopNav } from '@/components/ui/TopNav';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { WalletCard } from '@/components/wallet/WalletCard';
import { DAOTracker } from '@/components/dao/DAOTracker';
import { SchedulerPanel } from '@/components/automation/SchedulerPanel';
import { ActivityFeed } from '@/components/ui/ActivityFeed';
import { GlobalPortfolioHeader } from '@/components/ui/GlobalPortfolioHeader';
import { GlobalStatusBar } from '@/components/ui/GlobalStatusBar';
import { CompoundCelebration } from '@/components/ui/CompoundCelebration';
import { PortfolioCompletionModal } from '@/components/ui/PortfolioCompletionModal';
import { AIDecisionModal } from '@/components/ui/AIDecisionModal';
import { OnboardingFlow } from '@/components/ui/OnboardingFlow';
import { ToastContainer } from '@/components/ui/Toast';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useAppStore } from '@/store';

// ── Tab order for directional slide animation ────────────────────────────────
const TAB_ORDER: Record<string, number> = { chat: 0, dao: 1, activity: 2, scheduler: 3 };

// ── DAO tool names that trigger an auto-switch to DAO view ───────────────────
const DAO_TOOLS = new Set(['deposit', 'withdraw_phase1', 'withdraw_phase2', 'scan_dao']);

// ── Activity event types that increment the badge ────────────────────────────
const BADGE_EVENTS = new Set([
  'TOOL_SUCCESS', 'TX_CONFIRMED', 'TX_BROADCAST', 'REWARDS_CLAIMED',
  'HARVEST_INITIATED', 'HARVEST_PHASE2_READY',
]);

export default function DashboardPage() {
  const { isConnected } = useWebSocket();
  const activeView             = useAppStore((s) => s.activeView);
  const setActiveView          = useAppStore((s) => s.setActiveView);
  const focusMode              = useAppStore((s) => s.focusMode);
  const events                 = useAppStore((s) => s.events);
  const setAIStatus            = useAppStore((s) => s.setAIStatus);
  const incrementTx            = useAppStore((s) => s.incrementTx);
  const showPortfolioComplete    = useAppStore((s) => s.showPortfolioComplete);
  const setShowPortfolioComplete = useAppStore((s) => s.setShowPortfolioComplete);
  const updateMetrics          = useAppStore((s) => s.updateMetrics);
  const incrementActivityBadge = useAppStore((s) => s.incrementActivityBadge);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Directional slide animation state ───────────────────────────────────────
  // Tracks which CSS animation class to apply when switching views
  const [slideClass, setSlideClass]   = useState('view-fade-in');
  const prevViewOrderRef = useRef(TAB_ORDER['chat']);

  // Wraps setActiveView with directional animation logic
  const navigateTo = useCallback((view: typeof activeView) => {
    const nextOrder = TAB_ORDER[view] ?? 0;
    const currOrder = prevViewOrderRef.current;
    setSlideClass(nextOrder > currOrder ? 'view-slide-right' : 'view-slide-left');
    prevViewOrderRef.current = nextOrder;
    setActiveView(view);
  }, [setActiveView]);

  // ── Compound celebration ──────────────────────────────────────────────────
  const [celebVisible, setCelebVisible] = useState(false);
  const [celebAmount, setCelebAmount]   = useState<string | undefined>(undefined);
  const lastCelebId = useRef<string | null>(null);

  // ── DAO auto-switch debounce (avoid rapid switching) ─────────────────────
  const daoSwitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sync AI status + metrics from WS events + smart navigation ────────────
  const prevEventsLen = useRef(0);
  const activeViewRef = useRef(activeView);
  useEffect(() => { activeViewRef.current = activeView; }, [activeView]);

  useEffect(() => {
    if (!mounted || events.length === prevEventsLen.current) return;
    const newEvents = events.slice(0, events.length - prevEventsLen.current);
    prevEventsLen.current = events.length;

    for (const ev of newEvents) {
      // ── AI status bookkeeping ──────────────────────────────────────────────
      if (ev.type === 'AGENT_THINKING')   setAIStatus('active');
      if (ev.type === 'AGENT_TOOL_CALL')  setAIStatus('executing');
      if (ev.type === 'TOOL_SUCCESS' || ev.type === 'TX_CONFIRMED') {
        setAIStatus('monitoring');
        incrementTx(true);
      }
      if (ev.type === 'TOOL_ERROR' || ev.type === 'TX_FAILED') {
        setAIStatus('monitoring');
        incrementTx(false);
      }

      // ── Compound celebration ───────────────────────────────────────────────
      if (
        ev.type === 'TX_BROADCAST' &&
        typeof ev.payload?.message === 'string' &&
        (ev.payload.message as string).toLowerCase().includes('compound') &&
        ev.id !== lastCelebId.current
      ) {
        lastCelebId.current = ev.id;
        const match = (ev.payload.message as string).match(/([\d.]+)\s*CKB/);
        setCelebAmount(match ? match[1] : undefined);
        setCelebVisible(true);
      }

      // ── Portfolio complete trigger ─────────────────────────────────────────
      if (
        ev.type === 'TX_CONFIRMED' &&
        typeof ev.payload?.message === 'string' &&
        (ev.payload.message as string).toLowerCase().includes('reinvest')
      ) {
        setTimeout(() => setShowPortfolioComplete(true), 1500);
      }

      // ── Metrics ───────────────────────────────────────────────────────────
      if (ev.type === 'TOOL_SUCCESS' && (ev.payload.tool as string) === 'deposit') {
        updateMetrics({ yieldGrowthPercent: 1.2 });
      }

      // ── Smart Navigation: DAO auto-switch ─────────────────────────────────
      // When a DAO tool completes successfully, gently navigate to DAO view
      // after a short delay so the user gets context. Only if NOT already there.
      if (ev.type === 'TOOL_SUCCESS') {
        const tool = (ev.payload.tool ?? ev.payload.toolName) as string | undefined;
        if (tool && DAO_TOOLS.has(tool) && activeViewRef.current !== 'dao') {
          // Debounce: cancel any pending switch and reschedule
          if (daoSwitchTimer.current) clearTimeout(daoSwitchTimer.current);
          daoSwitchTimer.current = setTimeout(() => {
            navigateTo('dao');
          }, 1200); // 1.2s delay — gives time for toast/response to register
        }
      }

      // ── Smart Navigation: Activity badge ─────────────────────────────────
      // Meaningful events increment the badge when user is not on Activity tab
      if (BADGE_EVENTS.has(ev.type) && activeViewRef.current !== 'activity') {
        incrementActivityBadge();
      }
    }
  }, [events, mounted, setAIStatus, incrementTx, setShowPortfolioComplete, updateMetrics, navigateTo, incrementActivityBadge]);

  // Cleanup DAO switch timer on unmount
  useEffect(() => () => {
    if (daoSwitchTimer.current) clearTimeout(daoSwitchTimer.current);
  }, []);

  const handleCelebDone         = useCallback(() => setCelebVisible(false), []);
  const handlePortfolioComplete = useCallback(() => setShowPortfolioComplete(false), [setShowPortfolioComplete]);

  const sendMessageRef = useRef<((msg: string) => void) | null>(null);
  const handleOnboardingMessage = useCallback((msg: string) => {
    sendMessageRef.current?.(msg);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center justify-center flex-1 opacity-40">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--ckb-green)] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  // ── Layout helpers ──────────────────────────────────────────────────────────
  const isChatView     = activeView === 'chat';
  const isDAOView      = activeView === 'dao';
  const isActivityView = activeView === 'activity';
  const isScheduler    = activeView === 'scheduler';
  const showContextPanels = !focusMode;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isConnected={isConnected} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative z-10 flex-col">
        {/* Global Status Bar — very top */}
        <GlobalStatusBar />

        {/* Top Navigation: tabs + Focus Mode toggle */}
        <TopNav />

        <div className="flex flex-1 overflow-hidden">
          {/* Main content column */}
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* Wallet Card + Portfolio Header (hidden in Focus Mode) */}
            {showContextPanels && (
              <div className="flex-shrink-0 page-enter">
                <div className="px-5 pt-4 pb-0">
                  <WalletCard />
                </div>
                <div className="px-5 pt-3 pb-0">
                  <GlobalPortfolioHeader />
                </div>
              </div>
            )}

            {/* View panels */}
            <div className="flex-1 overflow-hidden p-5">

              {/* ── Chat view ── */}
              <div
                className={`h-full ${isChatView ? slideClass : 'hidden'}`}
                style={focusMode && isChatView ? { maxWidth: 860, margin: '0 auto', width: '100%' } : {}}
              >
                <ChatPanel wsEvents={events} sendMessageRef={sendMessageRef} />
              </div>

              {/* ── DAO view ── */}
              <div className={isDAOView ? `h-full ${slideClass}` : 'hidden'}>
                <DAOTracker />
              </div>

              {/* ── Scheduler view ── */}
              <div className={isScheduler ? `h-full ${slideClass}` : 'hidden'}>
                <SchedulerPanel />
              </div>

              {/* ── Activity view ── */}
              <div className={isActivityView ? `h-full ${slideClass}` : 'hidden'}>
                <ActivityFeed events={events} large />
              </div>
            </div>
          </div>

          {/* Right column: live activity sidebar (only in Expanded Mode, non-Activity views) */}
          {showContextPanels && !isActivityView && (
            <div
              className="w-72 flex-shrink-0 border-l overflow-hidden flex flex-col p-4 page-enter"
              style={{ borderColor: 'var(--border)' }}
            >
              <ActivityFeed events={events} />
            </div>
          )}
        </div>
      </div>

      {/* ── Global overlays ── */}
      <CompoundCelebration visible={celebVisible} amount={celebAmount} onDone={handleCelebDone} />
      <PortfolioCompletionModal visible={showPortfolioComplete} onDone={handlePortfolioComplete} />
      <AIDecisionModal />
      <OnboardingFlow onSendMessage={handleOnboardingMessage} />
      <ToastContainer />
    </div>
  );
}
