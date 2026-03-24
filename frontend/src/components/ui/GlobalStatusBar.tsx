'use client';

import { useAppStore, RISK_CONFIG } from '@/store';
import { Bot, Eye, Zap, Wifi, WifiOff } from 'lucide-react';


const STATUS_CONFIG = {
  active: {
    dot: 'var(--ckb-green)',
    label: '🟢 AI Active',
    sublabel: 'Agent ready to execute',
    color: 'var(--ckb-green)',
    bg: 'rgba(0,212,170,0.04)',
    border: 'rgba(0,212,170,0.15)',
    icon: Bot,
    ping: true,
  },
  monitoring: {
    dot: 'var(--ckb-orange)',
    label: '🟡 Monitoring',
    sublabel: 'Watching your portfolio',
    color: 'var(--ckb-orange)',
    bg: 'rgba(245,158,11,0.04)',
    border: 'rgba(245,158,11,0.15)',
    icon: Eye,
    ping: false,
  },
  executing: {
    dot: 'var(--ckb-blue)',
    label: '🔵 Executing',
    sublabel: 'AI is performing an action',
    color: 'var(--ckb-blue)',
    bg: 'rgba(59,91,219,0.06)',
    border: 'rgba(59,91,219,0.2)',
    icon: Zap,
    ping: true,
  },
};

export function GlobalStatusBar() {
  const aiStatus    = useAppStore((s) => s.aiStatus);
  const isConnected = useAppStore((s) => s.isConnected);
  const isAutopilot = useAppStore((s) => s.isAutopilot);
  const riskProfile = useAppStore((s) => s.riskProfile);
  const metrics     = useAppStore((s) => s.metrics);
  const risk        = RISK_CONFIG[riskProfile];

  const cfg = STATUS_CONFIG[aiStatus];
  const Icon = cfg.icon;

  return (
    <div
      className="flex items-center justify-between px-5 py-2 border-b flex-shrink-0"
      style={{
        background: cfg.bg,
        borderColor: cfg.border,
        transition: 'background 0.5s ease, border-color 0.5s ease',
      }}
    >
      {/* Left: AI status */}
      <div className="flex items-center gap-3">
        {/* Status dot */}
        <div className="relative flex items-center justify-center w-2 h-2">
          {cfg.ping && (
            <div
              className="absolute w-full h-full rounded-full animate-ping opacity-60"
              style={{ background: cfg.dot }}
            />
          )}
          <div className="relative w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
        </div>

        <Icon size={13} style={{ color: cfg.color }} />

        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
          {cfg.label}
        </span>

        <span className="text-[10px] opacity-60" style={{ color: cfg.color }}>
          — {cfg.sublabel}
        </span>

        {/* Autopilot tag */}
        {isAutopilot && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
            style={{ background: 'rgba(0,212,170,0.12)', color: 'var(--ckb-green)', border: '1px solid rgba(0,212,170,0.3)' }}
          >
            <Bot size={9} /> Autopilot ON
          </div>
        )}
      </div>

      {/* Right: Risk + Metrics + Connection */}
      <div className="flex items-center gap-4">
        {/* Performance quick stats */}
        {metrics.totalTxExecuted > 0 && (
          <div className="flex items-center gap-3 text-[10px]" style={{ color: 'var(--text-muted)' }}>
            <span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{metrics.totalTxExecuted}</span> TX
            </span>
            <span>
              <span className="font-bold" style={{ color: 'var(--ckb-green)' }}>{metrics.automationSuccessRate}%</span> success
            </span>
            {metrics.yieldGrowthPercent > 0 && (
              <span>
                <span className="font-bold" style={{ color: 'var(--ckb-green)' }}>+{metrics.yieldGrowthPercent.toFixed(1)}%</span> yield
              </span>
            )}
          </div>
        )}

        {/* Risk badge */}
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
          style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.border}` }}
        >
          {risk.emoji} {risk.label}
        </div>

        {/* Connection */}
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: isConnected ? 'var(--ckb-green)' : 'var(--danger)' }}>
          {isConnected ? <Wifi size={11} /> : <WifiOff size={11} />}
          <span className="font-bold uppercase tracking-widest">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>
    </div>
  );
}
