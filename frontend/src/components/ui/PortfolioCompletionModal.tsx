'use client';

import { useEffect, useState } from 'react';
import { Bot, TrendingUp, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store';

interface PortfolioCompletionModalProps {
  visible: boolean;
  onDone: () => void;
}

export function PortfolioCompletionModal({ visible, onDone }: PortfolioCompletionModalProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'hidden'>('hidden');
  const isAutopilot = useAppStore((s) => s.isAutopilot);

  useEffect(() => {
    if (!visible) { setPhase('hidden'); return; }
    setPhase('in');
    const t1 = setTimeout(() => setPhase('hold'), 500);
    const t2 = setTimeout(() => setPhase('out'), 5000);
    const t3 = setTimeout(() => { setPhase('hidden'); onDone(); }, 5700);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [visible, onDone]);

  if (phase === 'hidden') return null;

  const opacity = phase === 'in' ? 0 : phase === 'out' ? 0 : 1;
  const scale   = phase === 'hold' ? 1 : 0.92;

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center"
      style={{
        opacity,
        transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1)',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Radial glow background */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
          animation: 'autopilotPulse 2.5s ease-in-out infinite',
        }}
      />

      <div
        className="relative flex flex-col items-center gap-6 text-center px-14 py-12 rounded-3xl max-w-[500px] z-10"
        style={{
          background: 'linear-gradient(145deg, rgba(0,212,170,0.06), rgba(10,11,15,0.9))',
          border: '1px solid rgba(0,212,170,0.4)',
          boxShadow: '0 0 80px rgba(0,212,170,0.2), 0 0 200px rgba(0,212,170,0.06), inset 0 1px 0 rgba(255,255,255,0.05)',
          transform: `scale(${scale})`,
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Icon cluster */}
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center autopilot-ring"
            style={{
              background: 'radial-gradient(circle, rgba(0,212,170,0.2), rgba(0,212,170,0.04))',
              border: '2px solid rgba(0,212,170,0.5)',
            }}
          >
            <Sparkles size={40} style={{ color: 'var(--ckb-green)', animation: 'pulse 2s ease-in-out infinite' }} />
          </div>
          <span className="absolute -top-1 -right-2 text-[24px]" style={{ animation: 'bounce 1s ease-in-out 0.2s infinite alternate' }}>
            🤖
          </span>
          <span className="absolute -bottom-1 -left-2 text-[20px]" style={{ animation: 'bounce 1.1s ease-in-out 0.5s infinite alternate' }}>
            ✨
          </span>
        </div>

        {/* Message */}
        <div>
          <div
            className="text-[28px] font-bold mb-3 tracking-tight"
            style={{
              color: 'var(--ckb-green)',
              fontFamily: 'JetBrains Mono, monospace',
              textShadow: '0 0 40px rgba(0,212,170,0.5)',
            }}
          >
            ✨ Portfolio Fully Automated
          </div>
          <p className="text-[15px] font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            Your portfolio is now fully automated
          </p>
          <p className="text-[13px] leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
            AI is continuously optimizing your yield strategy — compounding, reinvesting, and securing rewards on your behalf.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 w-full">
          {[
            { icon: Bot, label: 'AI Mode', value: isAutopilot ? 'Autopilot' : 'Assisted', color: 'var(--ckb-green)' },
            { icon: TrendingUp, label: 'Status', value: 'Compounding', color: 'var(--ckb-orange)' },
            { icon: Sparkles, label: 'Yield', value: 'Optimized', color: 'var(--ckb-purple)' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <Icon size={14} style={{ color }} />
              <div className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</div>
              <div className="text-[11px] font-bold" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Emoji row */}
        <div className="flex gap-3 text-2xl">
          {['🚀', '💰', '📈', '✦', '🌿', '⚡'].map((e, i) => (
            <span key={i} style={{ animation: `bounce 0.9s ease-in-out ${i * 0.1}s infinite alternate`, display: 'inline-block' }}>
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
