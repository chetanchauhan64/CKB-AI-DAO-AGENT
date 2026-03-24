'use client';

import { useEffect, useState, useRef } from 'react';
import { TrendingUp, Zap, Shield, Bot, Activity, Award } from 'lucide-react';
import { useDAOCells } from '@/hooks/useWallet';
import { useWallet } from '@/hooks/useWallet';
import { useAppStore } from '@/store';
import { RiskProfileSelector } from '@/components/ui/RiskProfileSelector';
import { SmartInsightsPanel } from '@/components/ui/SmartInsightsPanel';

// ─── Animated counter ──────────────────────────────────────────────────────────
function AnimatedNumber({ value, decimals = 2, prefix = '', suffix = '', color = 'var(--text-primary)' }: {
  value: number; decimals?: number; prefix?: string; suffix?: string; color?: string;
}) {
  const [display, setDisplay] = useState(0);
  const [glowing, setGlowing] = useState(false);
  const prevRef = useRef(value);
  const rafRef  = useRef<number | null>(null);

  useEffect(() => {
    if (Math.abs(value - prevRef.current) < 0.0001) return;
    setGlowing(true);
    const timer = setTimeout(() => setGlowing(false), 1400);
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    const start = performance.now();
    const duration = 1000;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (to - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); clearTimeout(timer); };
  }, [value]);

  return (
    <span
      style={{
        color,
        fontFamily: 'JetBrains Mono, monospace',
        textShadow: glowing ? `0 0 16px ${color}80` : 'none',
        transition: 'text-shadow 0.4s ease',
      }}
    >
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}

// ─── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, children, icon: Icon, color }: {
  label: string; children: React.ReactNode;
  icon: typeof TrendingUp; color: string;
}) {
  return (
    <div
      className="card-hover flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', transition: 'all 0.2s ease' }}
    >
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}1a` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="text-[15px] font-bold leading-tight">{children}</div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function GlobalPortfolioHeader() {
  const { cells } = useDAOCells();
  const { ckbBalance } = useWallet();
  const isAutopilot   = useAppStore((s) => s.isAutopilot);
  const events        = useAppStore((s) => s.events);
  const metrics       = useAppStore((s) => s.metrics);

  const totalRewards     = cells.reduce((s, c) => s + (Number(c.estimatedRewardCKB) || 0), 0);
  const totalBalance     = Number(ckbBalance) || 0;
  const activeStrategies = cells.filter((c) => c.status === 'deposited').length;
  const txCount          = events.filter((e) => e.type === 'TX_BROADCAST' || e.type === 'TX_CONFIRMED').length;
  const claimedCount     = events.filter((e) => e.type === 'REWARDS_CLAIMED').length;

  return (
    <div className="flex flex-col gap-3" style={{ animation: 'fadeUp 0.4s ease-out both' }}>
      {/* ── Stats row + Risk selector ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <StatPill label="Portfolio Value" icon={Shield} color="var(--ckb-orange)">
          <AnimatedNumber value={totalBalance} decimals={2} suffix=" CKB" color="var(--ckb-orange)" />
        </StatPill>

        <StatPill label="Total Earned" icon={TrendingUp} color="var(--ckb-green)">
          <AnimatedNumber value={totalRewards} decimals={4} prefix="+" suffix=" CKB" color="var(--ckb-green)" />
        </StatPill>

        <StatPill label="Active Strategies" icon={Zap} color="var(--ckb-purple)">
          <AnimatedNumber value={activeStrategies} decimals={0} color="var(--ckb-purple)" />
        </StatPill>

        {txCount > 0 && (
          <StatPill label="Transactions" icon={Activity} color="var(--ckb-blue)">
            <AnimatedNumber value={txCount} decimals={0} color="var(--ckb-blue)" />
          </StatPill>
        )}

        {claimedCount > 0 && (
          <StatPill label="Claimed" icon={Award} color="var(--ckb-green)">
            <AnimatedNumber value={claimedCount} decimals={0} color="var(--ckb-green)" />
          </StatPill>
        )}

        {/* Risk profile compact pill — always visible */}
        <div
          className="card-hover flex items-center gap-2 px-3 py-2 rounded-2xl ml-auto"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="text-[8px] font-bold uppercase tracking-widest mr-1" style={{ color: 'var(--text-muted)' }}>Risk</div>
          <RiskProfileSelector compact />
        </div>

        {/* Autopilot badge */}
        {isAutopilot && (
          <div
            className="autopilot-ring flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-bold"
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,170,0.1) 0%, rgba(59,91,219,0.08) 100%)',
              border: '1px solid rgba(0,212,170,0.4)',
              color: 'var(--ckb-green)',
            }}
          >
            <span className="relative flex w-2.5 h-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ckb-green)] opacity-75" />
              <span className="relative inline-flex rounded-full w-2.5 h-2.5 bg-[var(--ckb-green)]" />
            </span>
            <Bot size={14} />
            AI Pilot Active
          </div>
        )}
      </div>

      {/* ── Autopilot full banner ── */}
      {isAutopilot && (
        <div
          className="narrator-enter flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,170,0.06) 0%, rgba(59,91,219,0.05) 100%)',
            border: '1px solid rgba(0,212,170,0.25)',
          }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,212,170,0.15)' }}>
            <Bot size={16} style={{ color: 'var(--ckb-green)' }} />
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--ckb-green)' }}>
              🤖 Autopilot Active
            </div>
            <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              AI is monitoring your portfolio — it will auto-withdraw at maturity, claim rewards, and reinvest.
            </p>
          </div>
          {metrics.totalTxExecuted > 0 && (
            <div className="text-right">
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Success</div>
              <div className="text-[14px] font-bold" style={{ color: 'var(--ckb-green)', fontFamily: 'JetBrains Mono' }}>
                {metrics.automationSuccessRate}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SmartInsightsPanel — always shown ── */}
      <SmartInsightsPanel />
    </div>
  );
}
