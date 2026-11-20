import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import type { Vehicle, Hotspot } from '../../types/vehicle';
import { SmartImage } from '../ui/SmartImage';
import { vehicleName } from '../../utils/vehicleText';
import { TRANSITION, fadeUp } from '../../lib/motion';

interface InteractiveGalleryProps {
  vehicle: Vehicle;
}

export function InteractiveGallery({ vehicle }: InteractiveGalleryProps) {
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  // Görsel yüklenemezse siluet gösterilir; noktaların konumu anlamsızlaşacağı için gizlenir
  const [imageFailed, setImageFailed] = useState(false);

  if (!vehicle.interactiveGallery) {
    return null;
  }

  const { studioImage, hotspots } = vehicle.interactiveGallery;
  const active = hotspots.find((spot) => spot.id === activeHotspot);

  return (
    <section className="relative w-full bg-void">
      <p className="eyebrow mb-4 text-center">İnteraktif İnceleme</p>

      {/* Kenardan kenara; oran sabit (CLS yok) */}
      <div className="group relative aspect-video w-full overflow-hidden md:aspect-[21/9]">
        <SmartImage
          src={studioImage}
          alt={`${vehicleName(vehicle)} stüdyo görseli`}
          colorHex={vehicle.media?.colorHex}
          onError={() => setImageFailed(true)}
          imgClassName="duration-550 group-hover:scale-[1.02]"
        />

        {/* Kenar geçişleri: görsel sayfa zeminine yumuşakça karışır */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-void via-void/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-void via-void/40 to-transparent" />

        {!imageFailed &&
          hotspots.map((spot: Hotspot) => {
            const isActive = activeHotspot === spot.id;
            return (
              <div
                key={spot.id}
                className="absolute z-10"
                style={{ left: `${spot.xPosition}%`, top: `${spot.yPosition}%`, transform: 'translate(-50%, -50%)' }}
                onMouseEnter={() => setActiveHotspot(spot.id)}
                onMouseLeave={() => setActiveHotspot(null)}
              >
                {/* Sakin halka (animate-ping yerine): yalnızca hareket tercihi açıksa hafifçe nefes alır */}
                <span className="absolute -inset-1.5 rounded-full border border-foreground/40 motion-safe:animate-pulse" aria-hidden />
                <button
                  type="button"
                  onClick={() => setActiveHotspot(isActive ? null : spot.id)}
                  aria-label={spot.title}
                  aria-expanded={isActive}
                  className={`relative flex size-7 items-center justify-center rounded-full border border-border-subtle backdrop-blur-sm transition-colors ${
                    isActive ? 'bg-foreground text-void' : 'bg-void/70 text-foreground hover:bg-foreground hover:text-void'
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                </button>
              </div>
            );
          })}

        <AnimatePresence>
          {active && (
            <m.div
              key={active.id}
              {...fadeUp}
              transition={TRANSITION.fast}
              className="absolute bottom-6 left-4 right-4 z-20 md:bottom-12 md:left-auto md:right-12 md:w-80"
            >
              <div className="border border-border-subtle bg-void/85 p-6 shadow-2xl backdrop-blur-md">
                <h3 className="mb-2 font-display text-lg font-normal text-foreground">{active.title}</h3>
                <p className="text-sm leading-relaxed text-secondary">{active.description}</p>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
