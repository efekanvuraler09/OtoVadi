import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { VehicleMediaCover } from '../ui/VehicleMediaCover';
import { formatVehiclePrice } from '../../utils/formatPrice';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { useGarageToggle } from '../../hooks/useGarageToggle';

interface DetailHeroProps {
  vehicle: Vehicle;
  /** Giriş kontrolü dahil test sürüşü akışını başlatır (VehicleDetailPage sağlar) */
  onOpenTestDrive?: () => void;
}

export function DetailHero({ vehicle, onOpenTestDrive }: DetailHeroProps) {
  const goBack = useBackNavigation('/');
  const { isGaraged, isBusy, toggle } = useGarageToggle(vehicle);

  return (
    <header className="relative">
      <div
        className="relative h-80 w-full overflow-hidden bg-void md:h-[28rem]"
      >
        <VehicleMediaCover
          src={vehicle.media.heroImage}
          alt={`${vehicle.brand} ${vehicle.model}`}
          colorHex={vehicle.media.colorHex}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"
        />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-3 md:px-8">
          <button
            type="button"
            onClick={goBack}
            className="flex size-11 items-center justify-center border border-border-subtle bg-void/60 backdrop-blur-sm rounded-none"
            aria-label="Geri dön"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onOpenTestDrive}
              className="flex items-center justify-center border border-border-subtle bg-void/60 backdrop-blur-sm px-6 font-sans text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-void"
            >
              Test Sürüşü
            </button>
            <motion.button
              type="button"
              disabled={isBusy}
              whileTap={isBusy ? {} : { scale: 0.9 }}
              onClick={toggle}
              className={`flex size-11 items-center justify-center border border-border-subtle bg-void/60 backdrop-blur-sm rounded-none ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isGaraged ? 'Garajdan çıkar' : 'Garaja ekle'}
              aria-pressed={isGaraged}
            >
              {isBusy ? (
                <div className="size-5 rounded-full border-[1.5px] border-muted border-t-foreground animate-spin" />
              ) : (
                <Bookmark
                  className={`size-5 ${isGaraged ? 'fill-foreground text-foreground stroke-foreground' : 'text-muted stroke-[1.5]'}`}
                />
              )}
            </motion.button>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 md:px-8 lg:px-12">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">
            {vehicle.brand} · {vehicle.year}
          </p>
          <h1 className="mt-1 font-display text-4xl md:text-5xl font-light tracking-wide text-white/90">
            {vehicle.model}
          </h1>
          <p className="mt-1 font-display text-base text-white/70 font-light tracking-wide">{vehicle.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-lg font-sans font-light text-white">
              {formatVehiclePrice(vehicle.pricing)}
            </span>
            <span className="text-xs text-white/70">{vehicle.pricing.trim}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
