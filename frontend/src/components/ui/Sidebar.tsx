'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, Database, Clock, Activity, Zap, FastForward, Bot } from 'lucide-react';
import { api } from '@/lib/apiClient';
import { useAppStore } from '@/store';

type View = 'chat' | 'dao' | 'scheduler' | 'activity';

const navItems: { id: View; label: string; icon: typeof MessageSquare }[] = [
  { id: 'chat',      label: 'AI Agent',     icon: MessageSquare },
  { id: 'dao',       label: 'DAO Tracker',  icon: Database      },
  { id: 'scheduler', label: 'Automation',   icon: Clock         },
  { id: 'activity',  label: 'Story Feed',   icon: Activity      },
];

interface SidebarProps {
  isConnected: boolean;
}

export function Sidebar({ isConnected }: SidebarProps) {
  const activeView    = useAppStore((s) => s.activeView);
  const setActiveView = useAppStore((s) => s.setActiveView);
  const simMode       = useAppStore((s) => s.isDemoMode);
  const setSimMode    = useAppStore((s) => s.setDemoMode);
  const isAutopilot   = useAppStore((s) => s.isAutopilot);
  const setAutopilot  = useAppStore((s) => s.setAutopilot);

  const [mounted, setMounted] = useState(false);
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
        className="flex flex-col w-56 flex-shrink-0 border-r"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      />
    );
  }

  return (
    <aside
      className="flex flex-col w-56 flex-shrink-0 border-r"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-offset-1 ring-offset-[var(--bg-card)] ${isAutopilot ? 'autopilot-ring' : ''}`}
            style={{
              background: isAutopilot ? 'rgba(0,212,170,0.2)' : 'var(--ckb-green-dim)',
              border: '1px solid var(--ckb-green)',
            }}
          >
            {isAutopilot ? <Bot size={16} style={{ color: 'var(--ckb-green)' }} /> : <Zap size={16} style={{ color: 'var(--ckb-green)' }} />}
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>DAO Agent</div>
            <div
              className="text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: isAutopilot ? 'var(--ckb-green)' : 'var(--ckb-green)', transition: 'color 0.3s' }}
            >
              {isAutopilot ? '🤖 AI Pilot On' : 'Hackathon Ready'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ id, label, icon: Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              onClick={() => setActiveView(id)}
              className={`nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${active ? 'nav-active' : ''}`}
              style={{
                background: active ? 'var(--ckb-blue-dim)' : 'transparent',
                color: active ? 'var(--ckb-blue)' : 'var(--text-secondary)',
                border: active ? '1px solid rgba(0,180,255,0.3)' : '1px solid transparent',
                fontWeight: active ? 600 : 400,
              }}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Auto-Pilot Toggle ── */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setAutopilot(!isAutopilot)}
          className="w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background:   isAutopilot ? 'rgba(0,212,170,0.1)' : 'var(--bg-base)',
            borderColor:  isAutopilot ? 'rgba(0,212,170,0.5)' : 'var(--border)',
            color:        isAutopilot ? 'var(--ckb-green)'     : 'var(--text-muted)',
            boxShadow:    isAutopilot ? '0 0 16px rgba(0,212,170,0.15)' : 'none',
            transition:   'all 0.3s ease',
          }}
        >
          <span className="flex items-center gap-2">
            <Bot size={14} className={isAutopilot ? 'animate-pulse' : ''} />
            Autopilot
          </span>
          <div className={`toggle-pill w-8 h-4 rounded-full relative transition-colors duration-300 ${isAutopilot ? 'bg-[var(--ckb-green)]' : 'bg-[#2a2d3a]'}`}>
            <div
              className={`toggle-thumb absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm ${isAutopilot ? 'left-[18px]' : 'left-0.5'}`}
            />
          </div>
        </button>
      </div>

      {/* Simulation Toggle */}
      <div className="px-4 pb-3" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={toggleSimulation}
          className="w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background:   simMode ? 'rgba(168,85,247,0.1)' : 'var(--bg-base)',
            borderColor:  simMode ? 'var(--ckb-purple)'    : 'var(--border)',
            color:        simMode ? 'var(--ckb-purple)'    : 'var(--text-muted)',
          }}
        >
          <span className="flex items-center gap-2">
            <FastForward size={14} className={simMode ? 'animate-pulse' : ''} />
            Demo Mode
          </span>
          <div className={`toggle-pill w-8 h-4 rounded-full relative ${simMode ? 'bg-[#A855F7]' : 'bg-[#2a2d3a]'}`}>
            <div
              className={`toggle-thumb absolute top-0.5 w-3 h-3 rounded-full bg-white ${simMode ? 'left-[18px]' : 'left-0.5'}`}
            />
          </div>
        </button>
      </div>

      {/* Connection status */}
      <div className="p-4 border-t flex items-center" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full pulse-dot"
            style={{ background: isConnected ? 'var(--ckb-green)' : 'var(--danger)' }}
          />
          <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
            {isConnected ? 'Network Live' : 'Disconnected'}
          </span>
        </div>
      </div>
    </aside>
  );
}
