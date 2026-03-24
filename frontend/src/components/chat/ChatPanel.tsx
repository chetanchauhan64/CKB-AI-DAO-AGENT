'use client';

import { useRef, useEffect, useCallback, useState, MutableRefObject } from 'react';
import { Send, Bot, User, Zap, Sparkles, PlayCircle, RotateCcw, ChevronDown } from 'lucide-react';
import { useAgentChat } from '@/hooks/useAgentChat';
import { StrategyPanel } from '../strategy/StrategyPanel';
import { AgentStatus } from '../ui/AgentStatus';
import { toast } from '../ui/Toast';
import { useAppStore } from '@/store';
import { AgentResponseCard } from './AgentResponseCard';
import type { WebSocketEvent } from '@/store';

function cleanText(text: string) {
  if (!text) return '';
  
  // 1. Remove fully formed <tag>...</tag> blocks
  let cleaned = text.replace(/<[a-z0-9_-]+>[\s\S]*?<\/[a-z0-9_-]+>\n*/gi, '');
  
  // 2. Truncate at any known opening tag that is unclosed (streaming)
  const tags = ['<explanation', '<thinking', '<analysis', '<reasoning'];
  for (const tag of tags) {
    const idx = cleaned.indexOf(tag);
    if (idx !== -1) cleaned = cleaned.slice(0, idx);
  }

  // 3. Handle micro-streaming states at the very end of the string ("<", "<e", "<ex")
  const endingMatch = cleaned.match(/<[a-z]*$/i);
  if (endingMatch) {
    const suffix = endingMatch[0].toLowerCase();
    if ('<explanation'.startsWith(suffix) || '<thinking'.startsWith(suffix)) {
      cleaned = cleaned.slice(0, endingMatch.index);
    }
  }

  return cleaned.trim();
}

// ─── Quick commands ───────────────────────────────────────────────────────────
const QUICK_COMMANDS = [
  { label: '💰 Balance',           cmd: 'Check my CKB balance'            },
  { label: '🏦 Deposit 102 CKB',   cmd: 'Deposit 102 CKB into the DAO'    },
  { label: '📋 DAO Deposits',       cmd: 'Show my DAO deposits'             },
  { label: '⏱️ Epoch Info',        cmd: 'What is the current epoch?'      },
  { label: '🤖 Auto-harvest',       cmd: 'Enable auto-harvest at 5 epochs' },
];

// Demo sequence — fires real agent commands one after another
const DEMO_SEQUENCE = [
  'Check my CKB balance',
  'What is the current epoch?',
  'Show my DAO deposits',
];

// ─── Animated thinking dots ───────────────────────────────────────────────────
function ThinkingBubble({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2.5" style={{ color: 'var(--ckb-purple)' }}>
      {/* Three bouncing dots */}
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: 'var(--ckb-purple)',
              animation: `dotBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <span className="text-[13px] font-medium opacity-90">
        {text || 'Agent is thinking…'}
      </span>
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.35; }
          40%            { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}


// ─── Main component ───────────────────────────────────────────────────────────
interface ChatPanelProps {
  wsEvents: WebSocketEvent[];
  sendMessageRef?: MutableRefObject<((msg: string) => void) | null>;
}

export function ChatPanel({ wsEvents, sendMessageRef }: ChatPanelProps) {
  const {
    messages, input, setInput, isLoading, strategy,
    sendMessage, clearChat, handleSuggestionEvent, handleSystemMessage, handleThinkingEvent, handleMessageChunk
  } = useAgentChat();

  const scrollRef        = useRef<HTMLDivElement>(null);
  const textareaRef      = useRef<HTMLTextAreaElement>(null);
  const isScrolledUpRef  = useRef(false);
  const isDemoMode       = useAppStore((s) => s.isDemoMode);
  const isConnected      = useAppStore((s) => s.isConnected);
  const [demoRunning, setDemoRunning]     = useState(false);
  const [showNewMsgBtn, setShowNewMsgBtn] = useState(false);

  // Expose sendMessage so onboarding can trigger commands
  useEffect(() => {
    if (sendMessageRef) sendMessageRef.current = sendMessage;
  }, [sendMessage, sendMessageRef]);

  // Track which tool is currently being called (for AgentStatus)
  const [currentTool, setCurrentTool] = useState<string | undefined>();
  const prevLoadingRef      = useRef(false);
  const scrollDebounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Scroll helpers ────────────────────────────────────────────────────────
  const scrollToBottom = useCallback((instant = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: instant ? 'auto' : 'smooth' });
    isScrolledUpRef.current = false;
    setShowNewMsgBtn(false);
  }, []);

  // Track whether user has scrolled away from the bottom (debounced 80 ms)
  const handleScroll = useCallback(() => {
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
    scrollDebounceRef.current = setTimeout(() => {
      const el = scrollRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      isScrolledUpRef.current = distanceFromBottom > 100;
      if (!isScrolledUpRef.current) setShowNewMsgBtn(false);
    }, 80);
  }, []);

  // Clean up debounce timer on unmount
  useEffect(() => () => {
    if (scrollDebounceRef.current) clearTimeout(scrollDebounceRef.current);
  }, []);

  // Detect when a new assistant message completes — fire toast
  useEffect(() => {
    const wasLoading = prevLoadingRef.current;
    prevLoadingRef.current = isLoading;
    if (wasLoading && !isLoading) {
      const last = messages[messages.length - 1];
      if (!last || last.role !== 'assistant') return;
      if (last.content.startsWith('❌')) {
        toast.error('Agent error', last.content.replace(/^❌\s*Error:\s*/i, '').slice(0, 80));
      } else if (last.txHash) {
        toast.success('Transaction sent! 🎉', `TX: ${last.txHash.slice(0, 14)}…`);
      } else if (last.toolCalled) {
        toast.success('Action complete ✅', `${last.toolCalled} executed successfully`);
      }
    }
  }, [isLoading, messages]);

  // Track the latest tool call
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.loading && last.toolCalled) setCurrentTool(last.toolCalled);
    else if (!isLoading) setCurrentTool(undefined);
  }, [messages, isLoading]);

  // Smart auto-scroll: only scroll if user is already near bottom
  useEffect(() => {
    if (messages.length === 0) return;
    if (isScrolledUpRef.current) {
      // User scrolled up — show indicator instead
      setShowNewMsgBtn(true);
    } else {
      // Small delay so DOM has painted the new bubble
      const t = setTimeout(() => scrollToBottom(), 60);
      return () => clearTimeout(t);
    }
  }, [messages, scrollToBottom]);

  // Focus input when loading finishes — only when textarea is not already focused
  useEffect(() => {
    if (!isLoading && document.activeElement !== textareaRef.current) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  // WebSocket events → chat UI
  useEffect(() => {
    wsEvents
      .filter((e) => e.type === 'AGENT_SUGGESTION')
      .forEach((ev) => handleSuggestionEvent(ev.id, (ev.payload.message as string | undefined) ?? ''));

    const latest = wsEvents.filter((e) => e.type === 'AGENT_THINKING').at(-1);
    if (latest) handleThinkingEvent((latest.payload.message as string | undefined) ?? '');

    wsEvents
      .filter((e) => e.type === 'AGENT_SYSTEM_MESSAGE')
      .forEach((ev) => handleSystemMessage(ev.id, (ev.payload.message as string | undefined) ?? ''));

    wsEvents
      .filter((e) => e.type === 'AGENT_MESSAGE_CHUNK')
      .forEach((ev) => handleMessageChunk(ev.id, (ev.payload.chunk as string | undefined) ?? ''));
  }, [wsEvents, handleSuggestionEvent, handleSystemMessage, handleThinkingEvent, handleMessageChunk]);

  // ─── Run Demo ────────────────────────────────────────────────────────────
  const runDemo = useCallback(async () => {
    if (demoRunning || isLoading) return;
    setDemoRunning(true);
    toast.info('🚀 Demo running…', 'Executing sample agent commands');

    for (const cmd of DEMO_SEQUENCE) {
      await sendMessage(cmd);
      // Small pause between commands so the user can see each response
      await new Promise((r) => setTimeout(r, 800));
    }

    toast.success('Demo complete! 🎉', 'All sample commands executed');
    setDemoRunning(false);
  }, [demoRunning, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) sendMessage(input);
    }
  };

  const isEmpty = messages.length <= 1; // only welcome msg

  return (
    <div className="flex flex-col h-full gap-0">

      {/* ── Demo Mode Banner ─────────────────────────────────────────────── */}
      {isDemoMode && (
        <div
          className="flex items-center gap-2 px-4 py-2 mb-3 rounded-xl text-[12px] font-bold"
          style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', color: 'var(--ckb-purple)' }}
        >
          <Sparkles size={13} className="animate-pulse" />
          🧪 Demo Mode Active — No real transactions will be executed
        </div>
      )}

      {/* ── Top bar: status + actions ───────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <AgentStatus isConnected={isConnected} isLoading={isLoading} toolCalled={currentTool} />

        <div className="flex items-center gap-2">
          {/* Run Demo button */}
          <button
            onClick={runDemo}
            disabled={demoRunning || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all hover:scale-[1.03] disabled:opacity-50"
            style={{ background: 'var(--ckb-blue-dim)', border: '1px solid rgba(0,180,255,0.3)', color: 'var(--ckb-blue)' }}
          >
            <PlayCircle size={13} />
            {demoRunning ? 'Running…' : 'Run Demo'}
          </button>
          {/* Clear chat */}
          <button
            onClick={clearChat}
            title="Clear chat"
            className="p-1.5 rounded-lg transition-colors hover:bg-[var(--bg-card)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* ── Strategy panel ───────────────────────────────────────────────── */}
      <StrategyPanel strategy={strategy} />

      {/* ── Message list ─────────────────────────────────────────────────── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 relative"
      >

        {/* Welcome empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-5 py-10 animate-in fade-in duration-500">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'var(--ckb-green-dim)', border: '2px solid rgba(0,212,170,0.3)', boxShadow: '0 0 32px rgba(0,212,170,0.15)' }}
            >
              <Bot size={28} style={{ color: 'var(--ckb-green)' }} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                👋 Welcome to <span style={{ color: 'var(--ckb-green)' }}>DAO Agent</span>
              </h2>
              <p className="text-[13px] max-w-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                Manage your CKB with AI. Try one of the quick actions below, or type a command.
              </p>
            </div>
            {/* Quick action cards */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-sm">
              {QUICK_COMMANDS.slice(0, 3).map(({ label, cmd }) => (
                <button
                  key={cmd}
                  onClick={() => sendMessage(cmd)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-2xl text-[12px] font-semibold transition-all hover:scale-[1.04] hover:shadow-lg"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                >
                  <span className="text-xl">{label.split(' ')[0]}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{label.split(' ').slice(1).join(' ')}</span>
                </button>
              ))}
            </div>
            <button
              onClick={runDemo}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] btn-glow-green transition-all"
              style={{ background: 'var(--ckb-green-dim)', border: '1px solid rgba(0,212,170,0.3)', color: 'var(--ckb-green)' }}
            >
              <PlayCircle size={16} /> Run a quick demo
            </button>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
            style={{ animation: `fadeUp 0.3s ease-out ${Math.min(idx * 0.03, 0.3)}s both` }}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
                style={{
                  background: 'rgba(0,212,170,0.1)',
                  border: '1px solid rgba(0,212,170,0.25)',
                }}
              >
                <Bot size={16} style={{ color: 'var(--ckb-green)' }} />
              </div>
            )}

            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
              {/* Tool badge */}
              {msg.toolCalled && !msg.loading && (
                <div
                  className="text-[10px] font-mono px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm self-start"
                  style={{ background: 'rgba(168,85,247,0.1)', color: 'var(--ckb-purple)', border: '1px solid rgba(168,85,247,0.25)' }}
                >
                  <Zap size={10} />
                  {msg.toolCalled}
                </div>
              )}

              {/* ── User bubble ── */}
              {msg.role === 'user' ? (
                <div
                  className="px-4 py-3 rounded-2xl text-[14px] font-medium shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,212,170,0.9) 0%, rgba(0,180,120,0.95) 100%)',
                    color: '#000',
                    borderBottomRightRadius: '4px',
                    boxShadow: '0 2px 12px rgba(0,212,170,0.25)',
                  }}
                >
                  {msg.content}
                </div>
              ) : (
                /* ── Agent bubble ── */
                <div
                  className="px-4 py-3.5 rounded-2xl text-[14px] leading-relaxed shadow-sm"
                  style={{
                    background: 'rgba(255,255,255,0.035)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderTopLeftRadius: '4px',
                    backdropFilter: 'blur(8px)',
                    boxShadow: msg.streaming
                      ? '0 0 0 1px rgba(0,212,170,0.3), 0 4px 20px rgba(0,0,0,0.25)'
                      : '0 2px 12px rgba(0,0,0,0.25)',
                  }}
                >
                  {msg.loading ? (
                    <ThinkingBubble text={msg.content} />
                  ) : (
                    <AgentResponseCard
                      content={cleanText(msg.content)}
                      streaming={msg.streaming}
                      structured={!msg.streaming}
                    />
                  )}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,212,170,0.8) 0%, rgba(0,160,100,0.9) 100%)',
                }}
              >
                <User size={16} style={{ color: '#000' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── New-messages floating button ──────────────────────────────── */}
      {showNewMsgBtn && (
        <div className="flex justify-center -mt-2 mb-1 pointer-events-none" style={{ position: 'relative', zIndex: 10 }}>
          <button
            onClick={() => scrollToBottom()}
            className="pointer-events-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] font-bold shadow-lg transition-all hover:scale-[1.05] animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              background: 'var(--ckb-purple)',
              color: '#fff',
              boxShadow: '0 4px 18px rgba(168,85,247,0.4)',
            }}
          >
            <ChevronDown size={14} />
            New messages
          </button>
        </div>
      )}

      {/* ── Quick commands ──────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap py-2.5 flex-shrink-0">
        {QUICK_COMMANDS.map(({ label, cmd }) => (
          <button
            key={cmd}
            onClick={() => sendMessage(cmd)}
            disabled={isLoading}
            className="text-[11px] px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-[1.03] font-medium disabled:opacity-40"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Input bar ──────────────────────────────────────────────────── */}
      <div
        className="flex items-end gap-3 p-3 rounded-2xl transition-all focus-within:ring-1 flex-shrink-0"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          boxShadow: isLoading ? '0 0 0 1px rgba(168,85,247,0.3)' : undefined,
        }}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the DAO agent anything… (Enter to send)"
          rows={1}
          disabled={isLoading}
          className="flex-1 resize-none bg-transparent text-[14px] outline-none leading-relaxed px-1 py-1"
          style={{ color: 'var(--text-primary)', maxHeight: '120px' }}
        />
        <button
          onClick={() => { if (input.trim() && !isLoading) sendMessage(input); }}
          disabled={isLoading || !input.trim()}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 disabled:opacity-40"
          style={{
            background:  input.trim() && !isLoading ? 'var(--ckb-green)' : 'var(--bg-base)',
            color:       input.trim() && !isLoading ? '#000' : 'var(--text-muted)',
            boxShadow:   input.trim() && !isLoading ? '0 0 14px rgba(0,212,170,0.35)' : 'none',
          }}
        >
          <Send size={18} className={input.trim() ? 'ml-0.5' : ''} />
        </button>
      </div>
    </div>
  );
}
