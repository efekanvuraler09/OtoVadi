import { motion } from 'framer-motion';
import { ArrowLeft, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../../types/vehicle';
import { useAccent } from '../../hooks/useAccent';
import { useVehicleStore } from '../../store/useVehicleStore';
import { VehicleMediaCover } from '../ui/VehicleMediaCover';

interface DetailHeroProps {
  vehicle: Vehicle;
}

function formatPrice(msrp: number, currency: string) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(msrp);
}

export function DetailHero({ vehicle }: DetailHeroProps) {
  const accent = useAccent(vehicle);
  const toggleFavorite = useVehicleStore((s) => s.toggleFavorite);
  const isFavorite = useVehicleStore((s) => s.isFavorite(vehicle.id));

  return (
    <header className="safe-top relative">
      <div
        className={`relative h-64 w-full overflow-hidden bg-gradient-to-br md:h-80 ${accent.gradient}`}
      >
        <VehicleMediaCover
          src={vehicle.media.heroImage}
          alt={`${vehicle.brand} ${vehicle.model}`}
          colorHex={vehicle.media.colorHex}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, transparent 20%, #050508 92%)`,
          }}
        />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-3 md:px-8">
          <Link
            to="/"
            className="glass-panel flex size-11 items-center justify-center rounded-xl"
            aria-label="Geri dön"
          >
            <ArrowLeft className="size-5 text-foreground" />
          </Link>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleFavorite(vehicle.id)}
            className="glass-panel flex size-11 items-center justify-center rounded-xl"
            aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
          >
            <Heart
              className={`size-5 ${isFavorite ? 'fill-accent-red text-accent-red' : 'text-muted'}`}
            />
          </motion.button>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 md:px-8 lg:px-12">
          <p className="text-xs font-medium uppercase tracking-widest text-white/60">
            {vehicle.brand} · {vehicle.year}
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-white md:text-4xl">
            {vehicle.model}
          </h1>
          <p className="mt-1 text-sm text-white/70">{vehicle.tagline}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="glass-panel rounded-xl px-3 py-1.5 text-sm font-semibold text-foreground">
              {formatPrice(vehicle.pricing.msrp, vehicle.pricing.currency)}
            </span>
            <span className="text-xs text-muted">{vehicle.pricing.trim}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
