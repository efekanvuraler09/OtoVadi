import { Bookmark } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { formatVehiclePrice } from '../../utils/formatPrice';
import { useGarageToggle } from '../../hooks/useGarageToggle';

interface MobileActionBarProps {
  vehicle: Vehicle;
  onTestDrive: () => void;
}

/**
 * Araç detayında yalnızca mobilde görünen sticky alt aksiyon barı.
 * BottomNav ile aynı yükseklik/zemin kullanır (--bottom-bar-height), böylece sayfa alt boşluğu tek kuralla çözülür.
 */
export function MobileActionBar({ vehicle, onTestDrive }: MobileActionBarProps) {
  const { isGaraged, isBusy, toggle } = useGarageToggle(vehicle);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-bottombar md:hidden pb-safe bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 transition-colors duration-300"
      role="region"
      aria-label="Araç işlemleri"
    >
      <div className="flex h-20 items-center gap-3 px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] uppercase tracking-widest text-muted">
            {vehicle.brand} {vehicle.model}
          </p>
          <p className="mt-0.5 truncate font-sans text-lg font-light tabular-nums text-foreground">
            {formatVehiclePrice(vehicle.pricing)}
          </p>
        </div>

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
