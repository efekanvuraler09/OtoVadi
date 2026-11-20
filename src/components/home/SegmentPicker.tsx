import { useState, type ReactNode } from 'react';
import { m } from 'framer-motion';
import { ArrowRight, ChevronRight, LayoutGrid } from 'lucide-react';
import type { BodyType, VehicleSegment } from '../../types/vehicle';
import { getSegmentsByBodyType } from '../../data/segments';
import { countBySegment, useVehicleStore } from '../../store/useVehicleStore';
import { countByBodyType } from '../../lib/catalogStats';
import { useI18n } from '../../i18n/useI18n';
import { TRANSITION, fadeUp, staggerDelay } from '../../lib/motion';

const BODY_TYPES: BodyType[] = ['sedan', 'suv', 'hatchback', 'pickup', 'muscle-car'];

/**
 * Gövde tipi kutucukları (yalnızca tipografi + gerçek araç sayısı; araç çizimi yok) ve seçili tipin segmentleri.
 * İçinde araç olmayan gövde tipleri ve segmentler hiç gösterilmez ("YAKINDA" satırı yok).
 */
export function SegmentPicker() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const setSelectedCategory = useVehicleStore((s) => s.setSelectedCategory);
  const { t, locale } = useI18n();
  const [chosen, setChosen] = useState<BodyType | null>(null);

  const available = BODY_TYPES.map((id) => ({ id, count: countByBodyType(vehicles, id) })).filter((b) => b.count > 0);
  const bodyType = available.find((b) => b.id === chosen)?.id ?? available[0]?.id ?? null;

  const vehiclesLabel = (count: number) => `${count} ${t.catalog.vehicles.toLocaleLowerCase(locale)}`;

  const select = (type: BodyType, segment: VehicleSegment | null) => {
    setSelectedCategory(type, segment);
    requestAnimationFrame(() => {
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  if (isLoading && vehicles.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-hidden>
        {BODY_TYPES.map((id) => (
          <div key={id} className="shimmer h-36" />
        ))}
      </div>
    );
  }

  if (!bodyType) return null;

  const segments = getSegmentsByBodyType(bodyType)
    .map((seg) => ({ seg, count: countBySegment(vehicles, seg.segment, seg.bodyType) }))
    .filter((item) => item.count > 0);
  // Tek ve genel ("-") segmentli tiplerde (pick-up, muscle) "Tümü" satırı aynı listeyi tekrarlardı
  const showAllRow = !(segments.length === 1 && segments[0].seg.segment === '-');
  const typeLabel = t.catalog.bodyTypes[bodyType];

  return (
    <div id="segment-picker" className="scroll-mt-20">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {available.map(({ id, count }, index) => {
          const active = id === bodyType;
          return (
            <m.button
              key={id}
              type="button"
              {...fadeUp}
              transition={{ ...TRANSITION.base, delay: staggerDelay(index) }}
              onClick={() => setChosen(id)}
              aria-pressed={active}
              // Yalnızca tipografi: ince kenarlık, hover'da kenarlık koyulaşır ve alt çizgi soldan sağa uzanır
              className={`group relative flex min-h-[8.5rem] flex-col justify-between gap-6 overflow-hidden border p-5 text-left transition-colors duration-350 md:min-h-[9.5rem] md:p-6 ${
                active ? 'border-foreground bg-surface' : 'border-border-subtle hover:border-border-strong'
              }`}
            >
              <span className="font-display text-2xl font-normal leading-tight text-foreground md:text-[1.75rem]">
                {t.catalog.bodyTypes[id]}
              </span>
              <span className="flex w-full items-center justify-between gap-2">
                <span className="stat-label">{vehiclesLabel(count)}</span>
                <ArrowRight
                  className={`size-4 transition-all duration-350 ${
                    active ? 'translate-x-0 text-foreground opacity-100' : '-translate-x-1 text-muted opacity-0 group-hover:translate-x-0 group-hover:opacity-100'
                  }`}
                  strokeWidth={1.5}
                  aria-hidden
                />
              </span>
              <span
                aria-hidden
                className={`absolute bottom-0 left-0 h-px bg-foreground transition-all duration-550 ${active ? 'w-full' : 'w-0 group-hover:w-full'}`}
              />
            </m.button>
          );
        })}
      </div>

      <p className="eyebrow mb-2 mt-10">{t.catalog.segmentsTitle.replace('{type}', typeLabel.toLocaleUpperCase(locale))}</p>

      <ul className="flex flex-col border-t border-border-subtle">
        {showAllRow && (
          <li>
            <SegmentRow
              letter={<LayoutGrid className="size-4" strokeWidth={1.5} aria-hidden />}
              label={t.home.allOfType.replace('{type}', typeLabel)}
              meta={vehiclesLabel(countByBodyType(vehicles, bodyType))}
              onClick={() => select(bodyType, null)}
            />
          </li>
        )}
        {segments.map(({ seg, count }, index) => {
          const segKey = `${seg.segment}-${seg.bodyType}` as keyof typeof t.catalog.segments;
          const descKey = `${seg.segment}-${seg.bodyType}-desc` as keyof typeof t.catalog.segments;
          return (
            <m.li key={segKey} {...fadeUp} transition={{ ...TRANSITION.base, delay: staggerDelay(index + 1) }}>
              <SegmentRow
                letter={seg.classLetter}
                label={t.catalog.segments[segKey] || seg.label}
                description={t.catalog.segments[descKey] || seg.description}
                meta={vehiclesLabel(count)}
                onClick={() => select(seg.bodyType, seg.segment)}
              />
            </m.li>
          );
        })}
      </ul>
    </div>
  );
}

interface SegmentRowProps {
  letter: ReactNode;
  label: string;
  description?: string;
  meta: string;
  onClick: () => void;
}

function SegmentRow({ letter, label, description, meta, onClick }: SegmentRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[4.5rem] w-full items-center gap-4 border-b border-border-subtle px-1 py-3 text-left transition-colors hover:bg-surface md:gap-6 md:px-2"
    >
      <span className="flex size-10 shrink-0 items-center justify-center bg-surface-elevated font-display text-base text-foreground">
        {letter}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-lg font-normal text-foreground">{label}</span>
        {description && <span className="mt-0.5 block truncate text-sm text-muted">{description}</span>}
      </span>
      <span className="flex shrink-0 items-center gap-3">
        <span className="text-xs tabular-nums text-muted">{meta}</span>
        <ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden />
      </span>
    </button>
  );
}
