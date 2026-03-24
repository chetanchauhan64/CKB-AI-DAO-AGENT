'use client';

import { Database, TrendingUp, Clock, RefreshCw, ChevronRight, Bot } from 'lucide-react';
import { useDAOCells, useEpochInfo } from '@/hooks/useWallet';
import { useAppStore } from '@/store';
import type { DaoCell } from '@/lib/apiClient';
import { WithdrawPanel } from './WithdrawPanel';
import { PortfolioPanel } from './PortfolioPanel';

function EpochProgress({ epochsInCycle }: { epochsInCycle: number }) {
  const progress = Math.min(100, (epochsInCycle / 180) * 100);

  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider mb-2">
        <span>Cycle Progress</span>
        <span>{epochsInCycle} / 180</span>
      </div>
      <div className="h-2.5 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)]">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--ckb-green-dim), var(--ckb-green))',
          }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ─── Status config with lifecycle glow classes ────────────────────────────────
const STATUS_CONFIG: Record<DaoCell['status'], {
  bg: string; text: string; border: string;
  label: string; narrative: string; glowClass: string;
}> = {
  deposited: {
    bg: 'var(--ckb-green-dim)', text: 'var(--ckb-green)', border: 'rgba(0,212,170,0.2)',
    label: '💚 Earning',
    narrative: 'Your CKB is actively earning yield in Nervos DAO.',
    glowClass: 'lifecycle-earning',
  },
  withdrawing: {
    bg: 'var(--ckb-orange-dim)', text: 'var(--ckb-orange)', border: 'rgba(245,158,11,0.2)',
    label: '⏳ Unlocking',
    narrative: 'Waiting for the lock period to expire before claiming.',
    glowClass: 'lifecycle-unlocking',
  },
  unlockable: {
    bg: 'var(--ckb-blue-dim)', text: 'var(--ckb-blue)', border: 'rgba(59,91,219,0.2)',
    label: '✅ Ready to Claim',
    narrative: 'Lock period expired! Funds are ready to be claimed.',
    glowClass: 'lifecycle-ready',
  },
  claimed: {
    bg: 'var(--bg-base)', text: 'var(--text-muted)', border: 'var(--border)',
    label: '🏁 Completed',
    narrative: 'Rewards claimed and secured in your wallet.',
    glowClass: '',
  },
};

function DAOCellCard({ cell }: { cell: DaoCell }) {
  const cfg = STATUS_CONFIG[cell.status] || STATUS_CONFIG.deposited;
  const isDeposited = cell.status === 'deposited';

  return (
    <div
      className={`card-hover p-4 rounded-2xl transition-all duration-300 ${cfg.glowClass}`}
      style={{ background: 'var(--bg-card)', border: `1px solid ${cfg.border || 'var(--border)'}` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider"
              style={{
                background: cfg.bg,
                color: cfg.text,
                border: `1px solid ${cfg.border}`,
              }}
            >
              {cfg.label}
            </span>
          </div>
          
          <div
            className="text-xl font-bold mt-1"
            style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
          >
            {Number(cell.capacityCKB).toFixed(2)} <span className="text-[12px] font-normal text-[var(--text-secondary)]">CKB</span>
          </div>

          {/* Narrative description */}
          <p className="text-[11px] mt-1 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {cfg.narrative}
          </p>

          <div className="h-6 mt-2 flex items-center">
            {cell.estimatedRewardCKB && isDeposited ? (
              <div className="text-[12px] font-medium flex items-center gap-1.5" style={{ color: 'var(--ckb-green)' }}>
                <TrendingUp size={12} className="opacity-80" />
                +{Number(cell.estimatedRewardCKB).toFixed(4)} CKB <span className="opacity-50 font-normal">est. reward</span>
              </div>
            ) : (
              <span className="text-[12px] text-[var(--text-muted)] opacity-60">
                {cell.status === 'withdrawing' ? '⏱️ Awaiting maturity window…' : 
                 cell.status === 'unlockable' ? '🎯 Claim now to collect rewards' : ''}
              </span>
            )}
          </div>

          {/* Epoch mini-progress bar */}
          {isDeposited && (
            <div className="mt-3">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                <span>Maturity</span>
                <span className="text-[var(--ckb-green)]">Earning ✦</span>
              </div>
              <div className="h-1.5 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border)]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(90, 30 + (Number(cell.estimatedRewardCKB) || 0) * 200)}%`,
                    background: 'linear-gradient(90deg, var(--ckb-green-dim), var(--ckb-green))',
                    transition: 'width 1s ease-out',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <a
          href={`https://pudge.explorer.nervos.org/transaction/${cell.outPoint.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          title="View in Explorer"
          className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--ckb-green)] hover:border-[var(--ckb-green)] transition-all ml-3 flex-shrink-0"
        >
          <ChevronRight size={14} />
        </a>
      </div>
    </div>
  );
}

export function DAOTracker() {
  const { cells, count, isLoading, refresh } = useDAOCells();
  const { epochInfo } = useEpochInfo();
  const isAutopilot = useAppStore((s) => s.isAutopilot);
  const [extraEarned] = [0];

  const epochsInCycle  = (epochInfo as { epochsInCurrentCycle?: number })?.epochsInCurrentCycle ?? 0;
  const currentEpoch   = (epochInfo as { currentEpoch?: number })?.currentEpoch ?? 0;
  const epochsToNext   = (epochInfo as { epochsToNextCycleBoundary?: number })?.epochsToNextCycleBoundary ?? 180;

  return (
    <div className="h-full flex flex-col gap-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 px-2 pt-1">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Nervos DAO Vault
          </h2>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5 font-medium">
            AI-managed yield strategy on Nervos CKB
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="btn-glow-green w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] shadow-sm"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Autopilot AI banner */}
      {isAutopilot && (
        <div
          className="narrator-enter flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl mx-2"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,170,0.06) 0%, rgba(59,91,219,0.05) 100%)',
            border: '1px solid rgba(0,212,170,0.3)',
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 autopilot-ring"
            style={{ background: 'rgba(0,212,170,0.15)' }}
          >
            <Bot size={15} style={{ color: 'var(--ckb-green)' }} />
          </div>
          <div>
            <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--ckb-green)' }}>
              🤖 Autopilot Active
            </div>
            <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
              AI will auto-withdraw mature positions, claim rewards, and reinvest for you.
            </p>
          </div>
        </div>
      )}

      {/* Portfolio Intelligence */}
      {!isLoading && cells.length > 0 && (
        <div className="flex-shrink-0 mb-1">
          <PortfolioPanel cells={cells} extraEarned={extraEarned} />
        </div>
      )}

      {/* Epoch stats Cards */}
      <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-3 flex-shrink-0">
        <div className="card-hover card px-5 py-4 rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--bg-card)] flex flex-col justify-center">
          <EpochProgress epochsInCycle={epochsInCycle} />
        </div>
        
        <div className="card-hover card p-3 rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--bg-card)] flex flex-col justify-center items-center text-center">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-1">Current Epoch</div>
          <div className="text-xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'JetBrains Mono' }}>
            #{currentEpoch}
          </div>
        </div>
        
        <div className="card-hover card p-3 rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--bg-card)] flex flex-col justify-center items-center text-center">
          <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-1">Until Unlock</div>
          <div className="text-xl font-bold flex items-center gap-1.5 text-[var(--ckb-orange)]" style={{ fontFamily: 'JetBrains Mono' }}>
            <Clock size={16} className="opacity-70" /> {epochsToNext}
          </div>
        </div>
      </div>

      {/* Cells list */}
      <div className="flex-1 overflow-y-auto pr-3 pb-4 space-y-4">
        <div className="text-[11px] uppercase font-bold tracking-wider text-[var(--text-muted)] mt-1 px-1 flex items-center justify-between">
          <span>Active Positions</span>
          <span className="bg-[var(--bg-card)] border border-[var(--border)] px-2 py-0.5 rounded-full">{count}</span>
        </div>

        {isLoading ? (
          <div className="space-y-4 pt-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-[120px] rounded-2xl" />
            ))}
          </div>
        ) : count === 0 ? (
          <div
            className="h-48 flex flex-col items-center justify-center rounded-3xl gap-4 shadow-sm bg-[var(--bg-card)] mt-2"
            style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
          >
            <div className="w-14 h-14 rounded-full bg-[var(--bg-base)] flex items-center justify-center mb-1">
              <Database size={24} className="opacity-40" />
            </div>
            <div className="text-base font-semibold text-[var(--text-primary)]">No Active Vault Positions</div>
            <div className="text-[13px] text-[var(--text-muted)] bg-[var(--bg-base)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
              Try: &quot;Deposit 200 CKB into DAO&quot;
            </div>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {cells.map((cell) => (
              <DAOCellCard key={`${cell.outPoint.txHash}-${cell.outPoint.index}`} cell={cell} />
            ))}
          </div>
        )}

        {/* Withdraw Section */}
        {!isLoading && cells.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[var(--border)]">
            <WithdrawPanel cells={cells} />
          </div>
        )}
      </div>
    </div>
  );
}
