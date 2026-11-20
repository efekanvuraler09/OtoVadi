import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MatchResult } from '../../utils/dnaEngine';
import { formatVehiclePrice } from '../../utils/formatPrice';
import { useI18n } from '../../i18n/useI18n';
import { SmartImage } from '../ui/SmartImage';
import { vehicleName } from '../../utils/vehicleText';
import { TRANSITION, fadeUp } from '../../lib/motion';

interface VehicleRevealProps {
  match: MatchResult;
}

export function VehicleReveal({ match }: VehicleRevealProps) {
  const { t } = useI18n();
  const { vehicle, affinity } = match;
  const affinityPercent = Math.round(affinity * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={TRANSITION.slow}
      className="flex w-full flex-col items-center gap-8 md:gap-10"
    >
      {/* ── Title ── */}
      <motion.div
        {...fadeUp}
        transition={{ ...TRANSITION.slow, delay: 0.1 }}
        className="text-center"
      >
        <p className="eyebrow">
          {t.soulTwin.yourSoulmate}
        </p>
        <h2 className="mt-3 text-display-md font-normal text-foreground">{vehicleName(vehicle)}</h2>
        <p className="mt-2 text-sm text-secondary">
          {vehicle.tagline}
        </p>
      </motion.div>

      {/* ── Vehicle Image: kırık görselde sonsuz boş alan yerine siluet ── */}
      <motion.div {...fadeUp} transition={{ ...TRANSITION.slow, delay: 0.2 }} className="w-full max-w-2xl">
        <SmartImage
          src={vehicle.media.heroImage}
          alt={vehicleName(vehicle)}
          aspectRatio="16 / 9"
          fit="contain"
          colorHex={vehicle.media.colorHex}
          priority
          draggable={false}
        />
      </motion.div>

      {/* ── Match Info ── */}
      <motion.div
        {...fadeUp}
        transition={{ ...TRANSITION.base, delay: 0.3 }}
        className="flex flex-wrap items-center justify-center gap-6 text-center md:gap-10"
      >
        <div className="flex flex-col items-center gap-1">
          <span className="stat-label">
            {t.soulTwin.affinity}
          </span>
          <span className="stat-value text-2xl md:text-3xl">
            %{affinityPercent}
          </span>
        </div>

        <div className="h-8 w-[1px] bg-border-subtle" />

        <div className="flex flex-col items-center gap-1">
          <span className="stat-label">
            {t.soulTwin.power}
          </span>
          <span className="stat-value text-2xl md:text-3xl">
            {vehicle.engine.powerHp} HP
          </span>
        </div>

        <div className="h-8 w-[1px] bg-border-subtle" />

        <div className="flex flex-col items-center gap-1">
          <span className="stat-label">
            Fiyat
          </span>
          <span className="stat-value text-2xl md:text-3xl">
            {formatVehiclePrice(vehicle.pricing)}
          </span>
        </div>
      </motion.div>

      {/* ── CTA ── */}
      <motion.div
        {...fadeUp}
        transition={{ ...TRANSITION.base, delay: 0.4 }}
        className="mt-4"
      >
        <Link
          to={`/arac/${vehicle.id}`}
          className="group inline-flex min-h-12 items-center gap-3 bg-foreground px-8 text-xs font-semibold uppercase tracking-eyebrow text-void transition-colors hover:bg-foreground/90"
        >
          <span>{t.soulTwin.inspectVehicle}</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
