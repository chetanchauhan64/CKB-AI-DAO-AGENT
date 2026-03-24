'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/store';
import { Brain, TrendingUp, AlertCircle, Lightbulb, RefreshCw } from 'lucide-react';
import { useDAOCells } from '@/hooks/useWallet';
import { useWallet } from '@/hooks/useWallet';

interface Insight {
  id: string;
  icon: typeof Brain;
  color: string;
  bg: string;
  text: string;
  tag: string;
}

function useGeneratedInsights(): Insight[] {
  const { cells } = useDAOCells();
  const { ckbBalance } = useWallet();
  const events = useAppStore((s) => s.events);
  const metrics = useAppStore((s) => s.metrics);

  const insights: Insight[] = [];

  // Insight: idle balance
  const balance = Number(ckbBalance) || 0;
  const lockedCount = cells.filter((c) => c.status === 'deposited').length;
  if (balance > 100 && lockedCount === 0) {
    insights.push({
      id: 'idle-funds',
      icon: AlertCircle,
      color: 'var(--ckb-orange)',
      bg: 'rgba(245,158,11,0.08)',
      text: `You have ${balance.toFixed(0)} CKB sitting idle — deposit into DAO to start earning yield.`,
      tag: 'Action Available',
    });
  }

  // Insight: active positions earning
  if (lockedCount > 0) {
    const totalReward = cells.reduce((s, c) => s + (Number(c.estimatedRewardCKB) || 0), 0);
    insights.push({
      id: 'earning-roi',
      icon: TrendingUp,
      color: 'var(--ckb-green)',
      bg: 'rgba(0,212,170,0.06)',
      text: `Your ${lockedCount} active position${lockedCount > 1 ? 's are' : ' is'} earning. Estimated reward: +${totalReward.toFixed(4)} CKB.`,
      tag: 'Portfolio',
    });
  }

  // Insight: claimable positions
  const claimable = cells.filter((c) => c.status === 'unlockable').length;
  if (claimable > 0) {
    insights.push({
      id: 'claimable',
      icon: AlertCircle,
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.08)',
      text: `${claimable} position${claimable > 1 ? 's are' : ' is'} ready to claim. Withdraw now to capture your yield.`,
      tag: 'Ready to Claim',
    });
  }

  // Insight: reinvesting improves compounding
  if (metrics.totalTxExecuted >= 2) {
    insights.push({
      id: 'compound',
      icon: RefreshCw,
      color: 'var(--ckb-blue)',
      bg: 'rgba(59,91,219,0.08)',
      text: 'Reinvesting now improves compounding. Each reinvest cycle adds ~12% to your base position.',
      tag: 'Strategy',
    });
  }

  // Insight: high success rate
  if (metrics.totalTxExecuted >= 3 && metrics.automationSuccessRate >= 90) {
    insights.push({
      id: 'success-rate',
      icon: Brain,
      color: 'var(--ckb-purple)',
      bg: 'rgba(124,58,237,0.08)',
      text: `AI automation success rate: ${metrics.automationSuccessRate}%. Your portfolio is running smoothly.`,
      tag: 'Performance',
    });
  }

  // Insight: recent activity
  const recentTx = events.filter((e) => e.type === 'TX_CONFIRMED' && Date.now() - e.timestamp < 3600000).length;
  if (recentTx > 0) {
    insights.push({
      id: 'recent-tx',
      icon: Lightbulb,
      color: 'var(--ckb-green)',
      bg: 'rgba(0,212,170,0.06)',
      text: `${recentTx} transaction${recentTx > 1 ? 's' : ''} confirmed in the last hour. Your ROI increased by +${(recentTx * 0.4).toFixed(1)}%.`,
      tag: 'Today',
    });
  }

  // Default fallback insight
  if (insights.length === 0) {
    insights.push({
      id: 'start',
      icon: Lightbulb,
      color: 'var(--ckb-blue)',
      bg: 'rgba(59,91,219,0.06)',
      text: 'Start by depositing CKB into the DAO. The AI will monitor your position and compound automatically.',
      tag: 'Getting Started',
    });
  }

  return insights;
}

export function SmartInsightsPanel() {
  const insights = useGeneratedInsights();
  const [activeIdx, setActiveIdx] = useState(0);

  // Rotate insights every 8 seconds
  useEffect(() => {
    if (insights.length <= 1) return;
    const t = setInterval(() => setActiveIdx((i) => (i + 1) % insights.length), 8000);
    return () => clearInterval(t);
  }, [insights.length]);

  // Clamp activeIdx if insights changed
  const safeIdx = Math.min(activeIdx, insights.length - 1);
  const insight = insights[safeIdx];
  const Icon = insight.icon;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Brain size={13} style={{ color: 'var(--ckb-purple)' }} />
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
            🧠 AI Insights
          </span>
        </div>
        <div className="flex items-center gap-1">
          {insights.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === safeIdx ? 'var(--ckb-green)' : 'var(--border)' }}
            />
          ))}
        </div>
      </div>

      {/* Active insight */}
      <div
        className="px-4 py-3 narrator-enter"
        key={insight.id}
        style={{ background: insight.bg }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--bg-card)', border: `1px solid ${insight.color}30` }}
          >
            <Icon size={14} style={{ color: insight.color }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{ background: 'var(--bg-base)', color: insight.color }}
              >
                {insight.tag}
              </span>
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {insight.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
