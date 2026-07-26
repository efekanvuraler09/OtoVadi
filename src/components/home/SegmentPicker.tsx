import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { BodyType, VehicleSegment } from '../../types/vehicle';
import { SEGMENT_OPTIONS, getSegmentsByBodyType } from '../../data/segments';
import { countBySegment, useVehicleStore } from '../../store/useVehicleStore';

const BODY_TYPES: {
  id: BodyType;
  label: string;
}[] = [
  { id: 'sedan', label: 'Sedan' },
  { id: 'suv', label: 'SUV' },
  { id: 'hatchback', label: 'Hatchback' },
  { id: 'pickup', label: 'Pick-up' },
];

export function SegmentPicker() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const setSelectedSegment = useVehicleStore((s) => s.setSelectedSegment);
  const [bodyType, setBodyType] = useState<BodyType>('sedan');

  const segments = getSegmentsByBodyType(bodyType);

  const handleSelect = (segment: VehicleSegment) => {
    setSelectedSegment(segment);
    requestAnimationFrame(() => {
      document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
    });
  };

  return (
    <section id="segment-picker" className="scroll-mt-4 px-4 pt-6 md:px-8 lg:px-12">
      <div className="mb-6 text-left">
        <h2 className="text-xl font-semibold text-foreground md:text-2xl">
          Klasman Seçin
        </h2>
        <p className="mt-1 text-sm text-muted">
          Önce gövde tipi, ardından segment — katalog buna göre listelenir
        </p>
      </div>

      {/* Gövde tipi: Sedan / SUV / Hatchback / Pick-up */}
      <div className="grid grid-cols-2 gap-3">
        {BODY_TYPES.map(({ id, label }) => {
          const active = bodyType === id;
          return (
            <motion.button
              key={id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => setBodyType(id)}
              className={`glass-panel flex min-h-[56px] items-center justify-center rounded-2xl p-4 text-center transition-colors ${
                active ? 'ring-2 ring-accent bg-accent/10' : ''
              }`}
            >
              <span className={`text-base font-semibold ${active ? 'text-accent' : 'text-foreground'}`}>
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Segment Listesi */}
      <p className="mb-3 mt-6 text-left text-xs font-medium uppercase tracking-wider text-muted">
        {bodyType === 'pickup' ? 'Pick-up segmentleri' : `${bodyType.charAt(0).toUpperCase() + bodyType.slice(1)} segmentleri`}
      </p>

      <ul className="flex flex-col gap-2">
        {segments.map((seg, index) => {
          const count = countBySegment(vehicles, seg.id);
          return (
            <motion.li
              key={seg.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <button
                type="button"
                onClick={() => handleSelect(seg.id)}
                className="glass-panel group flex w-full min-h-[64px] items-center gap-4 rounded-2xl px-4 py-3 text-left active:bg-white/5"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-lg font-bold text-accent">
                  {seg.classLetter}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{seg.label}</p>
                  <p className="mt-0.5 text-xs text-muted line-clamp-1">{seg.description}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-lg px-2 py-1 text-[10px] font-medium ${
                      count > 0 ? 'bg-accent/15 text-accent' : 'bg-white/5 text-muted'
                    }`}
                  >
                    {count > 0 ? `${count} araç` : 'Yakında'}
                  </span>
                  <ChevronRight className="size-4 text-muted transition-transform group-active:translate-x-0.5" />
                </div>
              </button>
            </motion.li>
          );
        })}
      </ul>

      <p className="mt-4 text-center text-[10px] text-muted">
        Toplam {SEGMENT_OPTIONS.length} klasman · {vehicles.length} araç kayıtlı
      </p>
    </section>
  );
}
