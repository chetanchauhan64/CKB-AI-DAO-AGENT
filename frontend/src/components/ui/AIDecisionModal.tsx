'use client';

import { useEffect, useState } from 'react';
import { Bot, CheckCircle, XCircle, AlertTriangle, Zap, Clock } from 'lucide-react';
import { useAppStore } from '@/store';

const URGENCY_CONFIG = {
  low:    { color: 'var(--ckb-green)',  bg: 'rgba(0,212,170,0.08)',   border: 'rgba(0,212,170,0.3)',   label: 'Suggestion',  icon: CheckCircle },
  medium: { color: 'var(--ckb-orange)', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',  label: 'Recommended', icon: Clock       },
  high:   { color: '#ef4444',           bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   label: 'Urgent',      icon: AlertTriangle },
};

export function AIDecisionModal() {
  const rec             = useAppStore((s) => s.pendingRecommendation);
  const clearRec        = useAppStore((s) => s.setPendingRecommendation);
  const isAutopilot     = useAppStore((s) => s.isAutopilot);
  const setAIStatus     = useAppStore((s) => s.setAIStatus);
  const incrementTx     = useAppStore((s) => s.incrementTx);
  const [visible, setVisible] = useState(false);
  const [autoTimer, setAutoTimer] = useState<number | null>(null);
  const [autoCount, setAutoCount] = useState(5);

  useEffect(() => {
    if (!rec) { setVisible(false); return; }
    
    // Small delay before showing for dramatic effect
    const t = setTimeout(() => setVisible(true), 100);
    
    // Autopilot: auto-execute after 5s countdown
    if (isAutopilot) {
      setAutoCount(5);
      const countdown = window.setInterval(() => {
        setAutoCount((c) => {
          if (c <= 1) {
            clearInterval(countdown);
            handleApprove();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      setAutoTimer(countdown as unknown as number);
    }

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rec]);

  const handleApprove = () => {
    if (autoTimer) window.clearInterval(autoTimer);
    setAIStatus('executing');
    incrementTx(true);
    setTimeout(() => setAIStatus('monitoring'), 3000);
    setVisible(false);
    setTimeout(() => clearRec(null), 400);
  };

  const handleSkip = () => {
    if (autoTimer) window.clearInterval(autoTimer);
    setVisible(false);
    setTimeout(() => clearRec(null), 400);
  };

  if (!rec) return null;

  const cfg = URGENCY_CONFIG[rec.urgency];
  const UrgencyIcon = cfg.icon;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end justify-center pb-8 pointer-events-none"
      style={{ paddingBottom: '2rem' }}
    >
      <div
        className="pointer-events-auto w-full max-w-lg mx-4"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(32px)',
          transition: 'all 0.45s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(10,11,15,0.97)',
            border: `1px solid ${cfg.border}`,
            boxShadow: `0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px ${cfg.border}, 0 0 80px ${cfg.bg}`,
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Urgency strip */}
          <div
            className="flex items-center gap-2 px-5 py-2"
            style={{ background: cfg.bg, borderBottom: `1px solid ${cfg.border}` }}
          >
            <UrgencyIcon size={12} style={{ color: cfg.color }} />
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: cfg.color }}>
              {cfg.label}
            </span>
            {isAutopilot && (
              <span className="ml-auto text-[10px] font-bold" style={{ color: cfg.color }}>
                Auto-executing in {autoCount}s…
              </span>
            )}
          </div>

          <div className="px-5 py-4">
            {/* AI header */}
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 autopilot-ring"
                style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
              >
                <Bot size={18} style={{ color: cfg.color }} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: cfg.color }}>
                  🤖 AI Recommendation
                </div>
                <h3 className="text-[15px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                  {rec.title}
                </h3>
              </div>
            </div>

            {/* Message */}
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'var(--text-secondary)' }}>
              &ldquo;{rec.message}&rdquo;
            </p>

            {/* AI Insight reasoning */}
            {rec.insight && (
              <div
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl mb-4"
                style={{ background: 'rgba(0,212,170,0.05)', border: '1px solid rgba(0,212,170,0.15)' }}
              >
                <Zap size={12} style={{ color: 'var(--ckb-green)', flexShrink: 0, marginTop: 2 }} />
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {rec.insight}
                </p>
              </div>
            )}

            {/* Autopilot bar */}
            {isAutopilot && (
              <div className="mb-4">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: cfg.color }}>
                  <span>Autopilot executing in {autoCount}s</span>
                  <span>100%</span>
                </div>
                <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-linear"
                    style={{
                      width: `${((5 - autoCount) / 5) * 100}%`,
                      background: cfg.color,
                      boxShadow: `0 0 8px ${cfg.color}`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleApprove}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: cfg.color,
                  color: '#000',
                  boxShadow: `0 4px 20px ${cfg.bg}`,
                }}
              >
                <CheckCircle size={15} /> {rec.action || 'Approve & Execute'}
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[13px] font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border)',
                }}
              >
                <XCircle size={15} /> Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
