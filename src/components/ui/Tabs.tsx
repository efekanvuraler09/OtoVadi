import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  accentColor?: 'blue' | 'red';
}

export function Tabs({ tabs, activeId, onChange, accentColor = 'blue' }: TabsProps) {
  const activeClass =
    accentColor === 'red'
      ? 'bg-accent-red/20 text-accent-red'
      : 'bg-accent/20 text-accent';

  return (
    <div className="glass-panel overflow-hidden rounded-2xl p-1">
      <div
        className="flex gap-1 overflow-x-auto scrollbar-none"
        role="tablist"
        aria-label="Detay sekmeleri"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors ${
                isActive ? activeClass : 'text-muted hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="detail-tab"
                  className="absolute inset-0 rounded-xl bg-white/5"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {tab.icon}
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
