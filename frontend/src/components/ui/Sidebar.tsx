'use client';

import { useEffect, useState } from 'react';
import { Zap, FastForward, Bot } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { useAppStore } from '@/store';

interface SidebarProps {
  isConnected: boolean;
}

export function Sidebar({ isConnected }: SidebarProps) {
  const simMode     = useAppStore((s) => s.isDemoMode);
  const setSimMode  = useAppStore((s) => s.setDemoMode);
  const isAutopilot = useAppStore((s) => s.isAutopilot);
  const setAutopilot = useAppStore((s) => s.setAutopilot);

  const [mounted, setMounted]       = useState(false);
  const [expanded, setExpanded]     = useState(false);

  useEffect(() => {
    setMounted(true);
    api.getSimulationMode()
      .then((res: { enabled?: boolean }) => setSimMode(!!res.enabled))
      .catch(() => {});
  }, [setSimMode]);

  const toggleSimulation = async () => {
    const next = !simMode;
    try {
      await api.setSimulationMode(next);
      setSimMode(next);
    } catch (e) {
      console.error(e);
    }
  };

  if (!mounted) {
    return (
      <aside
        className="flex flex-col flex-shrink-0 border-r"
        style={{ width: 60, background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      />
    );
  }

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      className={`flex flex-col flex-shrink-0 border-r z-20 relative transition-all duration-250 ${expanded ? 'sidebar-expanded' : ''}`}
      style={{
        width: expanded ? 200 : 60,
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Brand icon */}
      <div className="flex items-center gap-3 px-3 py-4 border-b flex-shrink-0 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div
          className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center shadow-sm ${isAutopilot ? 'autopilot-ring' : ''}`}
          style={{ background: isAutopilot ? 'rgba(0,212,170,0.2)' : 'var(--ckb-green-dim)', border: '1px solid var(--ckb-green)' }}
        >
          {isAutopilot ? <Bot size={18} style={{ color: 'var(--ckb-green)' }} /> : <Zap size={18} style={{ color: 'var(--ckb-green)' }} />}
        </div>
        <div className="sidebar-label flex flex-col min-w-0">
          <span className="font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>DAO Agent</span>
          <span className="text-[9px] font-semibold uppercase tracking-widest" style={{ color: 'var(--ckb-green)' }}>
            {isAutopilot ? 'AI Pilot On' : 'Hackathon'}
          </span>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* ── Bottom fixed section ── */}
      <div className="flex flex-col gap-2 p-2 border-t" style={{ borderColor: 'var(--border)' }}>

        {/* Auto-Pilot Toggle */}
        <button
          onClick={() => setAutopilot(!isAutopilot)}
          title="Toggle Autopilot"
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          style={{
            background:  isAutopilot ? 'rgba(0,212,170,0.1)' : 'var(--bg-base)',
            borderColor: isAutopilot ? 'rgba(0,212,170,0.5)' : 'var(--border)',
            color:       isAutopilot ? 'var(--ckb-green)'     : 'var(--text-muted)',
            boxShadow:   isAutopilot ? '0 0 14px rgba(0,212,170,0.15)' : 'none',
          }}
        >
          <Bot size={16} className={`flex-shrink-0 ${isAutopilot ? 'animate-pulse' : ''}`} />
          <span className="sidebar-label text-[11px] font-bold uppercase tracking-wider">Autopilot</span>
          <div className={`sidebar-label ml-auto toggle-pill w-7 h-3.5 rounded-full relative flex-shrink-0 ${isAutopilot ? 'bg-[var(--ckb-green)]' : 'bg-[#2a2d3a]'}`}>
            <div className={`toggle-thumb absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white shadow-sm ${isAutopilot ? 'left-[15px]' : 'left-0.5'}`} />
          </div>
        </button>

        {/* Demo Mode Toggle */}
        <button
          onClick={toggleSimulation}
          title="Toggle Demo Mode"
          className="flex items-center gap-2.5 px-2 py-2 rounded-xl border transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          style={{
            background:  simMode ? 'rgba(168,85,247,0.1)' : 'var(--bg-base)',
            borderColor: simMode ? 'var(--ckb-purple)'    : 'var(--border)',
            color:       simMode ? 'var(--ckb-purple)'    : 'var(--text-muted)',
          }}
        >
          <FastForward size={16} className={`flex-shrink-0 ${simMode ? 'animate-pulse' : ''}`} />
          <span className="sidebar-label text-[11px] font-bold uppercase tracking-wider">Demo Mode</span>
          <div className={`sidebar-label ml-auto toggle-pill w-7 h-3.5 rounded-full relative flex-shrink-0 ${simMode ? 'bg-[#A855F7]' : 'bg-[#2a2d3a]'}`}>
            <div className={`toggle-thumb absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white ${simMode ? 'left-[15px]' : 'left-0.5'}`} />
          </div>
        </button>

        {/* Connection status */}
        <div className="flex items-center gap-2.5 px-2 py-1.5 overflow-hidden">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 pulse-dot"
            style={{ background: isConnected ? 'var(--ckb-green)' : 'var(--danger)' }}
          />
          <span className="sidebar-label text-[10px] font-bold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}
