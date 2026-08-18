import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { BodyType } from '../../types/vehicle';
import { getSegmentsByBodyType } from '../../data/segments';
import { countBySegment, useVehicleStore } from '../../store/useVehicleStore';
import type { SegmentOption } from '../../data/segments';
import { useI18n } from '../../i18n/useI18n';

const BODY_TYPES: {
  id: BodyType;
  label: string;
}[] = [
  { id: 'sedan', label: 'Sedan' },
  { id: 'suv', label: 'SUV' },
  { id: 'hatchback', label: 'Hatchback' },
  { id: 'pickup', label: 'Pick-up' },
  { id: 'muscle-car', label: 'Muscle Cars' },
];

export function SegmentPicker() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const setSelectedCategory = useVehicleStore((s) => s.setSelectedCategory);
  const [bodyType, setBodyType] = useState<BodyType>('sedan');

  const { t } = useI18n();

  const segments = getSegmentsByBodyType(bodyType);

  const handleSelect = (seg: SegmentOption) => {
    setSelectedCategory(seg.bodyType, seg.segment);
    requestAnimationFrame(() => {
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  return (
    <section id="segment-picker" className="scroll-mt-4 px-4 pt-16 pb-16 md:px-8 lg:px-12 mx-auto max-w-7xl">
      <div className="mb-12 text-left">
        <h2 className="font-display text-2xl md:text-3xl font-light tracking-wide text-foreground">
          {t.catalog.selectClass}
        </h2>
        <p className="mt-2 font-display text-base md:text-lg font-light tracking-wide text-muted">
          {t.catalog.classSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:flex md:flex-wrap">
        {BODY_TYPES.map(({ id }) => {
          const active = bodyType === id;
          const label = t.catalog.bodyTypes[id as keyof typeof t.catalog.bodyTypes];
          return (
            <motion.button
              key={id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setBodyType(id)}
              className={`flex h-14 items-center justify-center rounded-none border px-8 font-display text-sm md:text-base font-light uppercase tracking-widest transition-all duration-300 md:flex-1 ${
                active
                  ? 'border-foreground bg-foreground text-void'
                  : 'border-neutral-200 dark:border-neutral-800 bg-transparent text-foreground hover:bg-foreground hover:text-void'
              }`}
            >
              {label}
            </motion.button>
          );
        })}
      </div>

      <p className="mb-6 mt-12 text-left font-display text-xs uppercase tracking-widest text-muted">
        {t.catalog.segmentsTitle.replace('{type}', t.catalog.bodyTypes[bodyType].toUpperCase())}
      </p>

      <ul className="flex flex-col">
        {segments.map((seg, index) => {
          const count = countBySegment(vehicles, seg.segment, seg.bodyType);
          const segKey = `${seg.segment}-${seg.bodyType}` as keyof typeof t.catalog.segments;
          const descKey = `${seg.segment}-${seg.bodyType}-desc` as keyof typeof t.catalog.segments;
          const label = t.catalog.segments[segKey] || seg.label;
          const description = t.catalog.segments[descKey] || seg.description;
          
          return (
            <motion.li
              key={seg.segment + seg.bodyType}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <button
                type="button"
                onClick={() => handleSelect(seg)}
                className="group flex w-full min-h-[80px] items-center gap-6 border-b border-neutral-200 dark:border-neutral-800 bg-transparent px-2 py-4 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-foreground/10 text-lg font-light text-foreground">
                  {seg.classLetter}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl font-light text-foreground">{label}</p>
                  <p className="mt-1 font-display text-sm font-light tracking-wide text-muted line-clamp-1">{description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <span className="font-display text-xs md:text-sm font-light uppercase tracking-widest text-muted">
                    {count > 0 ? `${count} ${t.catalog.vehicles.toLowerCase()}` : t.catalog.comingSoon}
                  </span>
                  <ChevronRight className="size-4 text-muted transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <p className="mt-8 text-center font-display text-xs md:text-sm font-light uppercase tracking-widest text-muted">
        {t.catalog.footerStats
          .replace('{classes}', new Set(vehicles.map(v => v.bodyType)).size.toString())
          .replace('{vehicles}', vehicles.length.toString())}
      </p>
    </section>
  );
}
