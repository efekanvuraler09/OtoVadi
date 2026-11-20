import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { Plus, Swords, Trash2, X } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { MAX_COMPARE, duelHref, useCompareStore } from '../../store/useCompareStore';
import { SmartImage } from '../ui/SmartImage';
import { vehicleBrand, vehicleModel, vehicleName } from '../../utils/vehicleText';
import { useI18n } from '../../i18n/useI18n';
import { TRANSITION } from '../../lib/motion';

interface CompareTrayProps {
  /** Tepsideki (katalogda hâlâ bulunan) araçlar */
  vehicles: Vehicle[];
  /** /karsilastir sayfasında gizlenir */
  visible: boolean;
}

/**
 * U7 — Yüzen karşılaştırma tepsisi. Mobilde BottomNav / MobileActionBar'ın hemen üstünde (bottom-above-bar),
 * masaüstünde ekranın altında ortalanmış durur. Katman: z-bottombar (drawer/modal'ların altında).
 * Konumlandırma dış kapta, animasyon iç kapta: framer'ın transform'u Tailwind'in translate sınıflarını ezmesin.
 */
export function CompareTray({ vehicles, visible }: CompareTrayProps) {
  const { t } = useI18n();
  const copy = t.compareTray;
  const remove = useCompareStore((s) => s.remove);
  const clear = useCompareStore((s) => s.clear);
  const notice = useCompareStore((s) => s.notice);
  const dismissNotice = useCompareStore((s) => s.dismissNotice);

  // "Tepsi dolu" bildirimi birkaç saniye sonra kendiliğinden kaybolur
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(dismissNotice, 3500);
    return () => window.clearTimeout(timer);
  }, [notice, dismissNotice]);

  const isOpen = visible && vehicles.length > 0;
  const emptySlots = Math.max(0, MAX_COMPARE - vehicles.length);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-above-bar z-bottombar flex justify-center px-3 md:bottom-6 md:px-6">
      <AnimatePresence>
        {isOpen && (
          <m.section
            key="compare-tray"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={TRANSITION.base}
            aria-label={copy.region}
            className="pointer-events-auto relative w-full max-w-5xl border border-border-subtle bg-void/80 shadow-2xl backdrop-blur-xl"
          >
            <AnimatePresence>
              {notice && (
                <m.p
                  key={notice.id}
                  role="status"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={TRANSITION.fast}
                  className="absolute inset-x-0 bottom-full mb-2 border border-border-subtle bg-surface-elevated px-4 py-2.5 text-center text-xs text-foreground shadow-lg"
                >
                  {notice.text}
                </m.p>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-3 p-2.5 md:gap-5 md:p-3">
              <div className="hidden shrink-0 flex-col pl-2 lg:flex">
                <span className="eyebrow">{copy.title}</span>
                <span className="mt-0.5 text-sm font-medium tabular-nums text-foreground">
                  {vehicles.length} / {MAX_COMPARE}
                </span>
              </div>

              <ul className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
                {vehicles.map((vehicle) => (
                  <li key={vehicle.id} className="flex min-w-0 flex-1 items-center gap-2.5 md:flex-none lg:flex-1">
                    <div className="relative w-14 shrink-0 md:w-16">
                      <SmartImage
                        src={vehicle.media?.thumbnail || vehicle.media?.heroImage}
                        alt=""
                        aspectRatio="16 / 10"
                        colorHex={vehicle.media?.colorHex}
                      />
                      <button
                        type="button"
                        onClick={() => remove(vehicle.id)}
                        aria-label={`${copy.remove}: ${vehicleName(vehicle)}`}
                        title={copy.remove}
                        className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full border border-border-subtle bg-void text-foreground shadow transition-colors hover:bg-foreground hover:text-void"
                      >
                        <X className="size-3" strokeWidth={2} aria-hidden />
                      </button>
                    </div>
                    <div className="hidden min-w-0 lg:block">
                      <p className="truncate text-2xs font-medium uppercase tracking-eyebrow text-muted" lang="en">
                        {vehicleBrand(vehicle)}
                      </p>
                      <p className="truncate font-display text-sm text-foreground">{vehicleModel(vehicle)}</p>
                    </div>
                  </li>
                ))}
                {Array.from({ length: emptySlots }, (_, i) => (
                  <li key={`empty-${i}`} className="hidden shrink-0 sm:block" aria-hidden>
                    <div
                      className="flex w-14 items-center justify-center border border-dashed border-border-strong/60 text-muted md:w-16"
                      style={{ aspectRatio: '16 / 10' }}
                      title={copy.emptySlot}
                    >
                      <Plus className="size-3.5" strokeWidth={1.5} />
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
                <button
                  type="button"
                  onClick={clear}
                  aria-label={copy.clear}
                  title={copy.clear}
                  className="flex size-11 items-center justify-center text-muted transition-colors hover:text-foreground md:w-auto md:px-3"
                >
                  <Trash2 className="size-4 md:hidden" strokeWidth={1.5} aria-hidden />
                  <span className="hidden text-xs font-medium uppercase tracking-eyebrow md:inline">{copy.clear}</span>
                </button>
                <Link
                  to={duelHref(vehicles)}
                  className="inline-flex h-11 items-center justify-center gap-2 bg-foreground px-4 text-xs font-medium uppercase tracking-eyebrow text-void transition-colors hover:bg-foreground/90 md:px-6"
                  title={vehicles.length < 2 ? copy.addMore : undefined}
                >
                  <Swords className="size-4" strokeWidth={1.5} aria-hidden />
                  <span className="hidden sm:inline">{copy.start}</span>
                  <span className="sm:hidden">{copy.title}</span>
                </Link>
              </div>
            </div>
          </m.section>
        )}
      </AnimatePresence>
    </div>
  );
}
