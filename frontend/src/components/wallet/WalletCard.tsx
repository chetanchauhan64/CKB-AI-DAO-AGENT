'use client';

import { Copy, RefreshCw, Wallet, Lock, Unlock } from 'lucide-react';
import { useWallet, useDAOCells } from '@/hooks/useWallet';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/store';

export function WalletCard() {
  const { address, ckbBalance, isLoading: walletLoading, refresh: refreshWallet } = useWallet();
  const { cells, isLoading: daoLoading, refresh: refreshDao } = useDAOCells();
  const [copied, setCopied] = useState(false);
  const isDemoMode = useAppStore((state) => state.isDemoMode);

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleRefresh = () => {
    refreshWallet();
    refreshDao();
  };

  const shortAddress = address
    ? `${address.slice(0, 10)}...${address.slice(-8)}`
    : '—';

  // Calculate Locked and Available balances
  const lockedCkb = useMemo(() => {
    return cells.reduce((sum, cell) => sum + Number(cell.capacityCKB), 0);
  }, [cells]);

  const totalCkb = Number(ckbBalance) || 0;
  // Available is total minus locked (ensuring we don't go below 0 due to API syncing lag)
  const availableCkb = Math.max(0, totalCkb - lockedCkb);

  const isLoading = walletLoading || daoLoading;

  return (
    <div
      className="gradient-border card-hover flex flex-col justify-between overflow-hidden shadow-sm"
      style={{ background: 'var(--bg-card)', borderRadius: '16px' }}
    >
      {/* Top Header: Address & Network */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--ckb-green-dim)] flex items-center justify-center">
            <Wallet size={16} className="text-[var(--ckb-green)]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
              Wallet Address
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm transition-colors hover:text-[var(--ckb-green)]"
              style={{
                color: copied ? 'var(--ckb-green)' : 'var(--text-primary)',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {shortAddress}
              <Copy size={12} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode && (
            <div
              className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm"
              style={{
                background: 'rgba(168,85,247,0.1)',
                color: 'var(--ckb-purple)',
                border: '1px solid rgba(168,85,247,0.2)'
              }}
            >
              Demo Active
            </div>
          )}
          <div
            className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm"
            style={{
              background: 'var(--ckb-green-dim)',
              color: 'var(--ckb-green)',
              border: '1px solid rgba(0,212,170,0.2)',
            }}
          >
            Testnet
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="btn-icon p-1.5 rounded-lg disabled:opacity-50"
            style={{ color: 'var(--text-muted)' }}
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Balances Section */}
      <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
        
        {/* Total Balance */}
        <div className="p-5 flex flex-col items-start justify-center">
          <div className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1 mb-1">
            Total Balance
          </div>
          {isLoading ? (
            <div className="shimmer h-8 w-24 rounded mt-1" />
          ) : (
            <div
              className="text-2xl font-bold number-glow truncate w-full"
              style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {totalCkb.toFixed(2)} <span className="text-sm font-normal text-[var(--text-secondary)]">CKB</span>
            </div>
          )}
        </div>

        {/* Available Balance */}
        <div className="p-5 flex flex-col items-start justify-center">
          <div className="text-[11px] font-medium text-[var(--text-muted)] flex items-center gap-1.5 mb-1">
            <Unlock size={12} /> Available
          </div>
          {isLoading ? (
            <div className="shimmer h-6 w-20 rounded mt-1" />
          ) : (
            <div
              className="text-xl font-bold truncate w-full"
              style={{ color: 'var(--ckb-green)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {availableCkb.toFixed(2)} <span className="text-xs font-normal opacity-70">CKB</span>
            </div>
          )}
        </div>

        {/* DAO Locked Balance */}
        <div className="p-5 flex flex-col items-start justify-center bg-[var(--ckb-orange)]/5">
          <div className="text-[11px] font-medium text-[var(--ckb-orange)] flex items-center gap-1.5 mb-1 opacity-90">
            <Lock size={12} /> DAO Locked
          </div>
          {isLoading ? (
            <div className="shimmer h-6 w-20 rounded mt-1" />
          ) : (
            <div
              className="text-xl font-bold truncate w-full"
              style={{ color: 'var(--ckb-orange)', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {lockedCkb.toFixed(2)} <span className="text-xs font-normal opacity-70">CKB</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
