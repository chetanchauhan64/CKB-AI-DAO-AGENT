'use client';

import { memo } from 'react';
import { Loader2, Cpu, Zap, Wifi } from 'lucide-react';

type Status = 'online' | 'thinking' | 'executing';

interface AgentStatusProps {
  isConnected: boolean;
  isLoading: boolean;
  toolCalled?: string;
}

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-0.5 ml-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1 h-1 rounded-full bg-current opacity-80"
          style={{ animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-3px); opacity: 1; }
        }
      `}</style>
    </span>
  );
}

export const AgentStatus = memo(function AgentStatus({
  isConnected,
  isLoading,
  toolCalled,
}: AgentStatusProps) {
  const status: Status = !isConnected ? 'online' : isLoading && toolCalled ? 'executing' : isLoading ? 'thinking' : 'online';

  const config = {
    online: {
      icon: Wifi,
      color: 'var(--ckb-green)',
      bg: 'var(--ckb-green-dim)',
      border: 'rgba(0,212,170,0.25)',
      label: 'Agent Online',
      pulse: true,
    },
    thinking: {
      icon: Cpu,
      color: 'var(--ckb-purple)',
      bg: 'rgba(168,85,247,0.12)',
      border: 'rgba(168,85,247,0.3)',
      label: 'Thinking',
      pulse: false,
    },
    executing: {
      icon: Zap,
      color: 'var(--ckb-blue)',
      bg: 'var(--ckb-blue-dim)',
      border: 'rgba(0,180,255,0.3)',
      label: `Running ${toolCalled}`,
      pulse: false,
    },
  }[status];

  const Icon = config.icon;

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all duration-300"
      style={{ background: config.bg, border: `1px solid ${config.border}`, color: config.color }}
    >
      {/* Dot */}
      <div className="relative flex items-center justify-center w-2 h-2">
        {config.pulse && (
          <div
            className="absolute w-full h-full rounded-full animate-ping opacity-60"
            style={{ background: config.color }}
          />
        )}
        <div className="relative w-2 h-2 rounded-full" style={{ background: config.color }} />
      </div>

      <Icon size={11} />

      <span className="uppercase tracking-wider">
        {config.label}
        {status === 'thinking' && <ThinkingDots />}
        {status === 'executing' && (
          <Loader2 size={10} className="inline ml-1.5 animate-spin" />
        )}
      </span>
    </div>
  );
});
