'use client';

import { useState, memo, useEffect } from 'react';
import { Sidebar } from '@/components/ui/Sidebar';
import { useWebSocket, WebSocketEvent } from '@/hooks/useWebSocket';
import { useAppStore } from '@/store';
import { CheckCircle, AlertTriangle, Zap, Clock, Wifi, Activity, ChevronDown, ChevronUp, Terminal, Code, Copy, Check } from 'lucide-react';


function getStatusConfig(type: string) {
  if (type === 'AGENT_THINKING') return { status: 'thinking', color: 'var(--ckb-purple)', bg: 'rgba(168,85,247,0.1)', icon: Zap };
  if (type === 'AGENT_TOOL_CALL') return { status: 'tool_call', color: 'var(--ckb-blue)', bg: 'var(--ckb-blue-dim)', icon: Terminal };
  if (['TX_CONFIRMED', 'REWARDS_CLAIMED', 'HARVEST_INITIATED'].includes(type)) return { status: 'success', color: 'var(--ckb-green)', bg: 'var(--ckb-green-dim)', icon: CheckCircle };
  if (['TX_FAILED', 'EPOCH_ALERT'].includes(type)) return { status: 'error', color: 'var(--danger)', bg: 'rgba(255,0,0,0.1)', icon: AlertTriangle };
  if (type === 'TX_BROADCAST') return { status: 'info', color: 'var(--ckb-blue)', bg: 'var(--ckb-blue-dim)', icon: Wifi };
  if (type === 'HARVEST_PHASE2_READY') return { status: 'pending', color: 'var(--ckb-orange)', bg: 'var(--ckb-orange-dim)', icon: Clock };
  return { status: 'info', color: 'var(--text-muted)', bg: 'var(--bg-base)', icon: Activity };
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'thinking': return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-[var(--ckb-purple)] bg-[rgba(168,85,247,0.1)] border border-[rgba(168,85,247,0.2)]">Thinking</span>;
    case 'tool_call': return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-[var(--ckb-blue)] bg-[var(--ckb-blue-dim)] border border-[rgba(0,180,255,0.2)]">Tool Call</span>;
    case 'success': return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-[#000] bg-[var(--ckb-green)] border border-[var(--ckb-green)]">Success</span>;
    case 'error': return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-[var(--danger)] bg-[rgba(255,0,0,0.1)] border border-[rgba(255,0,0,0.2)]">Error</span>;
    default: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-[var(--text-muted)] bg-[var(--bg-base)] border border-[var(--border)]">{status}</span>;
  }
}

function CopyButton({ text, label }: { text: string, label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy} 
      className="flex items-center gap-1.5 px-2 py-1 bg-[#1a1a1a] hover:bg-[#2a2a2a] border border-[#333] rounded-md text-[10px] uppercase font-bold text-[var(--text-muted)] transition-colors"
      title="Copy to clipboard"
    >
      {copied ? <Check size={12} className="text-[var(--ckb-green)]" /> : <Copy size={12} />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getHumanReadableSummary(type: string, payload: any) {
  if (type === 'AGENT_THINKING') return payload.message || "Agent is analyzing the request...";
  if (type === 'AGENT_TOOL_CALL') {
    const act = payload.toolName || payload.tool;
    if (act === 'get_balance') return "Wallet balance fetched successfully";
    if (act === 'deposit') {
      const amt = payload.input?.amount || payload.input?.capacity || "funds";
      return `Deposited ${amt} into Nervos DAO`;
    }
    if (act === 'withdraw') return "Initiated CKB withdrawal sequence";
    if (act === 'transfer') {
      const amt = payload.input?.amount || payload.input?.capacity || "funds";
      return `Transferring ${amt}`;
    }
    return `Executed system action: ${act}`;
  }
  if (type === 'TX_CONFIRMED') return "Transaction successfully confirmed on the blockchain";
  if (type === 'TX_BROADCAST') return "Transaction broadcasted to the Nervos network";
  if (type === 'HARVEST_INITIATED') return "Auto-harvesting yield collection initiated";
  if (type === 'REWARDS_CLAIMED') return "DAO yield rewards successfully claimed";
  if (type === 'TX_FAILED') return payload.error || payload.message || "Transaction failed to execute";
  if (type === 'EPOCH_ALERT') return payload.message || "Epoch threshold alert triggered";
  
  return payload.message || "System event completed successfully";
}

const ActivityCard = memo(function ActivityCard({ event, showRawGlobal }: { event: WebSocketEvent & { id: string }, showRawGlobal: boolean }) {
  const [expanded, setExpanded] = useState(false);
  
  const cfg = getStatusConfig(event.type);
  const Icon = cfg.icon;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = (event.payload as any) || {};
  const timeStr = new Date(event.timestamp).toLocaleString();
  
  const summary = getHumanReadableSummary(event.type, payload);
  const toolName = payload.toolName || payload.tool;

  return (
    <div className="flex flex-col rounded-xl transition-all bg-[var(--bg-card)] border border-[var(--border)] shadow-sm hover:border-[var(--ckb-green)] group mb-3">
      {/* Clean Default View (Header) */}
      <div 
        className="flex flex-col sm:flex-row gap-4 p-5 items-start sm:items-center cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105"
          style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
        >
          <Icon size={22} style={{ color: cfg.color }} />
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="text-[13px] font-bold tracking-wide uppercase" style={{ color: cfg.color }}>
              {event.type.replace(/_/g, ' ')}
            </div>
            {getStatusBadge(cfg.status)}
          </div>
          <div className="text-[15px] font-medium leading-snug" style={{ color: 'var(--text-primary)' }}>
            {summary}
          </div>
          {toolName && (
            <div className="text-[12px] font-mono mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Using capability <span className="text-[var(--ckb-blue)] bg-[var(--ckb-blue-dim)] px-1.5 py-0.5 rounded font-bold border border-[rgba(0,180,255,0.2)]">{toolName}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="text-[12px] font-mono opacity-60" style={{ color: 'var(--text-muted)' }}>
            {timeStr}
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111] hover:bg-[#1a1a1a] border border-[#222] rounded-lg text-[11px] uppercase font-bold text-[var(--text-secondary)] transition-colors mt-2"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide Details' : 'View Details'}
          </button>
        </div>
      </div>

      {/* Collapsible Debug Section */}
      {expanded && (
        <div className="bg-[#080808] border-t border-[#222] animate-in fade-in slide-in-from-top-2">
          <div className="p-5 flex flex-col gap-6">
            
            {payload.txHash && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Transaction Hash</span>
                  <CopyButton text={payload.txHash} label="Copy Hash" />
                </div>
                <a
                  href={`https://pudge.explorer.nervos.org/transaction/${payload.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-mono text-[var(--ckb-green)] hover:underline flex items-center gap-1.5 bg-[var(--ckb-green-dim)] border border-[rgba(0,212,170,0.2)] px-3 py-2.5 rounded-lg break-all shadow-inner"
                >
                  {payload.txHash} <Wifi size={14} />
                </a>
              </div>
            )}

            {payload.input ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Code size={12} /> Capability Input Context
                  </span>
                  <CopyButton text={typeof payload.input === 'object' ? JSON.stringify(payload.input, null, 2) : String(payload.input)} label="Copy JSON" />
                </div>
                <pre className="bg-[#000] p-4 rounded-xl text-[12px] overflow-x-auto border border-[#222] text-[#e5e5e5] font-mono shadow-inner whitespace-pre-wrap leading-relaxed">
                  {typeof payload.input === 'object' ? JSON.stringify(payload.input, null, 2) : String(payload.input)}
                </pre>
              </div>
            ) : null}

            {payload.output ? (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                    <Code size={12} /> Execution Result
                  </span>
                  <CopyButton text={typeof payload.output === 'object' ? JSON.stringify(payload.output, null, 2) : String(payload.output)} label="Copy JSON" />
                </div>
                <pre className="bg-[#000] p-4 rounded-xl text-[12px] overflow-x-auto border border-[#222] text-[#e5e5e5] font-mono shadow-inner whitespace-pre-wrap leading-relaxed">
                  {typeof payload.output === 'object' ? JSON.stringify(payload.output, null, 2) : String(payload.output)}
                </pre>
              </div>
            ) : null}

            {showRawGlobal && (
              <div className="flex flex-col gap-2 pt-5 border-t border-[#222] mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ckb-purple)] flex items-center gap-1.5">
                    <Terminal size={12} /> Raw Developer Trace
                  </span>
                  <CopyButton text={JSON.stringify(event, null, 2)} label="Copy Log" />
                </div>
                <pre className="bg-[#000] p-4 rounded-xl text-[11px] overflow-x-auto border border-[var(--ckb-purple)]/30 text-[#e5e5e5] font-mono shadow-inner whitespace-pre-wrap">
                  {JSON.stringify(event, null, 2)}
                </pre>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
});

export default function ActivityPage() {
  const { isConnected } = useWebSocket();
  // Use the unified events store — same data as the main dashboard
  const activityLogs = useAppStore((state) => state.events);
  const setActiveView = useAppStore((state) => state.setActiveView);
  const [showRaw, setShowRaw] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark Activity as the active nav item so Sidebar highlights correctly
    setActiveView('activity');
    setMounted(true);
  }, [setActiveView]);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isConnected={isConnected} />

      <div className="flex flex-1 overflow-hidden p-6 flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>System Events & Logs</h1>
            <span className="text-xs px-3 py-1.5 rounded-full font-mono bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)] font-bold shadow-sm">
              {activityLogs.length} Events captured
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span className="text-[12px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Show Raw Traces</span>
            <div 
              className={`w-9 h-5 rounded-full relative transition-colors shadow-inner ${showRaw ? 'bg-[var(--ckb-purple)]' : 'bg-[#333]'}`}
              onClick={() => setShowRaw(!showRaw)}
            >
              <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-xl ${showRaw ? 'left-[20px]' : 'left-1'}`} />
            </div>
          </label>
        </div>

        <div className="flex-1 overflow-y-auto w-full bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-4 shadow-sm">
          {!mounted ? (
            <div className="h-full flex flex-col items-center justify-center opacity-60">
              <Activity size={32} className="animate-pulse text-[var(--ckb-green)] mb-3" />
              <div className="text-sm font-mono text-[var(--text-muted)] uppercase tracking-wider font-bold">
                Initializing Activity Pipeline...
              </div>
            </div>
          ) : activityLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <Activity size={32} className="mb-3 text-[var(--text-muted)] opacity-50" />
              <div className="text-sm text-[var(--text-muted)] font-medium">No activity recorded yet</div>
              <div className="text-xs text-[var(--text-muted)] mt-1 max-w-sm">
                Interact with the AI assistant or wait for blockchain network events to view the comprehensive history logs.
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {[...activityLogs].reverse().map((ev) => (
                <ActivityCard key={ev.id} event={ev} showRawGlobal={showRaw} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
