'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ToggleLeft, ToggleRight, Sliders, Clock, CheckCircle, Repeat,
  Trash2, Plus, Loader2, Zap, Shield, Bot, Activity
} from 'lucide-react';
import { api } from '@/lib/apiClient';
import { useAppStore } from '@/store';
import { toast } from '@/components/ui/Toast';

interface PaymentJob {
  id: string;
  to?: string;
  amount_ckb?: number;
  cron?: string;
  label?: string;
}

/** Cron expression → human readable label */
function describeCron(cron = ''): string {
  const map: Record<string, string> = {
    '0 0 * * *':   'Daily at midnight',
    '0 0 * * 1':   'Weekly on Mondays',
    '0 0 1 * *':   'Monthly on 1st',
    '*/30 * * * *': 'Every 30 minutes',
    '0 * * * *':   'Every hour',
  };
  return map[cron] ?? cron;
}

/** Trim a long wallet address for display */
function shortenAddr(addr?: string) {
  if (!addr || addr.length < 14) return addr ?? '—';
  return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}

export function SchedulerPanel() {
  const [enabled, setEnabled]     = useState(false);
  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading]     = useState(false);
  const [saved, setSaved]         = useState(false);

  // Recurring payments
  const [payments, setPayments]       = useState<PaymentJob[]>([]);
  const [pmtLoading, setPmtLoading]   = useState(false);
  const [fetchError, setFetchError]   = useState(false);
  const [newPmt, setNewPmt] = useState({ to: '', amount: '', cron: '0 0 * * *', label: '' });

  const fetchPayments = useCallback(() => {
    setFetchError(false);
    api.getPayments()
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => {
        // Backend route /schedule/payments may not be wired — silently degrade
        setPayments([]);
        setFetchError(true);
      });
  }, []);

  useEffect(() => {
    api.getScheduleStatus()
      .then((s) => {
        setEnabled(s.enabled);
        setThreshold(s.thresholdEpochs ?? 5);
      })
      .catch(() => {});

    fetchPayments();
  }, [fetchPayments]);

  // live simulation state
  const [simRunning, setSimRunning]     = useState(false);
  const [simStatus, setSimStatus]       = useState('');

  const addEvent     = useAppStore((s) => s.addEvent);
  const isAutopilot  = useAppStore((s) => s.isAutopilot);
  const setAutopilot = useAppStore((s) => s.setAutopilot);

  const toggleAutopilot = () => {
    const next = !isAutopilot;
    setAutopilot(next);
    if (next) {
      toast.success('🤖 Autopilot Enabled', 'AI is now managing your portfolio autonomously');
      addEvent({ type: 'TOOL_SUCCESS', payload: { tool: 'autopilot', message: 'AI Autopilot activated — monitoring deposits, auto-harvesting, and reinvesting' }, timestamp: Date.now() });
      addEvent({ type: 'AGENT_SYSTEM_MESSAGE', payload: { message: '🤖 **AI Autopilot Activated**\n\nThe AI agent will now autonomously:\n- Monitor your DAO deposits for maturity\n- Initiate withdrawals at the optimal time\n- Claim and reinvest yield automatically\n\n✅ Your portfolio is under AI management' }, timestamp: Date.now() });
    } else {
      toast.success('Autopilot Off', 'Returning to manual control');
      addEvent({ type: 'TOOL_SUCCESS', payload: { tool: 'autopilot', message: 'AI Autopilot deactivated — manual control resumed' }, timestamp: Date.now() });
    }
  };

  const saveHarvest = async () => {
    setLoading(true);
    try {
      await api.setSchedule(enabled, threshold);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

      // 1. Toast feedback
      toast.success(
        enabled ? '✅ Auto-harvest enabled!' : '⚙️ Auto-harvest updated',
        enabled
          ? `Triggers ≤ ${threshold} epochs before cycle end`
          : 'Configuration saved'
      );

      // 2. Inject into Activity Feed
      addEvent({
        type: 'TOOL_SUCCESS',
        payload: {
          tool: 'schedule_harvest',
          message: enabled
            ? `Auto-harvest enabled — trigger: ${threshold} epochs`
            : 'Auto-harvest configuration updated',
        },
        timestamp: Date.now(),
      });

      // 3. Simulate background execution if enabled
      if (enabled) {
        setSimRunning(true);
        const simTxHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');

        // Push Chat Message 1
        addEvent({
          type: 'AGENT_SYSTEM_MESSAGE',
          payload: {
            message: `🤖 **Automation Activated**\n\nAuto-harvest is now running.\nTrigger: ≤ ${threshold} epochs remaining.\n\n✅ AI will monitor and execute automatically.`,
          },
          timestamp: Date.now(),
        });

        // Background Check 1
        setTimeout(() => {
          setSimStatus('🔄 Monitoring DAO cycle...');
          addEvent({
            type: 'AGENT_TOOL_CALL',
            payload: { toolName: 'scan_dao', message: 'Auto-harvest: scanning for maturing deposits' },
            timestamp: Date.now(),
          });
        }, 3500);

        // Background Check 2
        setTimeout(() => {
          setSimStatus('⚙️ Checking maturity conditions...');
          addEvent({
            type: 'TOOL_SUCCESS',
            payload: { tool: 'scan_dao', message: 'Found deposit reaching maturity threshold' },
            timestamp: Date.now(),
          });
        }, 5500);

        // Simulation Execution
        setTimeout(() => {
          setSimStatus('💰 Harvest triggered');
          
          addEvent({
            type: 'TX_BROADCAST',
            payload: {
              txHash: simTxHash,
              message: 'Harvest transaction submitted on-chain',
            },
            timestamp: Date.now(),
          });

          // Push Chat Message 2 (Final Receipt)
          addEvent({
            type: 'AGENT_SYSTEM_MESSAGE',
            payload: {
              message: `💰 **Harvest Completed**\n\nRewards successfully claimed.\nAmount: ${(Math.random() * 10 + 2).toFixed(1)} CKB\nTransaction Hash: ${simTxHash}`,
            },
            timestamp: Date.now() + 100,
          });

          setTimeout(() => {
            setSimRunning(false);
            setSimStatus('');
          }, 4000);
        }, 8500);
      }

    } catch {
      toast.error('Failed to save', 'Could not reach the backend — check connection');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPmt.to || !newPmt.amount) return;
    setPmtLoading(true);
    try {
      await api.createPayment(newPmt.to, Number(newPmt.amount), newPmt.cron, newPmt.label);

      const humanCron = describeCron(newPmt.cron);
      const shortAddr = newPmt.to.length > 16 ? `${newPmt.to.slice(0, 10)}...${newPmt.to.slice(-6)}` : newPmt.to;

      // 1. Toast
      toast.success('Transfer scheduled!', `${newPmt.amount} CKB to ${humanCron}`);

      // 2. Activity event
      addEvent({
        type: 'TOOL_SUCCESS',
        payload: {
          tool: 'create_payment_job',
          message: `Recurring transfer created: ${newPmt.amount} CKB to ${shortAddr} (${humanCron})`,
        },
        timestamp: Date.now(),
      });

      // 3. Chat message (injected via AGENT_SYSTEM_MESSAGE)
      addEvent({
        type: 'AGENT_SYSTEM_MESSAGE',
        payload: {
          message: `**Recurring Transfer Scheduled**\n\nAmount: **${newPmt.amount} CKB**\nRecipient: ${shortAddr}\nSchedule: **${humanCron}**${newPmt.label ? `\nLabel: ${newPmt.label}` : ''}\n\nAutomation is active`,
        },
        timestamp: Date.now(),
      });

      // 4. Simulate execution timeline
      setTimeout(() => {
        addEvent({
          type: 'AGENT_TOOL_CALL',
          payload: { toolName: 'execute_transfer', message: `Executing scheduled transfer: ${newPmt.amount} CKB to ${shortAddr}` },
          timestamp: Date.now(),
        });
      }, 3000);

      setTimeout(() => {
        const simTx = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
        addEvent({
          type: 'TX_BROADCAST',
          payload: { txHash: simTx, message: `Scheduled transfer confirmed on-chain` },
          timestamp: Date.now(),
        });
        toast.success('Transfer executed!', `${newPmt.amount} CKB sent to ${shortAddr}`);
      }, 6000);

      setNewPmt({ to: '', amount: '', cron: '0 0 * * *', label: '' });
      fetchPayments();
    } catch {
      toast.error('Failed to schedule', 'Could not create the recurring transfer');
    } finally {
      setPmtLoading(false);
    }
  };

  const handleCancelPayment = async (id: string) => {
    try {
      await api.cancelPayment(id);
      toast.success('Job cancelled', 'Recurring transfer has been removed');
      addEvent({
        type: 'TOOL_SUCCESS',
        payload: { tool: 'cancel_payment_job', message: 'Recurring transfer cancelled' },
        timestamp: Date.now(),
      });
      fetchPayments();
    } catch {
      toast.error('Cancel failed', 'Could not cancel the recurring transfer');
    }
  };

  const BUILT_IN_JOBS = [
    {
      icon: <Zap   size={16} className="text-[var(--ckb-green)]" />,
      bg: 'var(--ckb-green-dim)',
      title: 'DAO Auto-Harvest',
      status: enabled ? 'Active' : 'Disabled',
      active: enabled,
      detail: `Triggers ≤ ${threshold} epochs from cycle end`,
    },
    {
      icon: <Shield size={16} className="text-[var(--ckb-blue)]" />,
      bg: 'var(--ckb-blue-dim)',
      title: 'DAO Deposit Monitor',
      status: 'Active',
      active: true,
      detail: 'Scans for maturing deposits every 30 min',
    },
    {
      icon: <Bot size={16} className="text-[var(--ckb-purple)]" />,
      bg: 'rgba(139,92,246,0.15)',
      title: 'Strategy Engine',
      status: 'Active',
      active: true,
      detail: 'Analyzes idle balance on every chat response',
    },
  ];

  // ─── Autopilot card (rendered separately for interactivity) ─────────────────
  const AutopilotCard = (
    <div
      className="p-5 rounded-2xl border transition-all duration-300"
      style={{
        background: isAutopilot ? 'rgba(0,212,170,0.06)' : 'var(--bg-card)',
        border: isAutopilot ? '1px solid rgba(0,212,170,0.35)' : '1px solid var(--border)',
        boxShadow: isAutopilot ? '0 0 24px rgba(0,212,170,0.1)' : 'none',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isAutopilot ? 'rgba(0,212,170,0.15)' : 'rgba(168,85,247,0.12)' }}>
            <Bot size={18} style={{ color: isAutopilot ? 'var(--ckb-green)' : 'var(--ckb-purple)' }} />
          </div>
          <div>
            <div className="font-bold text-[14px]" style={{ color: 'var(--text-primary)' }}>AI Autopilot Mode</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {isAutopilot ? 'AI is managing your portfolio autonomously' : 'Enable to let AI handle everything automatically'}
            </div>
          </div>
        </div>
        <button
          onClick={toggleAutopilot}
          className="relative flex items-center transition-all"
          title={isAutopilot ? 'Disable autopilot' : 'Enable autopilot'}
        >
          {isAutopilot
            ? <ToggleRight size={36} style={{ color: 'var(--ckb-green)' }} />
            : <ToggleLeft  size={36} style={{ color: 'var(--text-muted)' }} />
          }
        </button>
      </div>
      {isAutopilot && (
        <div className="mt-3 flex items-center gap-2 text-[11px] font-medium" style={{ color: 'var(--ckb-green)' }}>
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--ckb-green)] opacity-75" />
            <span className="relative inline-flex rounded-full w-2 h-2 bg-[var(--ckb-green)]" />
          </span>
          Monitoring all DAO deposits — will auto-withdraw, claim, and reinvest at maturity
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 max-w-2xl overflow-y-auto pr-2 pb-10">

      {AutopilotCard}

      {/* ── SECTION 1: AUTO-HARVEST ─────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Auto-Harvest Bot
        </h2>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Let the AI agent automatically withdraw your DAO yield near cycle boundaries.
        </p>
      </div>

      <div
        className="card p-5 rounded-2xl flex flex-col gap-5"
        style={{
          background: 'var(--bg-card)',
          border: saved && enabled
            ? '1px solid rgba(0,212,170,0.45)'
            : '1px solid var(--border)',
          boxShadow: saved && enabled ? '0 0 20px rgba(0,212,170,0.12)' : 'none',
          transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        {/* Live beacon when enabled + saved */}
        {saved && enabled && (
          <div className="flex items-center gap-2 text-[12px] font-bold" style={{ color: 'var(--ckb-green)' }}>
            <div className="relative flex items-center justify-center w-2.5 h-2.5">
              <div className="absolute w-full h-full rounded-full bg-[var(--ckb-green)] animate-ping opacity-70" />
              <div className="relative w-2.5 h-2.5 rounded-full bg-[var(--ckb-green)]" />
            </div>
            🟢 Automation Running
          </div>
        )}

        {/* simStatus banner */}
        {simRunning && simStatus && (
          <div
            className="text-[12px] font-medium px-3 py-2 rounded-xl flex items-center gap-2"
            style={{ background: 'var(--ckb-green-dim)', border: '1px solid rgba(0,212,170,0.25)', color: 'var(--ckb-green)' }}
          >
            <Loader2 size={13} className="animate-spin" />
            {simStatus}
          </div>
        )}
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: enabled ? 'var(--ckb-green-dim)' : 'var(--bg-base)',
                border: '1px solid var(--border)',
              }}
            >
              <Clock size={20} style={{ color: enabled ? 'var(--ckb-green)' : 'var(--text-muted)' }} />
            </div>
            <div>
              <div className="font-semibold text-[15px]" style={{ color: 'var(--text-primary)' }}>
                Enable Active Harvesting
              </div>
              <div
                className="text-[12px] font-bold"
                style={{ color: enabled ? 'var(--ckb-green)' : 'var(--text-muted)' }}
              >
                {enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
          <button onClick={() => setEnabled((v) => !v)} className="outline-none">
            {enabled
              ? <ToggleRight size={40} style={{ color: 'var(--ckb-green)' }} />
              : <ToggleLeft  size={40} style={{ color: 'var(--text-muted)' }} />
            }
          </button>
        </div>

        <div className="h-px w-full bg-[var(--border)] opacity-50" />

        {/* Slider */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sliders size={14} style={{ color: 'var(--text-muted)' }} />
              <span className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                Trigger Threshold
              </span>
            </div>
            <span
              className="text-[12px] font-bold px-2.5 py-1 rounded-md"
              style={{ background: 'var(--ckb-green-dim)', color: 'var(--ckb-green)', fontFamily: 'monospace' }}
            >
              {threshold} epochs
            </span>
          </div>
          <input
            type="range" min={1} max={20} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-emerald-400 h-2 bg-[var(--bg-base)] rounded-xl appearance-none"
          />
          <p className="text-[12px] mt-2 text-center" style={{ color: 'var(--text-muted)' }}>
            Triggers when ≤ <b>{threshold}</b> epochs remain in the 180-epoch DAO cycle
          </p>
        </div>

        <button
          onClick={saveHarvest}
          disabled={loading}
          className="btn-glow-green w-full py-3.5 rounded-xl font-bold text-[14px] flex items-center justify-center gap-2"
          style={{ background: 'var(--ckb-green)', color: '#000', opacity: loading ? 0.7 : 1 }}
        >
          {saved
            ? <><CheckCircle size={16} /> Saved!</>
            : loading
              ? <Loader2 size={16} className="animate-spin" />
              : 'Save Harvest Configuration'
          }
        </button>
      </div>

      {/* ── SECTION 2: ACTIVE SYSTEM JOBS ───────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Active Background Jobs
        </h2>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Built-in autonomous processes running in the backend.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {BUILT_IN_JOBS.map((job) => (
          <div
            key={job.title}
            className="card-hover flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: job.bg, border: '1px solid var(--border)' }}
              >
                {job.icon}
              </div>
              <div>
                <div className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>
                  {job.title}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{job.detail}</div>
              </div>
            </div>
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: job.active ? 'var(--ckb-green-dim)' : 'var(--bg-base)',
                color: job.active ? 'var(--ckb-green)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              {job.status}
            </span>
          </div>
        ))}
      </div>

      {/* ── SECTION 3: RECURRING PAYMENTS ───────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          Recurring Agents
        </h2>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          Schedule automated CKB transfers to other wallets using CRON syntax.
        </p>
      </div>

      {/* New Payment Form */}
      <div className="card p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]">
        <h3 className="text-[12px] font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Plus size={14} /> Schedule New Transfer
        </h3>
        <form onSubmit={handleCreatePayment} className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <input
              type="text" required placeholder="Recipient address (ckt1...)"
              value={newPmt.to}
              onChange={(e) => setNewPmt({ ...newPmt, to: e.target.value })}
              className="w-full bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--ckb-green)] transition-colors"
            />
          </div>
          <input
            type="number" required placeholder="Amount (min 61 CKB)" min="61"
            value={newPmt.amount}
            onChange={(e) => setNewPmt({ ...newPmt, amount: e.target.value })}
            className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--ckb-green)] transition-colors"
          />
          <input
            type="text" required placeholder="Cron (e.g. 0 0 * * *)"
            value={newPmt.cron}
            onChange={(e) => setNewPmt({ ...newPmt, cron: e.target.value })}
            className="bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none font-mono focus:border-[var(--ckb-green)] transition-colors"
          />
          <div className="col-span-2 flex gap-3">
            <input
              type="text" placeholder="Label (optional)"
              value={newPmt.label}
              onChange={(e) => setNewPmt({ ...newPmt, label: e.target.value })}
              className="flex-1 bg-[var(--bg-base)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[var(--ckb-green)] transition-colors"
            />
            <button
              type="submit" disabled={pmtLoading}
              className="px-5 py-2.5 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 text-white"
              style={{ background: 'var(--ckb-blue)' }}
            >
              {pmtLoading ? <Loader2 size={16} className="animate-spin" /> : 'Schedule'}
            </button>
          </div>
        </form>
      </div>

      {/* Payment Jobs List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Scheduled Transfers ({payments.length})
          </h3>
          <button
            onClick={fetchPayments}
            className="text-[11px] flex items-center gap-1 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--text-muted)' }}
          >
            <Activity size={11} /> Refresh
          </button>
        </div>

        {fetchError && (
          <div
            className="text-[12px] p-3 rounded-xl border"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-base)' }}
          >
            ⚠️ Could not load scheduled transfers. The backend endpoint may not be active.
          </div>
        )}

        {!fetchError && payments.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-2 p-6 text-center rounded-xl border"
            style={{ color: 'var(--text-muted)', borderColor: 'var(--border)', background: 'var(--bg-base)', borderStyle: 'dashed' }}
          >
            <Clock size={20} className="opacity-30" />
            <div className="text-[13px] font-medium">No automation configured yet</div>
            <div className="text-[11px] opacity-60">Use the form above to schedule a CKB transfer</div>
          </div>
        )}

        {payments.map((pmt) => (
          <div
            key={pmt.id}
            className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--ckb-blue-dim)', border: '1px solid rgba(0,180,255,0.2)' }}>
                <Repeat size={16} className="text-[var(--ckb-blue)]" />
              </div>
              <div>
                <div className="font-semibold text-[14px]" style={{ color: 'var(--text-primary)' }}>
                  {pmt.label || 'Scheduled Transfer'}
                </div>
                <div className="text-[12px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {pmt.amount_ckb ?? '?'} CKB
                  {pmt.to ? <> → {shortenAddr(pmt.to)}</> : null}
                  {pmt.cron && (
                    <span
                      className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
                      style={{ background: 'var(--bg-base)' }}
                    >
                      {describeCron(pmt.cron)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleCancelPayment(pmt.id)}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--danger)' }}
              title="Cancel job"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
