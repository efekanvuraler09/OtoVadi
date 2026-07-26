import { motion } from 'framer-motion';
import {
  ChevronRight,
  Gauge,
  Fuel,
  Volume2,
  Waves,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../../types/vehicle';
import { useAccent } from '../../hooks/useAccent';
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
  const accent = useAccent(vehicle);
  const detailPath = `/arac/${vehicle.slug}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="group w-full"
    >
      <div className="glass-panel flex w-full flex-col overflow-hidden rounded-3xl md:flex-row md:items-stretch">
        <Link
          to={detailPath}
          className={`relative block h-52 w-full shrink-0 overflow-hidden bg-gradient-to-br md:h-auto md:min-h-[220px] md:w-2/5 ${accent.gradient}`}
        >
          <VehicleMediaCover
            src={vehicle.media.thumbnail}
            alt={`${vehicle.brand} ${vehicle.model}`}
            colorHex={vehicle.media.colorHex}
          />
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: `linear-gradient(135deg, ${vehicle.media.colorHex}66 0%, transparent 55%)`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/20 to-transparent" />

          {vehicle.featured && (
            <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-void/60 px-2.5 py-1 text-[10px] font-semibold text-amber-300 backdrop-blur-md">
              <Star className="size-3 fill-amber-300" />
              Öne Çıkan
            </span>
          )}

          <div className="absolute bottom-4 left-4 right-4 text-left">
            <p className="text-xs font-medium uppercase tracking-widest text-white/70">
              {vehicle.brand}
            </p>
            <h2 className="text-2xl font-semibold text-white">{vehicle.model}</h2>
            <p className="text-xs text-white/60">
              {vehicle.year} · {vehicle.pricing.trim}
            </p>
          </div>
        </Link>

        <div className="flex flex-1 flex-col p-5 md:p-6">
          <Link to={detailPath} className="text-left">
            <p className="text-sm leading-relaxed text-muted line-clamp-2">
              {vehicle.shortDescription}
            </p>
          </Link>

          <div className="mt-4 flex flex-wrap gap-2">
            {vehicle.highlights.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${accent.bgSoft} ${accent.text}`}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-glass-border bg-white/5 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted">
                <Gauge className="size-3.5" />
                <span className="text-[10px]">0–100 km/s</span>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {vehicle.performance.zeroTo100Kmh} sn
              </p>
            </div>
            <div className="rounded-xl border border-glass-border bg-white/5 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted">
                <Fuel className="size-3.5" />
                <span className="text-[10px]">Güç</span>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {vehicle.engine.powerHp} hp
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Link
              to={`${detailPath}?tab=audio`}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-glass-border bg-white/5 text-xs font-medium text-foreground active:bg-white/10"
            >
              <Volume2 className={`size-4 ${accent.text}`} />
              Rölanti
              <span className="text-muted">· {vehicle.audio.idle.durationSeconds}s</span>
            </Link>
            <Link
              to={`${detailPath}?tab=audio`}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-glass-border bg-white/5 text-xs font-medium text-foreground active:bg-white/10"
            >
              <Waves className={`size-4 ${accent.text}`} />
              Egzoz
              <span className="text-muted">· {vehicle.audio.exhaust.durationSeconds}s</span>
            </Link>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-glass-border pt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted">Başlangıç</p>
              <p className="text-lg font-semibold text-foreground">
                {formatPrice(vehicle.pricing.msrp, vehicle.pricing.currency)}
              </p>
            </div>

            <Link to={detailPath}>
              <motion.span
                whileTap={{ scale: 0.95 }}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold text-white ${accent.bg}`}
              >
                İncele
                <ChevronRight className="size-4" />
              </motion.span>
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
