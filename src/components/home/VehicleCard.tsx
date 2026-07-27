import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../../types/vehicle';
import { VehicleMediaCover } from '../ui/VehicleMediaCover';

interface VehicleCardProps {
  vehicle: Vehicle;
  index?: number;
}

function formatPrice(msrp: number, currency: string) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(msrp);
}

export function VehicleCard({ vehicle, index = 0 }: VehicleCardProps) {
  const detailPath = `/arac/${vehicle.slug}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group w-full flex flex-col"
    >
      <Link
        to={detailPath}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900"
      >
        <VehicleMediaCover
          src={vehicle.media.thumbnail}
          alt={`${vehicle.brand} ${vehicle.model}`}
          colorHex={vehicle.media.colorHex}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </Link>

      <div className="mt-6 flex flex-col">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          {vehicle.brand}
        </p>
        
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-light text-foreground">
              {vehicle.model}
            </h2>
            <p className="mt-1 text-sm tracking-wide text-muted">
              {vehicle.year} · {vehicle.pricing.trim}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted">Başlangıç</p>
            <p className="mt-1 text-sm md:text-base font-medium tracking-wide text-foreground">
              {formatPrice(vehicle.pricing.msrp, vehicle.pricing.currency)}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-neutral-200 dark:border-neutral-800 pt-4">
          <Link 
            to={detailPath}
            className="inline-flex items-center gap-2 text-sm tracking-wide uppercase text-muted hover:text-foreground transition-colors"
          >
            İncele
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
