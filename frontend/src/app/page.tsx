'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
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

export default function DashboardPage() {
  const { isConnected } = useWebSocket();
  const activeView   = useAppStore((s) => s.activeView);
  const events       = useAppStore((s) => s.events);
  const setAIStatus  = useAppStore((s) => s.setAIStatus);
  const incrementTx  = useAppStore((s) => s.incrementTx);
  const showPortfolioComplete    = useAppStore((s) => s.showPortfolioComplete);
  const setShowPortfolioComplete = useAppStore((s) => s.setShowPortfolioComplete);
  const updateMetrics = useAppStore((s) => s.updateMetrics);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ── Compound celebration ──────────────────────────────────────────────────
  const [celebVisible, setCelebVisible] = useState(false);
  const [celebAmount, setCelebAmount]   = useState<string | undefined>(undefined);
  const lastCelebId = useRef<string | null>(null);

  // ── Sync AI status + metrics from WS events ───────────────────────────────
  const prevEventsLen = useRef(0);
  useEffect(() => {
    if (!mounted || events.length === prevEventsLen.current) return;
    const newEvents = events.slice(0, events.length - prevEventsLen.current);
    prevEventsLen.current = events.length;

    for (const ev of newEvents) {
      // Status transitions
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

      // Compound celebration trigger
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

      // Portfolio complete trigger: after a reinvest TX is confirmed
      if (
        ev.type === 'TX_CONFIRMED' &&
        typeof ev.payload?.message === 'string' &&
        (ev.payload.message as string).toLowerCase().includes('reinvest')
      ) {
        setTimeout(() => setShowPortfolioComplete(true), 1500);
      }

      // Update yield growth
      if (ev.type === 'TOOL_SUCCESS' && (ev.payload.tool as string) === 'deposit') {
        updateMetrics({ yieldGrowthPercent: 1.2 });
      }
    }
  }, [events, mounted, setAIStatus, incrementTx, setShowPortfolioComplete, updateMetrics]);

  const handleCelebDone     = useCallback(() => setCelebVisible(false), []);
  const handlePortfolioComplete = useCallback(() => setShowPortfolioComplete(false), [setShowPortfolioComplete]);

  // Ref for sending messages from onboarding
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

  const showRightPanel = activeView !== 'activity';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isConnected={isConnected} />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative z-10 flex-col">
        {/* Global Status Bar — very top */}
        <GlobalStatusBar />

        <div className="flex flex-1 overflow-hidden">
          {/* Left column */}
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Wallet Card */}
            <div className="px-5 pt-5 pb-0 flex-shrink-0 page-enter">
              <WalletCard />
            </div>

            {/* Global Portfolio Header */}
            <div className="px-5 pt-3 pb-0 flex-shrink-0">
              <GlobalPortfolioHeader />
            </div>

            <div className="flex-1 overflow-hidden p-5">
              <div className={activeView === 'chat' ? 'h-full page-enter' : 'hidden'}>
                <ChatPanel wsEvents={events} sendMessageRef={sendMessageRef} />
              </div>

              <div className={activeView === 'dao' ? 'h-full page-enter' : 'hidden'}>
                <DAOTracker />
              </div>

              <div className={activeView === 'scheduler' ? 'h-full page-enter' : 'hidden'}>
                <SchedulerPanel />
              </div>

              <div className={activeView === 'activity' ? 'h-full page-enter' : 'hidden'}>
                <ActivityFeed events={events} large />
              </div>
            </div>
          </div>

          {/* Right column: always-on live diagnostics (hidden when Activity is fullscreen) */}
          {showRightPanel && (
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
