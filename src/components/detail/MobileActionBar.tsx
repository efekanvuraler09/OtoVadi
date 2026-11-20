import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Bookmark, Check, FileText, MessageCircle, MoreHorizontal, Scale } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { formatVehiclePrice } from '../../utils/formatPrice';
import { useGarageToggle } from '../../hooks/useGarageToggle';
import { useCompareToggle } from '../../hooks/useCompareToggle';
import { vehicleName } from '../../utils/vehicleText';
import { TRANSITION } from '../../lib/motion';

interface MobileActionBarProps {
  vehicle: Vehicle;
  onTestDrive: () => void;
  /** "Bu Araca Sorun" danışmanını açar (2.1) */
  onAskAdvisor: () => void;
  /** A4 Teknik Künye broşürünü yazdırır (1.2) */
  onPrintBrochure: () => void;
  /** Danışman parçasını önceden indirir (dokunuşta) */
  onPrefetchAdvisor?: () => void;
}

const menuItemClass =
  'flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm text-foreground transition-colors hover:bg-foreground/5';

/**
 * Araç detayında yalnızca mobilde görünen sticky alt aksiyon barı.
 * BottomNav ile aynı yükseklik/zemin kullanır (--bottom-bar-height), böylece sayfa alt boşluğu tek kuralla çözülür.
 * Faz 6: "Daha fazla" menüsü → Danışmana Sor, Broşürü İndir, Karşılaştır (bar yüksekliği ve mevcut düğmeler değişmedi).
 */
export function MobileActionBar({ vehicle, onTestDrive, onAskAdvisor, onPrintBrochure, onPrefetchAdvisor }: MobileActionBarProps) {
  const { isGaraged, isBusy, toggle } = useGarageToggle(vehicle);
  const compare = useCompareToggle(vehicle);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  // Dışarı dokunma ve ESC menüyü kapatır
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const run = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  return (
    <div
      ref={rootRef}
      className="fixed inset-x-0 bottom-0 z-bottombar border-t border-border-subtle bg-void/90 pb-safe backdrop-blur-md transition-colors duration-350 md:hidden"
      role="region"
      aria-label="Araç işlemleri"
    >
      <AnimatePresence>
        {menuOpen && (
          <m.div
            id={menuId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={TRANSITION.fast}
            className="absolute bottom-full right-4 mb-2 w-64 border border-border-subtle bg-void py-1 shadow-2xl"
          >
            <button type="button" onClick={run(onAskAdvisor)} className={menuItemClass}>
              <MessageCircle className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
              Danışmana Sor
            </button>
            <button type="button" onClick={run(onPrintBrochure)} className={menuItemClass}>
              <FileText className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
              Broşürü İndir
            </button>
            <button type="button" onClick={run(compare.toggle)} aria-pressed={compare.isSelected} className={menuItemClass}>
              {compare.isSelected ? (
                <Check className="size-4 shrink-0 text-foreground" strokeWidth={1.75} aria-hidden />
              ) : (
                <Scale className="size-4 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
              )}
              {compare.isSelected ? 'Düelloda' : 'Karşılaştır'}
            </button>
          </m.div>
        )}
      </AnimatePresence>

      <div className="flex h-20 items-center gap-3 px-4">
        <div className="min-w-0 flex-1">
          <p className="eyebrow truncate" lang="en">{vehicleName(vehicle)}</p>
          <p className="mt-0.5 truncate font-sans text-lg font-light tabular-nums text-foreground">
            {formatVehiclePrice(vehicle.pricing)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          onTouchStart={onPrefetchAdvisor}
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label="Diğer işlemler: danışmana sor, broşür, karşılaştır"
          className={`flex size-12 shrink-0 items-center justify-center border transition-colors ${
            menuOpen ? 'border-foreground text-foreground' : 'border-border-subtle text-muted'
          }`}
        >
          <MoreHorizontal className="size-5" strokeWidth={1.5} aria-hidden />
        </button>

        <button
          type="button"
          onClick={toggle}
          disabled={isBusy}
          aria-label={isGaraged ? 'Garajdan çıkar' : 'Garaja ekle'}
          aria-pressed={isGaraged}
          className="flex size-12 shrink-0 items-center justify-center border border-border-subtle text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? (
            <span className="size-5 rounded-full border-[1.5px] border-muted border-t-foreground animate-spin" />
          ) : (
            <Bookmark
              className={`size-5 ${isGaraged ? 'fill-foreground text-foreground stroke-foreground' : 'text-muted stroke-[1.5]'}`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={onTestDrive}
          className="flex h-12 shrink-0 items-center justify-center bg-foreground px-5 font-sans text-xs font-medium uppercase tracking-widest text-void transition-colors hover:bg-foreground/90"
        >
          Test Sürüşü
        </button>
      </div>
    </div>
  );
}
