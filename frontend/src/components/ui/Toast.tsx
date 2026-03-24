'use client';

import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// ─── Global event bus (no Context needed — works across any component) ───────
type ToastListener = (toast: Toast) => void;
const listeners: ToastListener[] = [];

export function toast(type: ToastType, title: string, message?: string, duration = 4000) {
  const t: Toast = { id: `${Date.now()}-${Math.random()}`, type, title, message, duration };
  listeners.forEach((l) => l(t));
}

// Shorthand helpers
toast.success = (title: string, message?: string) => toast('success', title, message);
toast.error   = (title: string, message?: string) => toast('error',   title, message, 6000);
toast.info    = (title: string, message?: string) => toast('info',    title, message);
toast.warning = (title: string, message?: string) => toast('warning', title, message);

// ─── Config per type ─────────────────────────────────────────────────────────
const CONFIG: Record<ToastType, { icon: typeof CheckCircle; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle,   color: 'var(--ckb-green)',  bg: 'var(--ckb-green-dim)',    border: 'rgba(0,212,170,0.3)'  },
  error:   { icon: XCircle,       color: 'var(--danger)',     bg: 'rgba(255,60,60,0.1)',      border: 'rgba(255,60,60,0.3)'  },
  info:    { icon: Info,          color: 'var(--ckb-blue)',   bg: 'var(--ckb-blue-dim)',      border: 'rgba(0,180,255,0.3)'  },
  warning: { icon: AlertTriangle, color: 'var(--ckb-orange)', bg: 'var(--ckb-orange-dim)',   border: 'rgba(255,165,0,0.3)'  },
};

// ─── Single toast card ───────────────────────────────────────────────────────
function ToastCard({ toast: t, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const cfg = CONFIG[t.type];
  const Icon = cfg.icon;

  useEffect(() => {
    // Animate in
    const showTimer = requestAnimationFrame(() => setVisible(true));
    // Auto-dismiss
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(t.id), 300);
    }, t.duration ?? 4000);

    return () => {
      cancelAnimationFrame(showTimer);
      clearTimeout(hideTimer);
    };
  }, [t.id, t.duration, onDismiss]);

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-sm transition-all duration-300 cursor-pointer max-w-xs w-full"
      style={{
        background: 'rgba(12,12,14,0.95)',
        border: `1px solid ${cfg.border}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${cfg.border}`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(24px)',
      }}
      onClick={() => {
        setVisible(false);
        setTimeout(() => onDismiss(t.id), 300);
      }}
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
      >
        <Icon size={15} style={{ color: cfg.color }} />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[13px] font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>
          {t.title}
        </div>
        {t.message && (
          <div className="text-[11px] mt-0.5 leading-snug opacity-70" style={{ color: 'var(--text-muted)' }}>
            {t.message}
          </div>
        )}
      </div>
      <button className="opacity-40 hover:opacity-70 transition-opacity flex-shrink-0 mt-0.5">
        <X size={13} style={{ color: 'var(--text-muted)' }} />
      </button>
    </div>
  );
}

// ─── Toast Container — mount once in layout/page ─────────────────────────────
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((t: Toast) => setToasts((prev) => [...prev, t]), []);
  const remove = useCallback((id: string) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  useEffect(() => {
    listeners.push(add);
    return () => {
      const idx = listeners.indexOf(add);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, [add]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 flex flex-col gap-2 z-[9999]"
      style={{ pointerEvents: 'none' }}
    >
      {toasts.map((t) => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <ToastCard toast={t} onDismiss={remove} />
        </div>
      ))}
    </div>
  );
}
