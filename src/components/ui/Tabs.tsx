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
    <div className="border-b border-white/10 overflow-hidden">
      <div
        className="flex gap-6 md:gap-10 overflow-x-auto scrollbar-none px-2 mb-[-1px]"
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
              className={`relative flex shrink-0 items-center gap-2 pb-4 pt-2 text-[10px] md:text-xs uppercase tracking-[0.2em] transition-colors duration-300 border-b ${
                isActive ? 'text-white font-normal border-white/80' : 'text-gray-500 hover:text-gray-400 font-light border-transparent'
              }`}
            >
              <span className="relative z-10 flex items-center gap-2">
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
