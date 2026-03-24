'use client';

import { Lightbulb, TrendingUp, Target } from 'lucide-react';
import type { StrategyRecommendation } from '@/types/agent';

export function StrategyPanel({ strategy }: { strategy: StrategyRecommendation | null }) {
  if (!strategy) {
    return (
      <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4 shadow-sm flex items-center justify-between opacity-60 m-5 mt-0 mb-4 transition-all">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--bg-base)] flex flex-center items-center justify-center">
              <Lightbulb size={16} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">Strategy Intelligence</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Awaiting first portfolio analysis...</p>
            </div>
         </div>
      </div>
    );
  }

  const isHold = strategy.action === 'HOLD';
  const iconColor = isHold ? 'var(--text-secondary)' : 'var(--ckb-green)';
  const badgeBg = isHold ? 'var(--bg-base)' : 'var(--ckb-green-dim)';

  return (
    <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--ckb-green)] shadow-[0_0_15px_rgba(59,201,130,0.1)] p-4 flex flex-col gap-3 m-5 mt-0 mb-4 animate-in fade-in slide-in-from-top-2 duration-500 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-1 h-full bg-[var(--ckb-green)]" />
      
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
           <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: badgeBg }}>
              <Lightbulb size={14} style={{ color: iconColor }} className={!isHold ? 'animate-pulse' : ''} />
           </div>
           <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ckb-green)' }}>
             AI Agent Recommendation
           </h3>
        </div>
        <div className="px-2.5 py-1 rounded text-xs font-bold font-mono tracking-tight" style={{ background: badgeBg, color: iconColor, border: `1px solid ${iconColor}40` }}>
          {strategy.action.replace(/_/g, ' ')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)]">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            <Target size={12} /> Reason
          </p>
          <p className="text-sm font-medium text-[var(--text-primary)] leading-snug">
            {strategy.reason}
          </p>
        </div>
        <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-[var(--bg-base)] border border-[var(--border)] relative overflow-hidden">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--ckb-purple)] flex items-center gap-1.5">
            <TrendingUp size={12} /> Expected Outcome
          </p>
          <p className="text-sm font-medium text-[var(--text-primary)] leading-snug relative z-10">
            {strategy.expectedOutcome}
          </p>
          {!isHold && <div className="absolute -right-4 -bottom-4 opacity-5 text-[var(--ckb-purple)] z-0"><TrendingUp size={64}/></div>}
        </div>
      </div>
    </div>
  );
}
