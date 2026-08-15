import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { MatchResult } from '../../utils/dnaEngine';
import { formatPrice } from '../../utils/formatPrice';

interface VehicleRevealProps {
  match: MatchResult;
}

export function VehicleReveal({ match }: VehicleRevealProps) {
  const { vehicle, affinity } = match;
  const [imageLoaded, setImageLoaded] = useState(false);

  const heroSrc =
    vehicle.media.heroImage?.startsWith('http') || vehicle.media.heroImage?.startsWith('/')
      ? vehicle.media.heroImage
      : `/${vehicle.media.heroImage}`;

  const affinityPercent = Math.round(affinity * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.0, ease: 'easeOut' }}
      className="flex flex-col items-center gap-8 px-6 md:gap-10"
    >
      {/* ── Title ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
        className="text-center"
      >
        <p className="font-sans text-[10px] uppercase tracking-[0.4em] text-white/30">
          Sizin Ruh İkiziniz
        </p>
        <h2 className="mt-3 font-display text-4xl font-light tracking-wide text-white/90 md:text-5xl">
          {vehicle.brand} {vehicle.model}
        </h2>
        <p className="mt-2 font-sans text-sm font-light italic text-white/35">
          {vehicle.tagline}
        </p>
      </motion.div>

      {/* ── Vehicle Image ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 0.95 }}
        transition={{ delay: 0.6, duration: 1.2, ease: 'easeOut' }}
        className="relative w-full max-w-2xl overflow-hidden"
      >
        {/* Ambient glow behind vehicle */}
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 60%, rgba(255,255,255,0.04), transparent 70%)',
          }}
        />
        <img
          src={heroSrc}
          alt={`${vehicle.brand} ${vehicle.model}`}
          onLoad={() => setImageLoaded(true)}
          className="h-auto w-full object-contain"
          style={{ filter: 'brightness(0.9) contrast(1.05)' }}
          draggable={false}
        />
      </motion.div>

      {/* ── Match Info ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.7, ease: 'easeOut' }}
        className="flex flex-wrap items-center justify-center gap-6 text-center md:gap-10"
      >
        <div className="flex flex-col items-center gap-1">
          <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/30">
            Uyumluluk
          </span>
          <span className="font-display text-3xl font-light text-white/90">
            %{affinityPercent}
          </span>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex flex-col items-center gap-1">
          <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/30">
            Güç
          </span>
          <span className="font-display text-3xl font-light text-white/90">
            {vehicle.engine.powerHp} HP
          </span>
        </div>

        <div className="h-8 w-[1px] bg-white/10" />

        <div className="flex flex-col items-center gap-1">
          <span className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/30">
            Fiyat
          </span>
          <span className="font-display text-3xl font-light text-white/90">
            {formatPrice(vehicle.pricing.msrp)}
          </span>
        </div>
      </motion.div>

      {/* ── CTA Button ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <Link
          to={`/arac/${vehicle.id}`}
          className="group flex items-center gap-3 border border-white/10 bg-white/[0.03] px-8 py-3.5 font-sans text-xs uppercase tracking-[0.2em] text-white/60 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
        >
          <span>Aracı İncele</span>
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
        </Link>
      </motion.div>
    </motion.div>
  );
}
