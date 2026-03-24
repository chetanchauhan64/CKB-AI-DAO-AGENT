'use client';

import { useEffect, useState, useRef } from 'react';

interface CompoundCelebrationProps {
  visible: boolean;
  amount?: string;
  onDone: () => void;
}

// ─── Floating Particle ────────────────────────────────────────────────────────
function Particle({ emoji, delay, x, size }: { emoji: string; delay: number; x: number; size: number }) {
  return (
    <span
      style={{
        position: 'absolute',
        left: `${x}%`,
        bottom: '10%',
        fontSize: `${size}px`,
        animation: `particleFloat ${2 + Math.random()}s ease-out ${delay}s both`,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      {emoji}
    </span>
  );
}

const PARTICLES = [
  { emoji: '✨', x: 10,  size: 22, delay: 0 },
  { emoji: '💰', x: 20,  size: 18, delay: 0.15 },
  { emoji: '🚀', x: 35,  size: 20, delay: 0.3 },
  { emoji: '📈', x: 50,  size: 18, delay: 0.08 },
  { emoji: '✦',  x: 62,  size: 16, delay: 0.2 },
  { emoji: '🌿', x: 75,  size: 20, delay: 0.35 },
  { emoji: '✨', x: 85,  size: 14, delay: 0.1 },
  { emoji: '💎', x: 92,  size: 18, delay: 0.25 },
  { emoji: '🔁', x: 5,   size: 16, delay: 0.4 },
  { emoji: '⚡', x: 46,  size: 16, delay: 0.45 },
  { emoji: '💰', x: 57,  size: 14, delay: 0.05 },
  { emoji: '✨', x: 70,  size: 20, delay: 0.38 },
];

export function CompoundCelebration({ visible, amount, onDone }: CompoundCelebrationProps) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out' | 'hidden'>('hidden');
  const [showParticles, setShowParticles] = useState(false);
  const ringsRef = useRef<number>(0);

  useEffect(() => {
    if (!visible) { setPhase('hidden'); setShowParticles(false); return; }
    setPhase('in');
    ringsRef.current++;
    
    const t0 = setTimeout(() => setShowParticles(true), 200);
    const t1 = setTimeout(() => setPhase('hold'), 600);
    const t2 = setTimeout(() => setPhase('out'), 3800);
    const t3 = setTimeout(() => { setPhase('hidden'); setShowParticles(false); onDone(); }, 4500);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [visible, onDone]);

  if (phase === 'hidden') return null;

  const opacity = phase === 'in' ? 0 : phase === 'out' ? 0 : 1;
  const scale   = phase === 'hold' ? 1 : 0.9;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{
        opacity,
        transition: 'opacity 0.65s cubic-bezier(0.16,1,0.3,1)',
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(18px)',
      }}
    >
      {/* Floating particles */}
      {showParticles && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLES.map((p, i) => (
            <Particle key={i} {...p} />
          ))}
        </div>
      )}

      {/* Radial glow rings */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,170,0.08) 0%, transparent 70%)',
          animation: 'autopilotPulse 2s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(0,212,170,0.06) 0%, transparent 70%)',
          animation: 'autopilotPulse 2s ease-in-out 0.4s infinite',
        }}
      />

      {/* Card */}
      <div
        className="relative flex flex-col items-center gap-6 text-center px-12 py-12 rounded-3xl z-10"
        style={{
          background: 'linear-gradient(145deg, rgba(0,212,170,0.06) 0%, rgba(0,0,0,0.5) 100%)',
          border: '1px solid rgba(0,212,170,0.4)',
          boxShadow: '0 0 80px rgba(0,212,170,0.25), 0 0 160px rgba(0,212,170,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
          maxWidth: 460,
          transform: `scale(${scale})`,
          transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Icon cluster */}
        <div className="relative">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center autopilot-ring"
            style={{
              background: 'radial-gradient(circle, rgba(0,212,170,0.2), rgba(0,212,170,0.05))',
              border: '2px solid rgba(0,212,170,0.6)',
              boxShadow: '0 0 40px rgba(0,212,170,0.35)',
            }}
          >
            <span style={{ fontSize: 44, animation: 'coinSpin 2s ease-in-out 3' }}>🪙</span>
          </div>
          {/* Orbiting sparkle */}
          <span
            className="absolute -top-1 -right-1 text-[22px]"
            style={{ animation: 'bounce 1s ease-in-out 0.3s infinite alternate' }}
          >✨</span>
          <span
            className="absolute -bottom-1 -left-1 text-[18px]"
            style={{ animation: 'bounce 1.2s ease-in-out 0.7s infinite alternate' }}
          >⚡</span>
        </div>

        {/* Heading */}
        <div>
          <div
            className="text-3xl font-bold mb-2 tracking-tight"
            style={{
              color: 'var(--ckb-green)',
              fontFamily: 'JetBrains Mono, monospace',
              textShadow: '0 0 30px rgba(0,212,170,0.6)',
            }}
          >
            ✨ Compounding Active
          </div>

          {amount && (
            <div
              className="text-[17px] font-bold mb-2"
              style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {amount} CKB reinvested
            </div>
          )}

          <p className="text-[14px] leading-relaxed max-w-xs mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Your funds are now compounding automatically.
            <br />
            <span style={{ color: 'var(--ckb-green)' }}>The AI will monitor and reinvest on your behalf.</span>
          </p>
        </div>

        {/* AI Narrator insight */}
        <div
          className="narrator-enter flex items-start gap-3 px-4 py-3 rounded-2xl text-left w-full"
          style={{
            background: 'rgba(0,212,170,0.06)',
            border: '1px solid rgba(0,212,170,0.2)',
          }}
        >
          <span className="text-[22px] flex-shrink-0">🤖</span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--ckb-green)' }}>
              AI Insight
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Reinvesting compounds your returns. This strategy could grow your yield by ~12% over the next cycle.
            </p>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex gap-3 text-2xl">
          {['🚀', '💰', '📈', '✦', '🌿'].map((e, i) => (
            <span
              key={i}
              style={{
                animation: `bounce 0.9s ease-in-out ${i * 0.12}s infinite alternate`,
                display: 'inline-block',
              }}
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
