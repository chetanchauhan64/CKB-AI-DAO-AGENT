'use client';

import { useAppStore, RISK_CONFIG } from '@/store';
import type { RiskProfile } from '@/store';
import { Shield, TrendingUp, Zap } from 'lucide-react';

const RISK_ICONS: Record<RiskProfile, typeof Shield> = {
  conservative: Shield,
  balanced: TrendingUp,
  aggressive: Zap,
};

interface RiskProfileSelectorProps {
  compact?: boolean;
}

export function RiskProfileSelector({ compact = false }: RiskProfileSelectorProps) {
  const riskProfile    = useAppStore((s) => s.riskProfile);
  const setRiskProfile = useAppStore((s) => s.setRiskProfile);

  if (compact) {
    // Inline compact version — used in portfolio header
    const current = RISK_CONFIG[riskProfile];
    return (
      <div className="flex items-center gap-1">
        {(Object.keys(RISK_CONFIG) as RiskProfile[]).map((p) => {
          const cfg = RISK_CONFIG[p];
          const active = riskProfile === p;
          return (
            <button
              key={p}
              onClick={() => setRiskProfile(p)}
              title={cfg.label}
              className="w-6 h-6 rounded-full text-[13px] flex items-center justify-center transition-all hover:scale-110 active:scale-95"
              style={{
                opacity: active ? 1 : 0.35,
                transform: active ? 'scale(1.15)' : 'scale(1)',
                filter: active ? 'none' : 'grayscale(0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              {cfg.emoji}
            </button>
          );
        })}
        <span className="text-[9px] font-bold uppercase tracking-widest ml-1" style={{ color: current.color }}>
          {current.label}
        </span>
      </div>
    );
  }

  // Full card picker
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-muted)' }}>
        🎯 Risk Profile
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(RISK_CONFIG) as RiskProfile[]).map((p) => {
          const cfg = RISK_CONFIG[p];
          const active = riskProfile === p;
          const Icon = RISK_ICONS[p];
          return (
            <button
              key={p}
              onClick={() => setRiskProfile(p)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
              style={{
                background: active ? cfg.bg : 'var(--bg-base)',
                border: `1px solid ${active ? cfg.border : 'var(--border)'}`,
                boxShadow: active ? `0 0 16px ${cfg.bg}` : 'none',
              }}
            >
              <span className="text-xl">{cfg.emoji}</span>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: active ? cfg.color : 'var(--text-muted)' }}>
                  {cfg.label}
                </div>
              </div>
              {active && (
                <div
                  className="flex items-center justify-center w-5 h-5 rounded-full"
                  style={{ background: cfg.color }}
                >
                  <Icon size={10} color="#000" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {/* Description */}
      <p className="text-[11px] mt-3 leading-relaxed px-1" style={{ color: 'var(--text-muted)' }}>
        {RISK_CONFIG[riskProfile].description}
      </p>
      <p className="text-[10px] mt-0.5 px-1" style={{ color: RISK_CONFIG[riskProfile].color }}>
        {RISK_CONFIG[riskProfile].actionFrequency}
      </p>
    </div>
  );
}
