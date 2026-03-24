'use client';

import { useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle, ExternalLink, Copy, Check, TrendingUp, Database, Wallet } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ─── Tiny primitives ──────────────────────────────────────────────────────────

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div
        className="text-[11px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5"
        style={{ color: 'var(--ckb-green)' }}
      >
        {title}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

export function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1 border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
      <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        className={`text-[13px] font-semibold text-right ${mono ? 'font-mono' : ''}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
    </div>
  );
}

export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--text-primary)' }}>
      <span style={{ color: 'var(--ckb-green)', marginTop: '2px', flexShrink: 0 }}>▸</span>
      <span>{children}</span>
    </div>
  );
}

export function StatusBadge({ type, children }: { type: 'success' | 'error' | 'warning' | 'info'; children: React.ReactNode }) {
  const configs = {
    success: { icon: CheckCircle,    color: 'var(--ckb-green)',  bg: 'var(--ckb-green-dim)',  border: 'rgba(0,212,170,0.25)' },
    error:   { icon: AlertTriangle,  color: 'var(--danger)',     bg: 'rgba(255,60,60,0.1)',   border: 'rgba(255,60,60,0.25)' },
    warning: { icon: AlertTriangle,  color: 'var(--ckb-orange)', bg: 'var(--ckb-orange-dim)', border: 'rgba(255,140,0,0.25)' },
    info:    { icon: TrendingUp,      color: 'var(--ckb-blue)',   bg: 'var(--ckb-blue-dim)',   border: 'rgba(0,180,255,0.25)' },
  };
  const cfg = configs[type];
  const Icon = cfg.icon;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold mt-2"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
    >
      <Icon size={13} />
      {children}
    </div>
  );
}

// ─── TX Receipt ───────────────────────────────────────────────────────────────

function TxHashLine({ hash }: { hash: string }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(hash).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [hash]);
  return (
    <div
      className="mt-2 p-2.5 rounded-xl flex items-center justify-between gap-2"
      style={{ background: 'var(--ckb-green-dim)', border: '1px solid rgba(0,212,170,0.2)' }}
    >
      <a
        href={`https://pudge.explorer.nervos.org/transaction/${hash}`}
        target="_blank" rel="noopener noreferrer"
        className="text-[11px] font-mono flex items-center gap-1.5 hover:opacity-75 transition-opacity"
        style={{ color: 'var(--ckb-green)' }}
      >
        <ExternalLink size={11} />
        {hash.slice(0, 18)}…{hash.slice(-10)}
      </a>
      <button
        onClick={copy}
        className="flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase transition-colors"
        style={{ background: '#0b0b0b', borderColor: 'rgba(0,212,170,0.3)', color: 'var(--ckb-green)' }}
      >
        {copied ? <Check size={9} /> : <Copy size={9} />}
        {copied ? 'OK' : 'Copy'}
      </button>
    </div>
  );
}

// ─── Response block types ─────────────────────────────────────────────────────

type Block =
  | { kind: 'section'; title: string; rows: { label: string; value: string }[] }
  | { kind: 'bullets'; title: string; items: string[] }
  | { kind: 'status'; type: 'success' | 'error' | 'warning' | 'info'; text: string }
  | { kind: 'txhash'; hash: string }
  | { kind: 'markdown'; text: string };

// ─── Response router ──────────────────────────────────────────────────────────

function buildResponseBlocks(text: string): Block[] {
  if (!text) return [];

  // ── Detect balance responses ──────────────────────────────
  const balanceMatch = text.match(/balance[^0-9]*([0-9,.]+)\s*CKB/i);
  const daoMatch     = text.match(/(\d+)\s*DAO\s*(cells?|deposits?)/i);
  const noWithdraw   = /no cells? (?:currently )?in the withdrawing/i.test(text);
  const isBalance    = !!(balanceMatch || daoMatch);

  if (isBalance) {
    const blocks: Block[] = [];
    const rows: { label: string; value: string }[] = [];
    if (balanceMatch) rows.push({ label: 'Total Balance', value: `${balanceMatch[1]} CKB` });
    if (daoMatch) rows.push({ label: 'DAO Deposits', value: `${daoMatch[1]} Active` });
    if (noWithdraw) rows.push({ label: 'Withdrawals', value: 'None in progress' });
    if (rows.length > 0) blocks.push({ kind: 'section', title: '💰 Wallet Summary', rows });
    if (noWithdraw) blocks.push({ kind: 'status', type: 'success', text: 'Everything looks healthy' });
    return blocks;
  }

  // ── Detect deposit / transaction confirmations ────────────
  const txHashMatch = text.match(/0x[0-9a-f]{60,}/i);
  const amountMatch = text.match(/(?:deposited?|transferred?|sent?)[^0-9]*([0-9,.]+)\s*CKB/i) ??
                      text.match(/([0-9,.]+)\s*CKB[^.]*(?:deposit|transfer)/i);
  const addressMatch = text.match(/ckt1[a-z0-9]{40,}/i);
  const isDeposit   = txHashMatch && (amountMatch || /deposit|transfer/i.test(text));

  if (isDeposit) {
    const blocks: Block[] = [];
    const rows: { label: string; value: string }[] = [];
    if (amountMatch) rows.push({ label: 'Amount Deposited', value: `${amountMatch[1]} CKB` });
    if (addressMatch) rows.push({ label: 'To Address', value: `${addressMatch[0].slice(0, 18)}…` });
    if (rows.length > 0) blocks.push({ kind: 'section', title: '🏦 Transaction Receipt', rows });
    if (txHashMatch) blocks.push({ kind: 'txhash', hash: txHashMatch[0] });
    blocks.push({ kind: 'status', type: 'success', text: 'Deposit confirmed on Nervos CKB' });
    return blocks;
  }

  // ── Detect DAO cells list ─────────────────────────────────
  const hasDeposits = (text.match(/Deposit \d+/g)?.length ?? 0) >= 2;
  const capacities  = Array.from(text.matchAll(/Capacity[:\s]+([0-9,.]+)\s*CKB/gi));
  const hashes      = Array.from(text.matchAll(/Transaction Hash[:\s]+(0x[0-9a-f]{60,})/gi));

  if (hasDeposits && capacities.length > 0) {
    const blocks: Block[] = [];
    const rows: { label: string; value: string }[] = capacities.map((m, i) => ({
      label: `Deposit ${i + 1}`,
      value: `${m[1]} CKB`,
    }));
    blocks.push({ kind: 'section', title: '📊 DAO Deposits', rows });
    if (hashes.length > 0) {
      blocks.push({ kind: 'bullets', title: 'All deposits status', items: hashes.map((_, i) => `Deposit ${i + 1} is active → Deposited`) });
    }
    blocks.push({ kind: 'status', type: 'info', text: `${capacities.length} active DAO deposits found` });
    return blocks;
  }

  // ── Detect epoch info ─────────────────────────────────────
  const epochMatch = text.match(/(?:current )?epoch[^\d]*(\d{3,})/i);
  const indexMatch = text.match(/epoch index[^\d]*(\d+)/i);
  const blocksMatch = text.match(/(\d{3,})\s*blocks? remaining/i);

  if (epochMatch) {
    const rows: { label: string; value: string }[] = [];
    rows.push({ label: 'Current Epoch', value: `#${epochMatch[1]}` });
    if (indexMatch) rows.push({ label: 'Epoch Index', value: indexMatch[1] });
    if (blocksMatch) rows.push({ label: 'Blocks Remaining', value: blocksMatch[1] });
    return [
      { kind: 'section', title: '⏱️ Epoch Status', rows },
      { kind: 'status', type: 'info', text: 'CKB epoch data fetched live' },
    ];
  }

  // ── Detect auto-harvest / schedule messages ───────────────
  if (/auto.harvest|schedule.harvest|enabled.*epoch/i.test(text)) {
    const thresholdMatch = text.match(/(\d+)\s*epochs?/i);
    return [
      { kind: 'section', title: '🤖 Automation Configured', rows: [
        { label: 'Mode', value: 'Auto-harvest' },
        ...(thresholdMatch ? [{ label: 'Trigger Threshold', value: `${thresholdMatch[1]} epochs` }] : []),
        { label: 'Status', value: 'Active' },
      ]},
      { kind: 'status', type: 'success', text: 'Auto-harvest enabled successfully' },
    ];
  }

  // ── Detect AI Insight messages ───────────────
  if (text.includes('**AI Insight:**')) {
    const blocks: Block[] = [];
    const insightText = text.match(/\*\*AI Insight:\*\*\s*([^\n]+)/)?.[1];
    if (insightText) {
      blocks.push({ kind: 'status', type: 'info', text: `🤖 ${insightText}` });
    }

    if (text.includes('Withdrawal Initiated')) {
      const amountMatch = text.match(/Amount:\s*\*\*([0-9,.]+)\s*CKB\*\*/i);
      const txMatch = text.match(/Transaction Hash:\s*(0x[0-9a-fA-F]+)/i);
      
      const rows = [];
      if (amountMatch) rows.push({ label: 'Amount Unlocking', value: `${amountMatch[1]} CKB` });
      blocks.push({ kind: 'section', title: '⏳ Withdrawal Initiated', rows });
      if (txMatch) blocks.push({ kind: 'txhash', hash: txMatch[1] });
      blocks.push({ kind: 'status', type: 'warning', text: 'Awaiting lock period to finish' });
      return blocks;
    }

    if (text.includes('Reinvested Successfully')) {
      const amountMatch = text.match(/Amount compounded:\s*\*\*([0-9,.]+)\s*CKB\*\*/i);
      const txMatch = text.match(/Transaction Hash:\s*(0x[0-9a-fA-F]+)/i);

      const rows = [];
      if (amountMatch) rows.push({ label: 'Amount Compounded', value: `${amountMatch[1]} CKB` });
      blocks.push({ kind: 'section', title: '🔁 Reinvested Successfully', rows });
      if (txMatch) blocks.push({ kind: 'txhash', hash: txMatch[1] });
      blocks.push({ kind: 'status', type: 'success', text: 'Funds are compounding again 🚀' });
      return blocks;
    }
  }

  // ── Detect generic error messages ─────────
  if (/^error:\s*/i.test(text)) {
    return [{ kind: 'status', type: 'error', text: text.replace(/^error:\s*/i, '').trim() }];
  }

  // ── Fallback: rich markdown ───────────────────────────────
  return [{ kind: 'markdown', text }];
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function MdContent({ text, streaming }: { text: string; streaming?: boolean }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none text-[14px] leading-relaxed
      prose-p:my-1.5 prose-ul:my-1 prose-headings:my-1.5
      prose-strong:font-semibold
      prose-code:text-[var(--ckb-green)] prose-code:bg-[var(--bg-base)] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[12px]
      prose-a:text-[var(--ckb-blue)] prose-a:no-underline hover:prose-a:underline">
      <ReactMarkdown
        components={{
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          strong: ({ node, ...props }) => <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }} {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ul: ({ node, ...props }) => <ul className="pl-4 space-y-1 list-disc" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          ol: ({ node, ...props }) => <ol className="pl-4 space-y-1 list-decimal" {...props} />,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          hr: ({ node, ...props }) => <hr className="border-[var(--border)] my-2" {...props} />,
        }}
      >
        {text + (streaming ? ' █' : '')}
      </ReactMarkdown>
    </div>
  );
}

// ─── Main export: render any agent response ───────────────────────────────────

interface AgentResponseCardProps {
  content: string;
  streaming?: boolean;
  /** Use structured block rendering or always fall through to markdown */
  structured?: boolean;
}

export function AgentResponseCard({ content, streaming, structured = true }: AgentResponseCardProps) {
  const blocks = structured ? buildResponseBlocks(content) : [{ kind: 'markdown' as const, text: content }];

  if (blocks.length === 1 && blocks[0].kind === 'markdown') {
    return <MdContent text={blocks[0].text} streaming={streaming} />;
  }

  return (
    <div className="flex flex-col gap-0.5">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'section':
            return (
              <Section key={i} title={block.title}>
                {block.rows.map((r) => (
                  <Row key={r.label} label={r.label} value={r.value} />
                ))}
              </Section>
            );
          case 'bullets':
            return (
              <Section key={i} title={block.title}>
                {block.items.map((item, j) => (
                  <Bullet key={j}>{item}</Bullet>
                ))}
              </Section>
            );
          case 'status':
            return <StatusBadge key={i} type={block.type}>{block.text}</StatusBadge>;
          case 'txhash':
            return <TxHashLine key={i} hash={block.hash} />;
          case 'markdown':
            return <MdContent key={i} text={block.text} streaming={streaming} />;
        }
      })}
      {streaming && blocks[blocks.length - 1]?.kind !== 'markdown' && (
        <span
          className="inline-block w-[2px] h-[14px] rounded-sm ml-0.5"
          style={{ background: 'var(--ckb-green)', animation: 'cursorBlink 1s step-start infinite' }}
        />
      )}
      <style>{`@keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}

// Named re-exports so ChatPanel can use them directly for the Welcome screen
export { Wallet, Database, TrendingUp };
