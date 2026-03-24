'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { CheckCircle, Circle, ChevronRight, X } from 'lucide-react';

const STEPS = [
  {
    step: 1 as const,
    title: 'Check your balance',
    description: 'Ask the AI to check your CKB balance.',
    prompt: 'Check my CKB balance',
    emoji: '💰',
    highlight: 'chat',
  },
  {
    step: 2 as const,
    title: 'Deposit into DAO',
    description: 'Deposit CKB to start earning yield.',
    prompt: 'Deposit 100 CKB into the DAO',
    emoji: '🏦',
    highlight: 'chat',
  },
  {
    step: 3 as const,
    title: 'Withdraw & Claim',
    description: 'Withdraw your position and claim rewards.',
    prompt: 'Show my DAO deposits',
    emoji: '💎',
    highlight: 'dao',
  },
  {
    step: 4 as const,
    title: 'Reinvest & Compound',
    description: 'Enable auto-harvest for continuous compounding.',
    prompt: 'Enable auto-harvest at 5 epochs',
    emoji: '🚀',
    highlight: 'scheduler',
  },
] as const;

interface OnboardingFlowProps {
  onSendMessage?: (msg: string) => void;
}

export function OnboardingFlow({ onSendMessage }: OnboardingFlowProps) {
  const onboardingStep      = useAppStore((s) => s.onboardingStep);
  const setOnboardingStep   = useAppStore((s) => s.setOnboardingStep);
  const dismissed           = useAppStore((s) => s.onboardingDismissed);
  const dismissOnboarding   = useAppStore((s) => s.dismissOnboarding);
  const setActiveView       = useAppStore((s) => s.setActiveView);
  const [collapsed, setCollapsed] = useState(false);

  // Auto-advance demo
  useEffect(() => {
    if (dismissed || onboardingStep === 4) return;
    
    // Don't show initially (step 0 = not started)
    if (onboardingStep === 0) {
      const t = setTimeout(() => setOnboardingStep(1), 1500);
      return () => clearTimeout(t);
    }
  }, [onboardingStep, dismissed, setOnboardingStep]);

  if (dismissed || onboardingStep === 0 || onboardingStep === 4) return null;

  const currentStepData = STEPS[onboardingStep - 1];
  const completedSteps  = onboardingStep - 1;

  const handleAction = () => {
    if (onSendMessage && currentStepData.prompt) {
      onSendMessage(currentStepData.prompt);
      setActiveView(currentStepData.highlight as 'chat' | 'dao' | 'scheduler' | 'activity');
    }
    if (onboardingStep < 4) {
      setTimeout(() => setOnboardingStep((onboardingStep + 1) as 1 | 2 | 3 | 4), 800);
    } else {
      dismissOnboarding();
    }
  };

  const handleSkipAll = () => dismissOnboarding();

  return (
    <div
      className="narrator-enter"
      style={{
        position: 'fixed',
        bottom: '6rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 200,
        width: 'min(480px, 90vw)',
        pointerEvents: 'auto',
      }}
    >
      <div
        className="rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(10,11,15,0.97)',
          border: '1px solid rgba(0,212,170,0.3)',
          boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 60px rgba(0,212,170,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 border-b cursor-pointer"
          style={{ borderColor: 'rgba(0,212,170,0.2)', background: 'rgba(0,212,170,0.04)' }}
          onClick={() => setCollapsed((c) => !c)}
        >
          <div className="flex items-center gap-2">
            <span className="text-[14px]">🎯</span>
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--ckb-green)' }}>
              Getting Started — Step {onboardingStep} of 4
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); handleSkipAll(); }}
              className="text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
              style={{ color: 'var(--text-muted)' }}
            >
              Skip all
            </button>
            <X size={14} style={{ color: 'var(--text-muted)' }} onClick={(e) => { e.stopPropagation(); handleSkipAll(); }} />
          </div>
        </div>

        {!collapsed && (
          <div className="px-5 py-4">
            {/* Step progress dots */}
            <div className="flex items-center gap-2 mb-4">
              {STEPS.map((s, i) => {
                const done = i < completedSteps;
                const active = i === completedSteps;
                return (
                  <div key={i} className="flex items-center gap-2 flex-1">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{
                        background: done ? 'var(--ckb-green)' : active ? 'rgba(0,212,170,0.15)' : 'var(--bg-base)',
                        border: `1px solid ${done || active ? 'var(--ckb-green)' : 'var(--border)'}`,
                      }}
                    >
                      {done ? (
                        <CheckCircle size={12} color="#000" />
                      ) : active ? (
                        <span className="text-[10px]">{s.emoji}</span>
                      ) : (
                        <Circle size={12} style={{ color: 'var(--border)' }} />
                      )}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="h-0.5 flex-1 rounded-full transition-colors duration-500"
                        style={{ background: done ? 'var(--ckb-green)' : 'var(--border)' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Current step */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: 'rgba(0,212,170,0.1)', border: '1px solid rgba(0,212,170,0.3)' }}
              >
                {currentStepData.emoji}
              </div>
              <div>
                <div className="text-[13px] font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>
                  {currentStepData.title}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                  {currentStepData.description}
                </div>
              </div>
            </div>

            {/* Action button */}
            <button
              onClick={handleAction}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--ckb-green), rgba(0,180,120,0.9))',
                color: '#000',
                boxShadow: '0 4px 20px rgba(0,212,170,0.3)',
              }}
            >
              {currentStepData.title}
              <ChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
