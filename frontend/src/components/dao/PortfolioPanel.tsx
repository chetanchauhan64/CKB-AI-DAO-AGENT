'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { TrendingUp, Brain, Shield, Zap } from 'lucide-react';
import type { DaoCell } from '@/lib/apiClient';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, suffix = '', color = 'var(--ckb-green)', icon: Icon, decimals = 2,
}: {
  label: string;
  value: number;
  suffix?: string;
  color?: string;
  icon: typeof TrendingUp;
  decimals?: number;
}) {
  const animated = useCountUp(value);

  return (
    <div
      className="card-hover p-4 rounded-2xl flex flex-col gap-2 transition-all duration-300"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}1a` }}>
          <Icon size={13} style={{ color }} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <div
        className="text-[22px] font-bold leading-tight"
        style={{ color, fontFamily: 'JetBrains Mono, monospace' }}
      >
        {animated.toFixed(decimals)}
        <span className="text-[12px] font-normal ml-1 opacity-70">{suffix}</span>
      </div>
    </div>
  );
}

// ─── AI Insight ───────────────────────────────────────────────────────────────
function AIInsight({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-3 p-4 rounded-2xl"
      style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)' }}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(168,85,247,0.15)' }}>
        <Brain size={15} style={{ color: 'var(--ckb-purple)' }} />
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ckb-purple)' }}>
          AI Portfolio Insight
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {message}
        </p>
      </div>
    </div>
  );
}

// ─── Auto Strategy Badge ──────────────────────────────────────────────────────
export function AutoStrategyBadge({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-bold"
      style={{ background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.25)', color: 'var(--ckb-green)' }}
    >
      <div className="relative flex items-center justify-center w-2 h-2">
        <div className="absolute w-full h-full rounded-full bg-[var(--ckb-green)] animate-ping opacity-70" />
        <div className="relative w-2 h-2 rounded-full bg-[var(--ckb-green)]" />
      </div>
      🤖 AI Strategy Active — monitoring and auto-harvesting
    </div>
  );
}

// ─── Main Portfolio Panel ─────────────────────────────────────────────────────
interface PortfolioPanelProps {
  cells: DaoCell[];
  extraEarned?: number; // CKB earned via simulation (passed from parent)
  autoStrategy?: boolean;
}

export function PortfolioPanel({ cells, extraEarned = 0, autoStrategy = false }: PortfolioPanelProps) {
  const stats = useMemo(() => {
    const totalDeposited = cells.reduce((s, c) => s + Number(c.capacityCKB), 0);
    const totalRewards   = cells.reduce((s, c) => s + (Number(c.estimatedRewardCKB) || 0), 0) + extraEarned;
    const roi            = totalDeposited > 0 ? (totalRewards / totalDeposited) * 100 : 0;
    const withdrawing    = cells.filter((c) => c.status === 'withdrawing').length;
    return { totalDeposited, totalRewards, roi, withdrawing, count: cells.length };
  }, [cells, extraEarned]);

  const insight = useMemo(() => {
    if (stats.count === 0) return 'No active positions. Deposit CKB to start earning DAO yield.';
    if (stats.roi > 1.5)   return `Outstanding yield! Your ${stats.count} deposit${stats.count > 1 ? 's are' : ' is'} earning above-average DAO returns. Consider compounding soon.`;
    if (stats.withdrawing) return `${stats.withdrawing} position${stats.withdrawing > 1 ? 's are' : ' is'} unlocking. Claim when ready to maximize compounding.`;
    return `Your funds are optimally allocated across ${stats.count} position${stats.count > 1 ? 's' : ''}. Auto-harvest is the recommended next action.`;
  }, [stats]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Zap size={13} style={{ color: 'var(--ckb-purple)' }} /> Portfolio Insights
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Real-time breakdown of your DeFi positions
          </p>
        </div>
        {autoStrategy && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,212,170,0.1)', color: 'var(--ckb-green)', border: '1px solid rgba(0,212,170,0.2)' }}>
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ckb-green)] opacity-75" />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-[var(--ckb-green)]" />
            </span>
            Auto
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Deposited" value={stats.totalDeposited} suffix="CKB"
          color="var(--ckb-orange)" icon={Shield} decimals={2} />
        <StatCard label="Total Earned"    value={stats.totalRewards}   suffix="CKB"
          color="var(--ckb-green)"  icon={TrendingUp} decimals={4} />
        <StatCard label="Est. ROI"        value={stats.roi}            suffix="%"
          color="var(--ckb-purple)" icon={Zap} decimals={3} />
      </div>

      {/* AI Insight */}
      <AIInsight message={insight} />
    </div>
  );
}
