import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../../types/vehicle';
import { useGarage } from '../../context/GarageContext';
import { useAuth } from '../../context/AuthContext';
import { VehicleMediaCover } from '../ui/VehicleMediaCover';
import { formatPrice } from '../../utils/formatPrice';

interface DetailHeroProps {
  vehicle: Vehicle;
  onOpenTestDrive?: () => void;
}


export function DetailHero({ vehicle, onOpenTestDrive }: DetailHeroProps) {
  const { garagedSlugs, addVehicle, removeVehicle, loadingSlug } = useGarage();
  const { user, openAuthModal } = useAuth();
  const isGaraged = garagedSlugs.includes(vehicle.id) || garagedSlugs.includes(vehicle.slug); // Support both for safety during transition

  return (
    <header className="safe-top relative">
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
          <Link
            to="/"
            className="flex size-11 items-center justify-center border border-border-subtle bg-void/60 backdrop-blur-sm rounded-none"
            aria-label="Geri dön"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </Link>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (!user) {
                  openAuthModal('Bu ayrıcalığı yaşamak için lütfen giriş yapın.');
                  return;
                }
                onOpenTestDrive?.();
              }}
              className="flex items-center justify-center border border-border-subtle bg-void/60 backdrop-blur-sm px-6 font-sans text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-foreground hover:text-void"
            >
              Test Sürüşü
            </button>
            <motion.button
              type="button"
              disabled={loadingSlug === vehicle.slug}
              whileTap={loadingSlug === vehicle.slug ? {} : { scale: 0.9 }}
              onClick={() => {
                if (!user) {
                  openAuthModal('Bu ayrıcalığı yaşamak için lütfen giriş yapın.');
                  return;
                }
                if (isGaraged) {
                  removeVehicle(vehicle.slug, `${vehicle.brand} ${vehicle.model}`);
                } else {
                  addVehicle(vehicle.slug, `${vehicle.brand} ${vehicle.model}`);
                }
              }}
              className={`flex size-11 items-center justify-center border border-border-subtle bg-void/60 backdrop-blur-sm rounded-none ${loadingSlug === vehicle.slug ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isGaraged ? 'Garajdan çıkar' : 'Garaja ekle'}
            >
              {loadingSlug === vehicle.slug ? (
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
              {formatPrice(vehicle.pricing.msrp)}
            </span>
            <span className="text-xs text-white/70">{vehicle.pricing.trim}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
