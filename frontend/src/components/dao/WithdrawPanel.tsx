'use client';

import { useState, useCallback } from 'react';
import { ArrowDownToLine, Clock, CheckCircle, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store';
import { toast } from '@/components/ui/Toast';
import type { DaoCell } from '@/lib/apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'phase1_pending' | 'phase1_done' | 'claiming' | 'claimed' | 'reinvesting' | 'reinvested';

interface SimulatedWithdrawal {
  cellId: string;
  amount: number;
  reward: number;
  phase: Phase;
  txHash?: string;
  startedAt: number;
}

function fakeTx() {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

// ─── Phase status pill ────────────────────────────────────────────────────────

function PhaseBadge({ phase }: { phase: Phase }) {
  const config: Record<Phase, { label: string; color: string; bg: string }> = {
    idle:          { label: 'Deposited',      color: 'var(--ckb-green)',  bg: 'var(--ckb-green-dim)' },
    phase1_pending:{ label: 'Processing…',    color: 'var(--ckb-orange)', bg: 'var(--ckb-orange-dim)' },
    phase1_done:   { label: 'Ready to Claim', color: 'var(--ckb-blue)',   bg: 'var(--ckb-blue-dim)' },
    claiming:      { label: 'Claiming…',      color: 'var(--ckb-orange)', bg: 'var(--ckb-orange-dim)' },
    claimed:       { label: 'Claimed ✓',      color: 'var(--ckb-green)',  bg: 'var(--ckb-green-dim)' },
    reinvesting:   { label: 'Reinvesting…',   color: 'var(--ckb-purple)', bg: 'rgba(168,85,247,0.12)' },
    reinvested:    { label: 'Reinvested ✓',   color: 'var(--ckb-green)',  bg: 'var(--ckb-green-dim)' },
  };
  const c = config[phase];
  return (
    <span
      className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}30` }}
    >
      {c.label}
    </span>
  );
}

// ─── Reinvest Prompt ──────────────────────────────────────────────────────────

function ReinvestPrompt({ amount, reward, onReinvest, onKeep }: {
  amount: number; reward: number;
  onReinvest: () => void; onKeep: () => void;
}) {
  return (
    <div
      className="mt-2 p-4 rounded-2xl flex flex-col gap-3"
      style={{ background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.25)', animation: 'fadeUp 0.4s ease-out both' }}
    >
      <div>
        <div className="text-[12px] font-bold mb-1" style={{ color: 'var(--ckb-purple)' }}>
          🔁 Reinvestment Suggested
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          You earned <strong style={{ color: 'var(--ckb-green)' }}>+{reward.toFixed(4)} CKB</strong> from this position.
          Total claimable: <strong>{(amount + reward).toFixed(2)} CKB</strong>.
        </p>
        <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
          Would you like to compound back into the DAO?
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onReinvest}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:scale-[1.02] btn-glow-green"
          style={{ background: 'var(--ckb-green-dim)', border: '1px solid rgba(0,212,170,0.35)', color: 'var(--ckb-green)' }}
        >
          <RefreshCw size={12} /> Reinvest
        </button>
        <button
          onClick={onKeep}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[12px] font-bold transition-all hover:opacity-70"
          style={{ background: 'var(--bg-base)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          Keep in Wallet
        </button>
      </div>
    </div>
  );
}

// ─── Single Withdraw Cell Row ─────────────────────────────────────────────────

function WithdrawCellRow({ cell, onWithdraw, onClaim, onReinvest, onKeep, withdrawal }: {
  cell: DaoCell;
  onWithdraw: (cell: DaoCell) => void;
  onClaim: (cell: DaoCell) => void;
  onReinvest: (w: SimulatedWithdrawal) => void;
  onKeep: (w: SimulatedWithdrawal) => void;
  withdrawal?: SimulatedWithdrawal;
}) {
  const phase = withdrawal?.phase ?? 'idle';
  const amount = Number(cell.capacityCKB).toFixed(2);
  const isBlue = phase === 'phase1_done';
  const isDone = phase === 'claimed' || phase === 'reinvested';

  return (
    <div>
      <div
        className="flex items-center justify-between p-4 rounded-2xl border transition-all duration-300"
        style={{
          background: isBlue ? 'rgba(0,180,255,0.05)' : 'var(--bg-card)',
          border: isBlue
            ? '1px solid rgba(0,180,255,0.3)'
            : isDone ? '1px solid rgba(0,212,170,0.2)' : '1px solid var(--border)',
          boxShadow: isBlue ? '0 0 16px rgba(0,180,255,0.08)' : 'none',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: isDone ? 'var(--ckb-green-dim)' : 'rgba(255,153,0,0.1)', border: '1px solid rgba(255,153,0,0.2)' }}
          >
            {isDone
              ? <CheckCircle size={16} style={{ color: 'var(--ckb-green)' }} />
              : <ArrowDownToLine size={16} style={{ color: 'var(--ckb-orange)' }} />
            }
          </div>
          <div>
            <div className="font-bold text-[14px]" style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
              {amount} CKB
            </div>
            <PhaseBadge phase={phase} />
          </div>
        </div>

        <div>
          {phase === 'idle' && (
            <button
              onClick={() => onWithdraw(cell)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:scale-[1.03]"
              style={{ background: 'rgba(255,153,0,0.12)', border: '1px solid rgba(255,153,0,0.3)', color: 'var(--ckb-orange)' }}
            >
              <ArrowDownToLine size={13} /> Withdraw
            </button>
          )}
          {(phase === 'phase1_pending' || phase === 'claiming' || phase === 'reinvesting') && (
            <div className="flex items-center gap-2 text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--ckb-orange)' }} />
              {phase === 'reinvesting' ? 'Reinvesting…' : phase === 'claiming' ? 'Claiming…' : 'Processing…'}
            </div>
          )}
          {phase === 'phase1_done' && (
            <button
              onClick={() => onClaim(cell)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold transition-all hover:scale-[1.03] btn-glow-green"
              style={{ background: 'var(--ckb-blue-dim)', border: '1px solid rgba(0,180,255,0.35)', color: 'var(--ckb-blue)' }}
            >
              <ShieldCheck size={13} /> Claim Funds
            </button>
          )}
          {phase === 'reinvested' && (
            <span className="text-[11px] font-medium" style={{ color: 'var(--ckb-green)' }}>🔄 Compounding</span>
          )}
          {phase === 'claimed' && <span className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>See below ↓</span>}
        </div>
      </div>

      {phase === 'claimed' && withdrawal && (
        <ReinvestPrompt
          amount={withdrawal.amount}
          reward={withdrawal.reward}
          onReinvest={() => onReinvest(withdrawal)}
          onKeep={() => onKeep(withdrawal)}
        />
      )}
    </div>
  );
}

// ─── Main WithdrawPanel ───────────────────────────────────────────────────────

export function WithdrawPanel({ cells }: { cells: DaoCell[] }) {
  const addEvent = useAppStore((s) => s.addEvent);
  const [withdrawals, setWithdrawals] = useState<Record<string, SimulatedWithdrawal>>({});

  const cellId = (c: DaoCell) => `${c.outPoint.txHash}-${c.outPoint.index}`;

  const updatePhase = useCallback((id: string, phase: Phase, extra?: Partial<SimulatedWithdrawal>) => {
    setWithdrawals((prev) => ({ ...prev, [id]: { ...prev[id], phase, ...extra } }));
  }, []);

  const handleWithdraw = useCallback((cell: DaoCell) => {
    const id = cellId(cell);
    const amount = Number(cell.capacityCKB).toFixed(2);
    const reward = Number(cell.estimatedRewardCKB) || parseFloat((Math.random() * 5 + 0.5).toFixed(4));
    const tx1 = fakeTx();

    setWithdrawals((prev) => ({
      ...prev,
      [id]: { cellId: id, amount: Number(amount), reward, phase: 'phase1_pending', startedAt: Date.now(), txHash: tx1 },
    }));

    toast.success('Withdrawal started', `Unlocking ${amount} CKB from Nervos DAO`);

    addEvent({ type: 'HARVEST_INITIATED', payload: { message: `Withdrawal initiated: ${amount} CKB unlocking (Phase 1)` }, timestamp: Date.now() });
    addEvent({
      type: 'AGENT_SYSTEM_MESSAGE',
      payload: { message: `🤖 **AI Insight:** Your funds were nearing maturity, so I initiated a withdrawal to secure yield.\n\n**Withdrawal Initiated**\nAmount: **${amount} CKB**\nTransaction Hash: ${tx1}\n\nYou can claim your funds once the unlock period completes.` },
      timestamp: Date.now(),
    });

    setTimeout(() => {
      updatePhase(id, 'phase1_done');
      addEvent({ type: 'HARVEST_PHASE2_READY', payload: { message: `${amount} CKB ready to claim — unlock complete` }, timestamp: Date.now() });
      toast.success('Ready to claim!', `${amount} CKB is now claimable`);
    }, 5000);
  }, [addEvent, updatePhase]);

  const handleClaim = useCallback((cell: DaoCell) => {
    const id = cellId(cell);
    const amount = Number(cell.capacityCKB).toFixed(2);
    const reward = withdrawals[id]?.reward ?? parseFloat((Math.random() * 5 + 0.5).toFixed(4));
    const tx2 = fakeTx();

    updatePhase(id, 'claiming', { txHash: tx2 });
    addEvent({ type: 'AGENT_TOOL_CALL', payload: { toolName: 'withdraw_phase2', message: `Claiming ${amount} CKB + ${reward.toFixed(4)} CKB yield` }, timestamp: Date.now() });

    setTimeout(() => {
      updatePhase(id, 'claimed', { reward });
      addEvent({ type: 'TX_BROADCAST', payload: { txHash: tx2, message: `${amount} CKB + yield withdrawn from DAO` }, timestamp: Date.now() });
      toast.success('Funds claimed! 🎉', `${amount} CKB returned to your wallet`);
    }, 3000);
  }, [addEvent, updatePhase, withdrawals]);

  const handleReinvest = useCallback((w: SimulatedWithdrawal) => {
    const total = (w.amount + w.reward).toFixed(2);
    updatePhase(w.cellId, 'reinvesting');

    addEvent({ type: 'AGENT_TOOL_CALL', payload: { toolName: 'deposit', message: `Reinvesting ${total} CKB into Nervos DAO` }, timestamp: Date.now() });

    setTimeout(() => {
      const tx = fakeTx();
      updatePhase(w.cellId, 'reinvested');

      addEvent({ type: 'TX_BROADCAST', payload: { txHash: tx, message: `Reinvestment complete — ${total} CKB compounded` }, timestamp: Date.now() });
      addEvent({
        type: 'AGENT_SYSTEM_MESSAGE',
        payload: { message: `🤖 **AI Insight:** Excellent choice. Reinvesting will compound your returns by ~12% APY over time.\n\n🔁 **Reinvested Successfully**\nAmount compounded: **${total} CKB**\nTransaction Hash: ${tx}\n\nYour funds are earning again. I will continue to monitor them.` },
        timestamp: Date.now() + 50,
      });
      toast.success('Reinvested! 🔄', `${total} CKB is now compounding`);
    }, 4000);
  }, [addEvent, updatePhase]);

  const handleKeep = useCallback((w: SimulatedWithdrawal) => {
    updatePhase(w.cellId, 'reinvested');
    toast.success('Funds kept', `${(w.amount + w.reward).toFixed(2)} CKB stays in your wallet`);
    addEvent({ type: 'TOOL_SUCCESS', payload: { tool: 'keep_in_wallet', message: 'Funds kept in wallet — no reinvestment' }, timestamp: Date.now() });
  }, [addEvent, updatePhase]);

  const withdrawableCells = cells.filter((c) => c.status === 'deposited');
  if (withdrawableCells.length === 0) return null;

  const activeCount = Object.values(withdrawals).filter(
    (w) => w.phase !== 'idle' && w.phase !== 'claimed' && w.phase !== 'reinvested'
  ).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h3 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            Withdraw &amp; Reinvest
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Claim yield and optionally compound back into the DAO
          </p>
        </div>
        {activeCount > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold" style={{ color: 'var(--ckb-orange)' }}>
            <Clock size={12} className="animate-pulse" />
            {activeCount} unlocking
          </div>
        )}
      </div>

      <div className="space-y-2">
        {withdrawableCells.map((cell) => {
          const id = cellId(cell);
          return (
            <WithdrawCellRow
              key={id}
              cell={cell}
              onWithdraw={handleWithdraw}
              onClaim={handleClaim}
              onReinvest={handleReinvest}
              onKeep={handleKeep}
              withdrawal={withdrawals[id]}
            />
          );
        })}
      </div>
    </div>
  );
}
