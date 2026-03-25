'use client';

import { useCallback } from 'react';
import { MessageSquare, Database, Activity, Focus, Expand } from 'lucide-react';
import { useAppStore } from '@/store';

type View = 'chat' | 'dao' | 'scheduler' | 'activity';

const TABS: { id: View; label: string; icon: React.ElementType; order: number }[] = [
  { id: 'chat',     label: 'Chat',     icon: MessageSquare, order: 0 },
  { id: 'dao',      label: 'DAO',      icon: Database,      order: 1 },
  { id: 'activity', label: 'Activity', icon: Activity,      order: 2 },
];

const TAB_ORDER: Record<View, number> = { chat: 0, dao: 1, activity: 2, scheduler: 3 };

export function TopNav() {
  const activeView        = useAppStore((s) => s.activeView);
  const setActiveView     = useAppStore((s) => s.setActiveView);
  const focusMode         = useAppStore((s) => s.focusMode);
  const setFocusMode      = useAppStore((s) => s.setFocusMode);
  const activityBadge     = useAppStore((s) => s.activityBadge);
  const clearActivityBadge = useAppStore((s) => s.clearActivityBadge);

  const handleTabClick = useCallback((id: View) => {
    setActiveView(id);
    if (id === 'activity') clearActivityBadge();
  }, [setActiveView, clearActivityBadge]);

  const currentOrder = TAB_ORDER[activeView] ?? 0;

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 border-b relative"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        height: 52,
      }}
    >
      {/* Tab bar */}
      <nav className="flex items-stretch h-full gap-1">
        {TABS.map(({ id, label, icon: Icon, order }) => {
          const active = activeView === id;
          const isActivity = id === 'activity';
          const hasBadge = isActivity && activityBadge > 0;

          return (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => handleTabClick(id)}
              className={`top-tab relative flex items-center gap-2 px-4 text-[13px] font-semibold h-full transition-colors duration-200 ${
                active ? 'active' : ''
              }`}
              style={{
                color: active ? 'var(--ckb-green)' : 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              data-order={order}
              data-current-order={currentOrder}
            >
              <Icon size={15} />
              {label}

              {/* Activity badge */}
              {hasBadge && (
                <span
                  key={activityBadge} /* re-trigger animation on count change */
                  className="badge-pop absolute -top-0.5 right-2 min-w-[17px] h-[17px] flex items-center justify-center rounded-full text-[9px] font-black"
                  style={{
                    background: 'var(--ckb-green)',
                    color: '#000',
                    boxShadow: '0 0 8px rgba(0,212,170,0.6)',
                    padding: '0 4px',
                  }}
                >
                  {activityBadge > 9 ? '9+' : activityBadge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: Focus Mode toggle */}
      <button
        onClick={() => setFocusMode(!focusMode)}
        className="focus-pill flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[12px] font-bold border"
        style={{
          background:   focusMode ? 'rgba(0,212,170,0.08)' : 'var(--bg-base)',
          borderColor:  focusMode ? 'rgba(0,212,170,0.35)' : 'var(--border)',
          color:        focusMode ? 'var(--ckb-green)'      : 'var(--text-muted)',
          boxShadow:    focusMode ? '0 0 14px rgba(0,212,170,0.12)' : 'none',
        }}
        title={focusMode ? 'Switch to expanded layout' : 'Switch to focus mode'}
      >
        {focusMode ? <Focus size={14} /> : <Expand size={14} />}
        {focusMode ? 'Focus Mode' : 'Expand'}
      </button>
    </header>
  );
}
