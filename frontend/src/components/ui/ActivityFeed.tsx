'use client';

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import {
  CheckCircle, AlertTriangle, Zap, Clock, Wifi, Activity,
  Terminal, Code, ChevronDown, ChevronUp, Check, Copy, Inbox, Sparkles, Bot
} from 'lucide-react';
import type { WebSocketEvent } from '@/store';

// ─── Relative-time formatter ─────────────────────────────────────────────────
function timeAgo(ts: number): string {
  const delta = Math.floor((Date.now() - ts) / 1000);
  if (delta < 5)  return 'Just now';
  if (delta < 60) return `${delta}s ago`;
  const m = Math.floor(delta / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

interface ActivityFeedProps {
  events: (WebSocketEvent)[];
  large?: boolean;
}

// ─── Event → display config ──────────────────────────────────────────────────

interface EventConfig {
  icon: typeof Activity;
  color: string;
  bg: string;
  label: string;
  lifecycleClass?: string;
}

function getEventConfig(type: string): EventConfig {
  switch (type) {
    case 'AGENT_THINKING':
      return { icon: Zap,           color: 'var(--ckb-purple)',   bg: 'rgba(124,58,237,0.1)',  label: '🧠 AI Thinking',                lifecycleClass: '' };
    case 'AGENT_TOOL_CALL':
      return { icon: Terminal,      color: 'var(--ckb-blue)',     bg: 'var(--ckb-blue-dim)',   label: '🤖 AI Executing Plan',          lifecycleClass: '' };
    case 'TOOL_SUCCESS':
      return { icon: CheckCircle,   color: 'var(--ckb-green)',    bg: 'var(--ckb-green-dim)',  label: '✅ Action Completed',           lifecycleClass: 'lifecycle-earning' };
    case 'TOOL_ERROR':
      return { icon: AlertTriangle, color: 'var(--danger)',       bg: 'rgba(255,60,60,0.1)',   label: '⚠️ AI Encountered Issue',      lifecycleClass: '' };
    case 'TX_CONFIRMED':
    case 'REWARDS_CLAIMED':
    case 'HARVEST_INITIATED':
      return { icon: CheckCircle,   color: 'var(--ckb-green)',    bg: 'var(--ckb-green-dim)',  label: '✅ Blockchain Confirmed',       lifecycleClass: 'lifecycle-earning' };
    case 'TX_FAILED':
      return { icon: AlertTriangle, color: 'var(--danger)',       bg: 'rgba(255,60,60,0.1)',   label: '❌ Transaction Failed',        lifecycleClass: '' };
    case 'TX_BROADCAST':
      return { icon: Wifi,          color: 'var(--ckb-blue)',     bg: 'var(--ckb-blue-dim)',   label: '🔗 Transaction sent to network', lifecycleClass: '' };
    case 'HARVEST_PHASE2_READY':
      return { icon: Clock,         color: 'var(--ckb-orange)',   bg: 'var(--ckb-orange-dim)', label: '💰 Funds ready to claim',      lifecycleClass: 'lifecycle-ready' };
    case 'AGENT_SYSTEM_MESSAGE':
      return { icon: Sparkles,      color: 'var(--ckb-green)',    bg: 'var(--ckb-green-dim)',  label: '🤖 AI Insight',                lifecycleClass: '' };
    default:
      return { icon: Activity,      color: 'var(--text-muted)',   bg: 'var(--bg-base)',        label: 'System Event',                 lifecycleClass: '' };
  }
}

// ─── AI Narrator Insights per event type ────────────────────────────────────

function getNarratorInsight(type: string, payload: WebSocketEvent['payload']): string | null {
  const tool = (payload.toolName ?? payload.tool) as string | undefined;

  switch (type) {
    case 'AGENT_TOOL_CALL':
      if (tool === 'deposit')         return 'I\'m allocating your CKB to Nervos DAO to maximize yield. This secures your funds on-chain.';
      if (tool === 'withdraw_phase1') return 'Your funds were nearing maturity, so I initiated a withdrawal to secure your yield.';
      if (tool === 'withdraw_phase2') return 'The waiting period has passed. I\'m claiming your unlocked rewards now.';
      if (tool === 'schedule_harvest')return 'Enabling auto-harvest means I\'ll compound your returns automatically at the best time.';
      if (tool === 'scan_dao')        return 'Scanning your portfolio for positions that are ready to harvest or compound.';
      return null;

    case 'TOOL_SUCCESS':
      if (tool === 'deposit')         return 'Deposit confirmed. Your CKB is now earning yield in Nervos DAO.';
      if (tool === 'withdraw_phase1') return 'Phase 1 unlock submitted. I\'ll monitor and complete the claim when the lock expires.';
      if (tool === 'withdraw_phase2') return 'Rewards fully claimed. You can now reinvest or keep the yield in your wallet.';
      if (tool === 'schedule_harvest')return 'Auto-harvest is live. Reinvesting will compound your returns by ~12% over time.';
      return null;

    case 'TX_CONFIRMED':
      return 'Transaction confirmed by miners. Your funds are now secured on the Nervos blockchain.';

    case 'HARVEST_PHASE2_READY':
      return 'The lock period has expired. I\'m ready to claim your rewards — just give me the word, or autopilot will handle it.';

    case 'REWARDS_CLAIMED':
      return 'All yield collected successfully. Consider reinvesting to compound your returns automatically.';

    default:
      return null;
  }
}

// ─── Lifecycle State Pill ────────────────────────────────────────────────────

function LifecyclePill({ type, tool }: { type: string; tool?: string }) {
  type Stage = { label: string; color: string; bg: string };
  let stage: Stage | null = null;

  if (type === 'TOOL_SUCCESS' && tool === 'deposit') {
    stage = { label: 'Earning', color: 'var(--ckb-green)', bg: 'var(--ckb-green-dim)' };
  } else if (type === 'AGENT_TOOL_CALL' && tool === 'withdraw_phase1') {
    stage = { label: 'Unlocking', color: 'var(--ckb-orange)', bg: 'var(--ckb-orange-dim)' };
  } else if (type === 'HARVEST_PHASE2_READY') {
    stage = { label: 'Ready to Claim', color: 'var(--ckb-blue)', bg: 'var(--ckb-blue-dim)' };
  } else if (type === 'REWARDS_CLAIMED') {
    stage = { label: 'Claimed', color: 'var(--ckb-green)', bg: 'var(--ckb-green-dim)' };
  } else if (type === 'TX_CONFIRMED' && tool === 'reinvest') {
    stage = { label: 'Reinvested', color: 'var(--ckb-purple)', bg: 'var(--ckb-purple-dim)' };
  }

  if (!stage) return null;

  return (
    <span
      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border self-start"
      style={{ color: stage.color, background: stage.bg, borderColor: `${stage.color}40` }}
    >
      {stage.label}
    </span>
  );
}

// ─── Human-readable summaries ────────────────────────────────────────────────

function getSummary(type: string, payload: WebSocketEvent['payload']): string {
  switch (type) {
    case 'AGENT_THINKING':
      return (payload.message as string | undefined) ?? 'Analyzing your portfolio...';

    case 'AGENT_TOOL_CALL': {
      const tool = (payload.toolName ?? payload.tool) as string | undefined;
      const amount = (payload.input as Record<string, unknown> | undefined)?.amount_ckb;
      if (tool === 'deposit')           return amount ? `AI initialized a deposit of ${amount} CKB` : 'AI is depositing into Nervos DAO';
      if (tool === 'withdraw_phase1')   return 'AI initiated a withdrawal to secure yield';
      if (tool === 'withdraw_phase2')   return 'AI is claiming your DAO rewards';
      if (tool === 'get_balance')       return 'AI checked your wallet balance';
      if (tool === 'send_ckb')          return amount ? `AI triggered transfer of ${amount} CKB` : 'AI sending CKB';
      if (tool === 'schedule_harvest')  return 'AI configured auto-harvest strategy for optimal compounding';
      if (tool === 'scan_dao')          return 'AI scanned your portfolio for mature deposits';
      if (tool === 'execute_transfer')  return (payload.message as string | undefined) ?? 'AI executing scheduled strategy';
      return (payload.message as string | undefined) ?? (tool ? `AI is running task: ${tool}` : 'AI agent is actively working');
    }

    case 'TOOL_SUCCESS': {
      const tool = payload.tool as string | undefined;
      const msg = payload.message as string | undefined;
      if (msg) return msg;
      if (tool === 'deposit')           return 'AI successfully allocated CKB to Nervos DAO';
      if (tool === 'withdraw_phase1')   return 'Phase 1 unlock successful — awaiting maturity window';
      if (tool === 'withdraw_phase2')   return 'Rewards fully unlocked and claimed to your wallet';
      if (tool === 'get_balance')       return 'Portfolio snapshot complete';
      if (tool === 'schedule_harvest')  return 'Automation active — AI will compound at optimal intervals';
      return 'AI completed the task successfully';
    }

    case 'TOOL_ERROR': {
      const tool = payload.tool as string | undefined;
      const result = payload.result as string | undefined;
      const msg = result?.replace(/^Error:\s*/i, '') ?? 'Unknown error';
      return tool ? `AI action "${tool}" failed: ${msg.slice(0, 80)}` : `Failed: ${msg.slice(0, 80)}`;
    }

    case 'TX_CONFIRMED':           return 'Your transaction was confirmed by miners on the Nervos network';
    case 'TX_BROADCAST':           return (payload.message as string | undefined) ?? 'AI submitted the transaction to the P2P network';
    case 'TX_FAILED':              return `${(payload.error ?? payload.message ?? 'Transaction dropped from network') as string}`;
    case 'HARVEST_INITIATED':      return 'AI auto-harvest triggered for a mature position';
    case 'REWARDS_CLAIMED':        return 'All yield successfully collected and secured in your wallet';
    case 'HARVEST_PHASE2_READY':   return 'The lock period has expired — AI is ready to claim your rewards';
    case 'EPOCH_ALERT':            return `${(payload.message ?? 'Epoch timeline updated') as string}`;
    case 'AGENT_SYSTEM_MESSAGE':
       {
         const cleanMsg = ((payload.message as string) || '').replace(/\*\*/g, '').replace(/Transaction Hash:.*/, '').trim();
         return cleanMsg.substring(0, 120) + (cleanMsg.length > 120 ? '...' : '');
       }
    default:
      return (payload.message as string | undefined) ?? 'AI recorded an update';
  }
}

// ─── CopyButton ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase border transition-all hover:scale-105 active:scale-95"
      style={{ background: '#0d0f14', borderColor: 'rgba(0,212,170,0.3)', color: 'var(--ckb-green)' }}
    >
      {copied ? <Check size={10} /> : <Copy size={10} />}
      {copied ? 'Copied!' : 'Copy TX'}
    </button>
  );
}

// ─── AI Narrator Card ────────────────────────────────────────────────────────

function NarratorCard({ insight }: { insight: string }) {
  return (
    <div
      className="narrator-enter flex items-start gap-2.5 px-3 py-2.5 rounded-xl mt-2"
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,170,0.05) 0%, rgba(59,91,219,0.04) 100%)',
        border: '1px solid rgba(0,212,170,0.18)',
      }}
    >
      <Bot size={14} style={{ color: 'var(--ckb-green)', flexShrink: 0, marginTop: 1 }} />
      <div>
        <div className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: 'var(--ckb-green)' }}>
          AI Insight
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          &ldquo;{insight}&rdquo;
        </p>
      </div>
    </div>
  );
}

// ─── Single Event Row ────────────────────────────────────────────────────────

const EventRow = memo(function EventRow({ event, isNew }: {
  event: WebSocketEvent;
  isNew: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const cfg = getEventConfig(event.type);
  const Icon = cfg.icon;
  const payload = event.payload;
  const summary = getSummary(event.type, payload);
  const insight = getNarratorInsight(event.type, payload);
  const tool = (payload.toolName ?? payload.tool) as string | undefined;
  const [relTime, setRelTime] = useState(() => timeAgo(event.timestamp));

  // Update relative timestamp every 10s
  useEffect(() => {
    const t = setInterval(() => setRelTime(timeAgo(event.timestamp)), 10_000);
    return () => clearInterval(t);
  }, [event.timestamp]);

  // Flash border on first render when isNew
  useEffect(() => {
    if (isNew && rowRef.current) {
      rowRef.current.classList.add('event-flash');
      const t = setTimeout(() => rowRef.current?.classList.remove('event-flash'), 1300);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  const txHash = payload.txHash as string | undefined;
  const inputData = payload.input;
  const outputData = payload.result ?? payload.output;

  return (
    <div
      ref={rowRef}
      className="relative pl-6 pb-4"
      style={{ animation: isNew ? 'fadeUp 0.35s ease-out both' : undefined }}
    >
      {/* ── Vertical Timeline Line ── */}
      <div 
        className="absolute left-3 top-[18px] bottom-[-10px] w-px bg-[var(--border)] z-0" 
        style={{ transform: 'translateX(-50%)' }}
      />
      
      {/* ── Timeline Node (Dot) ── */}
      <div 
        className="absolute left-3 top-2 w-2.5 h-2.5 rounded-full z-10"
        style={{ 
          transform: 'translateX(-50%)',
          background: cfg.color,
          boxShadow: isNew ? `0 0 14px ${cfg.color}, 0 0 6px ${cfg.color}80` : 'none',
          border: '2px solid var(--bg-card)',
          transition: 'box-shadow 0.5s ease',
        }}
      />

      <div
        className={`group flex flex-col gap-0 px-4 py-3 rounded-2xl border transition-all duration-300 hover:shadow-md relative z-10 ${cfg.lifecycleClass ?? ''} ${
          isNew
            ? 'border-[var(--ckb-green)] shadow-[0_0_16px_rgba(0,212,170,0.12)]'
            : 'border-transparent hover:border-[var(--border)]'
        }`}
        style={{ background: isNew ? 'rgba(0,212,170,0.04)' : 'var(--bg-card)' }}
      >
        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => setExpanded((v) => !v)} style={{ cursor: 'pointer' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5"
              style={{ color: cfg.color }}
            >
              <Icon size={12} /> {cfg.label}
            </span>
            <span className="text-[10px] opacity-50 font-mono tracking-widest" style={{ color: 'var(--text-muted)' }}>
              {relTime}
            </span>
          </div>
          <div className="text-[13px] font-medium leading-relaxed mb-1.5" style={{ color: 'var(--text-primary)' }}>
            {summary}
          </div>

          {/* Lifecycle pill */}
          <LifecyclePill type={event.type} tool={tool} />

          {/* TX hash preview (collapsed) */}
          {txHash && !expanded && (
             <div className="text-[10px] font-mono mt-2 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
               <span className="opacity-60">{txHash.slice(0, 10)}…{txHash.slice(-8)}</span>
               <CopyButton text={txHash} />
             </div>
          )}

          {/* Inline AI narrator insight */}
          {insight && !expanded && (
            <NarratorCard insight={insight} />
          )}
        </div>

        {/* Expand toggle */}
        <div className="absolute right-3 bottom-2 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" onClick={() => setExpanded((v) => !v)} style={{ cursor: 'pointer' }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          className="mx-1 px-3 pb-4 pt-2 border-x border-b rounded-b-2xl"
          style={{ borderColor: 'var(--border)', background: '#060606' }}
        >
          {txHash && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  TX Hash
                </span>
                <div className="flex items-center gap-2">
                  <CopyButton text={txHash} />
                  <a
                    href={`https://pudge.explorer.nervos.org/transaction/${txHash}`}
                    target="_blank" rel="noreferrer"
                    className="text-[9px] font-bold uppercase tracking-wider hover:underline"
                    style={{ color: 'var(--ckb-blue)' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Explorer ↗
                  </a>
                </div>
              </div>
              <div
                className="font-mono text-[10px] rounded px-2 py-1.5 break-all"
                style={{ background: 'var(--ckb-green-dim)', color: 'var(--ckb-green)', border: '1px solid rgba(0,212,170,0.2)' }}
              >
                {txHash}
              </div>
            </div>
          )}

          {inputData !== undefined && (
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Code size={9} /> Input
                </span>
              </div>
              <pre
                className="text-[10px] font-mono rounded px-2 py-2 overflow-x-auto whitespace-pre-wrap break-words border"
                style={{ background: '#000', color: '#e5e5e5', borderColor: '#222' }}
              >
                {typeof inputData === 'object' ? JSON.stringify(inputData, null, 2) : String(inputData)}
              </pre>
            </div>
          )}

          {outputData !== undefined && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <Code size={9} /> Output
                </span>
              </div>
              <pre
                className="text-[10px] font-mono rounded px-2 py-2 overflow-x-auto whitespace-pre-wrap break-words border"
                style={{ background: '#000', color: '#e5e5e5', borderColor: '#222' }}
              >
                {typeof outputData === 'object' ? JSON.stringify(outputData, null, 2) : String(outputData)}
              </pre>
            </div>
          )}

          {/* AI Insight in expanded view too */}
          {insight && (
            <div className="mt-3">
              <NarratorCard insight={insight} />
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Main Component ──────────────────────────────────────────────────────────

export function ActivityFeed({ events, large }: ActivityFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const prevLength = useRef(0);

  // Highlight newly arriving events for 3 seconds
  useEffect(() => {
    if (events.length > prevLength.current) {
      const fresh = events.slice(0, events.length - prevLength.current).map((e) => e.id);
      setNewEventIds((prev) => {
        const next = new Set(prev);
        fresh.forEach((id) => next.add(id));
        return next;
      });
      setTimeout(() => {
        setNewEventIds((prev) => {
          const next = new Set(prev);
          fresh.forEach((id) => next.delete(id));
          return next;
        });
      }, 3000);
    }
    prevLength.current = events.length;
  }, [events]);

  const visibleEvents = events.filter((ev) =>
    [
      'AGENT_THINKING', 'AGENT_TOOL_CALL', 'TOOL_SUCCESS', 'TOOL_ERROR',
      'TX_CONFIRMED', 'TX_BROADCAST', 'TX_FAILED',
      'REWARDS_CLAIMED', 'HARVEST_INITIATED', 'HARVEST_PHASE2_READY', 'AGENT_SYSTEM_MESSAGE'
    ].includes(ev.type)
  );

  // Auto-scroll to top (newest event) when new events arrive — only for the sidebar variant
  useEffect(() => {
    if (!large && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [visibleEvents.length, large]);

  // Count lifecycle stages for summary bar
  const earningCount  = events.filter(e => e.type === 'TOOL_SUCCESS' && (e.payload.tool as string) === 'deposit').length;
  const claimedCount  = events.filter(e => e.type === 'REWARDS_CLAIMED').length;
  const txCount       = events.filter(e => e.type === 'TX_CONFIRMED').length;

  // Show More state for the large (full-page) variant
  const SHOW_LIMIT = 5;
  const [showAll, setShowAll] = useState(false);
  const displayedEvents = large && !showAll ? visibleEvents.slice(0, SHOW_LIMIT) : visibleEvents;
  const hiddenCount = visibleEvents.length - SHOW_LIMIT;

  return (
    <div
      className={`flex flex-col h-full ${
        large ? 'bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-5 shadow-sm' : 'bg-[var(--bg-card)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            <div className="absolute w-full h-full rounded-full bg-[var(--ckb-green)] animate-ping opacity-75" />
            <div className="relative w-2.5 h-2.5 rounded-full bg-[var(--ckb-green)]" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            {large ? 'Agent Story Timeline' : 'Live Activity'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {large && txCount > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--ckb-green-dim)', color: 'var(--ckb-green)' }}>
              {txCount} TX
            </span>
          )}
          {large && claimedCount > 0 && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--ckb-blue-dim)', color: 'var(--ckb-blue)' }}>
              {claimedCount} Claimed
            </span>
          )}
          <span
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border"
            style={{ background: 'var(--bg-base)', color: 'var(--ckb-green)', borderColor: 'var(--border)' }}
          >
            {visibleEvents.length} Events
          </span>
        </div>
      </div>

      {/* Lifecycle progress strip (large only) */}
      {large && visibleEvents.length > 0 && (
        <div className="flex items-center gap-1 px-2 mb-4 flex-shrink-0">
          {[
            { label: 'Earn', color: 'var(--ckb-green)', active: earningCount > 0 },
            { label: 'Unlock', color: 'var(--ckb-orange)', active: events.some(e => e.type === 'AGENT_TOOL_CALL' && (e.payload.toolName as string) === 'withdraw_phase1') },
            { label: 'Ready', color: 'var(--ckb-blue)', active: events.some(e => e.type === 'HARVEST_PHASE2_READY') },
            { label: 'Claim', color: 'var(--ckb-purple)', active: claimedCount > 0 },
            { label: 'Reinvest', color: '#00d4aa', active: events.some(e => e.type === 'TX_BROADCAST' && ((e.payload.message as string) || '').toLowerCase().includes('compound')) },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex items-center gap-1 flex-1">
              <div
                className="h-1.5 flex-1 rounded-full transition-all duration-700"
                style={{
                  background: step.active ? step.color : 'var(--border)',
                  boxShadow: step.active ? `0 0 6px ${step.color}60` : 'none',
                }}
              />
              <span
                className="text-[8px] font-bold uppercase tracking-widest whitespace-nowrap"
                style={{ color: step.active ? step.color : 'var(--text-muted)' }}
              >
                {step.label}
              </span>
              {i < arr.length - 1 && (
                <span className="text-[10px] opacity-30" style={{ color: 'var(--text-muted)' }}>›</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Event list */}
      <div ref={containerRef} className="flex-1 overflow-y-auto pr-1 scroll-smooth">
        {visibleEvents.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--bg-base)', border: '1px dashed var(--border)' }}>
              <Inbox size={22} style={{ color: 'var(--text-muted)' }} className="opacity-40" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                No activity yet
              </div>
              {large && (
                <div className="text-[11px] px-3 py-1.5 rounded-lg border" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-base)' }}>
                  Try: <span style={{ color: 'var(--ckb-green)' }}>&ldquo;Deposit 100 CKB into DAO&rdquo;</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            {displayedEvents.map((ev) => (
              <EventRow
                key={ev.id}
                event={ev}
                isNew={newEventIds.has(ev.id)}
              />
            ))}

            {/* Show More / Show Less — large variant only */}
            {large && visibleEvents.length > SHOW_LIMIT && (
              <button
                onClick={() => setShowAll((v) => !v)}
                className="w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl text-[12px] font-semibold transition-all hover:bg-white/[0.03]"
                style={{ color: 'var(--ckb-green)', border: '1px dashed rgba(0,212,170,0.25)' }}
              >
                <ChevronDown
                  size={14}
                  style={{ transform: showAll ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }}
                />
                {showAll ? 'Show Less' : `Show ${hiddenCount} More Events`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
