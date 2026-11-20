import { useId, useState, type KeyboardEvent } from 'react';
import { m } from 'framer-motion';
import type { Vehicle } from '../../types/vehicle';
import { resolveCurrency } from '../../utils/formatPrice';
import { FinanceCalculator } from './FinanceCalculator';
import { TcoCalculator } from './TcoCalculator';
import { TRANSITION, fadeUp } from '../../lib/motion';
import type { OwnershipPlan } from '../../lib/finance';

interface OwnershipCostPanelProps {
  vehicle: Vehicle;
  onApply: () => void;
  /** Peşinat / vade / yıllık km — sayfada tutulur, A4 broşür de aynı seçimi basar */
  plan: OwnershipPlan;
  onPlanChange: (patch: Partial<OwnershipPlan>) => void;
}

type PanelTab = 'finance' | 'tco';

const TABS: { id: PanelTab; label: string; title: string }[] = [
  { id: 'finance', label: 'Finansman', title: 'Akıllı Finansman' },
  { id: 'tco', label: '5 Yıllık Maliyet (TCO)', title: '5 Yıllık Sahip Olma Maliyeti' },
];

/**
 * Y2 — Detay sayfasının maliyet paneli: "Finansman" (mevcut kredi hesaplayıcı) ve "5 Yıllık Maliyet (TCO)" sekmeleri.
 * Sekmeler WAI-ARIA tablist deseninde (←/→ ile geçiş).
 */
export function OwnershipCostPanel({ vehicle, onApply, plan, onPlanChange }: OwnershipCostPanelProps) {
  const [tab, setTab] = useState<PanelTab>('finance');
  const baseId = useId();
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const index = TABS.findIndex((t) => t.id === tab);
    const next = TABS[(index + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
    setTab(next.id);
    document.getElementById(`${baseId}-tab-${next.id}`)?.focus();
  };

  return (
    <section className="mt-16 w-full border-t border-border-subtle pb-8 pt-16" aria-labelledby={`${baseId}-title`}>
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-3">Finansman ve Maliyet</p>
          <h2 id={`${baseId}-title`} className="text-display-sm font-normal text-foreground">
            {active.title}
          </h2>
        </div>

        <div
          role="tablist"
          aria-label="Maliyet paneli"
          onKeyDown={onKeyDown}
          className="inline-flex self-start border border-border-subtle p-1 md:self-auto"
        >
          {TABS.map((t) => {
            const selected = t.id === tab;
            return (
              <button
                key={t.id}
                id={`${baseId}-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t.id)}
                className={`min-h-10 px-3 text-xs font-medium uppercase tracking-eyebrow transition-colors md:px-5 ${
                  selected ? 'bg-foreground text-void' : 'text-muted hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <m.div
        key={tab}
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${tab}`}
        {...fadeUp}
        transition={TRANSITION.base}
      >
        {tab === 'finance' ? (
          <FinanceCalculator
            price={vehicle.pricing.msrp}
            currency={resolveCurrency(vehicle.pricing)}
            downPercent={plan.downPercent}
            term={plan.term}
            onDownPercentChange={(downPercent) => onPlanChange({ downPercent })}
            onTermChange={(term) => onPlanChange({ term })}
            onApply={onApply}
          />
        ) : (
          <TcoCalculator
            key={vehicle.id}
            vehicle={vehicle}
            annualKm={plan.annualKm}
            onAnnualKmChange={(annualKm) => onPlanChange({ annualKm })}
          />
        )}
      </m.div>
    </section>
  );
}
