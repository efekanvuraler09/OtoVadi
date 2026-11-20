import { AnimatePresence, m } from 'framer-motion';
import { Bookmark, Check, FileText, MessageCircle, Scale } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { formatVehiclePrice } from '../../utils/formatPrice';
import { cleanText, vehicleBrand, vehicleModel } from '../../utils/vehicleText';
import { useGarageToggle } from '../../hooks/useGarageToggle';
import { useCompareToggle } from '../../hooks/useCompareToggle';
import { TRANSITION } from '../../lib/motion';

interface DetailStickyBarProps {
  vehicle: Vehicle;
  /** Hero ekrandan çıkınca true */
  visible: boolean;
  onTestDrive: () => void;
  /** "Bu Araca Sorun" danışmanı (2.1) */
  onAskAdvisor: () => void;
  /** A4 Teknik Künye (1.2) */
  onPrintBrochure: () => void;
  onPrefetchAdvisor?: () => void;
}

const ghostButtonClass =
  'inline-flex h-10 items-center gap-2 border px-4 text-xs font-medium uppercase tracking-eyebrow transition-colors disabled:cursor-not-allowed disabled:opacity-50';

/**
 * U4 — Masaüstü yapışkan özet şeridi. Hero'nun altına inildiğinde header'ın hemen altında (top-16) belirir.
 * Yalnızca md+ (mobilde MobileActionBar var). Yerel katman z-30: header (z-header 40) ve overlay'lerin altında kalır.
 */
export function DetailStickyBar({ vehicle, visible, onTestDrive, onAskAdvisor, onPrintBrochure, onPrefetchAdvisor }: DetailStickyBarProps) {
  const garage = useGarageToggle(vehicle);
  const compare = useCompareToggle(vehicle);
  const trim = cleanText(vehicle.pricing?.trim);

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          key="detail-sticky"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={TRANSITION.base}
          role="region"
          aria-label="Araç özeti"
          className="fixed inset-x-0 top-16 z-30 hidden border-b border-border-subtle bg-void/90 backdrop-blur-md md:block"
        >
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-8 lg:px-12">
            <div className="flex min-w-0 flex-1 items-baseline gap-3">
              <p className="eyebrow shrink-0" lang="en">
                {vehicleBrand(vehicle)}
              </p>
              <p className="truncate font-display text-lg text-foreground">{vehicleModel(vehicle)}</p>
              {trim && <p className="hidden truncate text-xs text-muted lg:block">{trim}</p>}
            </div>

            <p className="shrink-0 text-lg font-medium tabular-nums text-foreground">{formatVehiclePrice(vehicle.pricing)}</p>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={onPrintBrochure}
                aria-label="Broşürü indir (A4 teknik künye)"
                title="Broşürü İndir"
                className={`${ghostButtonClass} border-border-subtle text-foreground hover:border-foreground`}
              >
                <FileText className="size-4" strokeWidth={1.5} aria-hidden />
              </button>
              <button
                type="button"
                onClick={onAskAdvisor}
                onPointerEnter={onPrefetchAdvisor}
                onFocus={onPrefetchAdvisor}
                className={`${ghostButtonClass} border-border-subtle text-foreground hover:border-foreground`}
              >
                <MessageCircle className="size-4" strokeWidth={1.5} aria-hidden />
                <span className="hidden lg:inline">Danışmana Sor</span>
                <span className="sr-only lg:hidden">Danışmana Sor</span>
              </button>
              <button
                type="button"
                onClick={garage.toggle}
                disabled={garage.isBusy}
                aria-pressed={garage.isGaraged}
                className={`${ghostButtonClass} border-border-subtle text-foreground hover:border-foreground`}
              >
                <Bookmark className={`size-4 ${garage.isGaraged ? 'fill-current' : ''}`} strokeWidth={1.5} aria-hidden />
                <span className="hidden lg:inline">{garage.isGaraged ? 'Garajda' : 'Garaj'}</span>
                <span className="sr-only lg:hidden">{garage.isGaraged ? 'Garajdan çıkar' : 'Garaja ekle'}</span>
              </button>
              <button
                type="button"
                onClick={compare.toggle}
                aria-pressed={compare.isSelected}
                className={`${ghostButtonClass} ${
                  compare.isSelected
                    ? 'border-foreground bg-foreground/5 text-foreground'
                    : 'border-border-subtle text-foreground hover:border-foreground'
                }`}
              >
                {compare.isSelected ? (
                  <Check className="size-4" strokeWidth={1.75} aria-hidden />
                ) : (
                  <Scale className="size-4" strokeWidth={1.5} aria-hidden />
                )}
                {compare.isSelected ? 'Düelloda' : 'Karşılaştır'}
              </button>
              <button
                type="button"
                onClick={onTestDrive}
                className="inline-flex h-10 items-center bg-foreground px-5 text-xs font-medium uppercase tracking-eyebrow text-void transition-colors hover:bg-foreground/90"
              >
                Test Sürüşü
              </button>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
