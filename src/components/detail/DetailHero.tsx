import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { SmartImage } from '../ui/SmartImage';
import { formatVehiclePrice } from '../../utils/formatPrice';
import { cleanText, vehicleBrand, vehicleModel, vehicleName } from '../../utils/vehicleText';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { useGarageToggle } from '../../hooks/useGarageToggle';

interface DetailHeroProps {
  vehicle: Vehicle;
  /** Giriş kontrolü dahil test sürüşü akışını başlatır (VehicleDetailPage sağlar) */
  onOpenTestDrive?: () => void;
}

const overlayButtonClass =
  'flex size-11 items-center justify-center border border-border-subtle bg-void/70 text-foreground backdrop-blur-sm transition-colors hover:bg-void';

export function DetailHero({ vehicle, onOpenTestDrive }: DetailHeroProps) {
  const goBack = useBackNavigation('/');
  const { isGaraged, isBusy, toggle } = useGarageToggle(vehicle);
  const trim = cleanText(vehicle.pricing.trim);

  return (
    <header className="relative">
      <div className="relative h-[22rem] w-full overflow-hidden bg-black md:h-[30rem]">
        <SmartImage
          src={vehicle.media.heroImage}
          alt={vehicleName(vehicle)}
          bodyType={vehicle.bodyType}
          colorHex={vehicle.media.colorHex}
          tone="dark"
          priority
        />
        {/* Metin okunabilirliği için alttan ve (masaüstünde) soldan scrim; görsel her temada koyu zemin üzerinde */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/50 via-black/10 to-transparent md:block" />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-3 md:px-8">
          <button type="button" onClick={goBack} className={overlayButtonClass} aria-label="Geri dön">
            <ArrowLeft className="size-5" strokeWidth={1.5} aria-hidden />
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenTestDrive}
              className="hidden h-11 items-center justify-center border border-border-subtle bg-void/70 px-6 text-xs font-semibold uppercase tracking-eyebrow text-foreground backdrop-blur-sm transition-colors hover:bg-foreground hover:text-void md:flex"
            >
              Test Sürüşü
            </button>
            <motion.button
              type="button"
              disabled={isBusy}
              whileTap={isBusy ? {} : { scale: 0.94 }}
              onClick={toggle}
              className={`${overlayButtonClass} ${isBusy ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-label={isGaraged ? 'Garajdan çıkar' : 'Garaja ekle'}
              aria-pressed={isGaraged}
            >
              {isBusy ? (
                <span className="size-5 animate-spin rounded-full border-[1.5px] border-muted border-t-foreground" />
              ) : (
                <Bookmark className={`size-5 ${isGaraged ? 'fill-current' : ''}`} strokeWidth={1.5} aria-hidden />
              )}
            </motion.button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-7xl px-4 pb-8 md:px-8 lg:px-12">
          <p className="eyebrow text-white/70">
            <span lang="en">{vehicleBrand(vehicle)}</span> · <span className="tabular-nums">{vehicle.year}</span>
          </p>
          <h1 className="mt-3 text-display-lg font-light text-white">{vehicleModel(vehicle)}</h1>
          {vehicle.tagline && <p className="mt-2 max-w-2xl text-base text-white/75">{cleanText(vehicle.tagline)}</p>}
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-xl font-medium tabular-nums text-white">{formatVehiclePrice(vehicle.pricing)}</span>
            {trim && <span className="text-sm text-white/70">{trim}</span>}
          </div>
        </div>
      </div>
    </header>
  );
}
