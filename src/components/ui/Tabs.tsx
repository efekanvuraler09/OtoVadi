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
}

export function Tabs({ tabs, activeId, onChange }: TabsProps) {
  return (
    <div className="border-b border-border-subtle">
      <div
        className="-mb-px flex gap-6 overflow-x-auto scrollbar-none md:gap-10"
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
              className={`relative flex shrink-0 select-none items-center gap-2 border-b-2 pb-4 pt-2 text-sm font-medium transition-colors md:text-base ${
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted hover:border-border-strong hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
