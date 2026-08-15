import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';

interface AtmosphereStageProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

/* ── Floating Spec Item ─────────────────────────────────────────── */

interface FloatingSpecProps {
  label: string;
  value: string;
  index: number;
}

function FloatingSpec({ label, value, index }: FloatingSpecProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{
        delay: 1.2 + index * 0.6,
        duration: 0.9,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className="flex flex-col items-center gap-1 md:items-start"
    >
      <span className="font-display text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-white/40">
        {label}
      </span>
      <span className="font-display text-3xl font-light tracking-wider text-white/90 md:text-5xl lg:text-6xl">
        {value}
      </span>
    </motion.div>
  );
}

/* ── Main Stage Component ───────────────────────────────────────── */

export function AtmosphereStage({ vehicle, isOpen, onClose }: AtmosphereStageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  /* ── ESC key handler ── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  /* ── Lock body scroll & listen for ESC ── */
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  /* ── Reset image state on reopen ── */
  useEffect(() => {
    if (isOpen) setImageLoaded(false);
  }, [isOpen]);

  /* ── Build spec metrics from vehicle data ── */
  const specs = buildSpecs(vehicle);

  /* ── Ambient glow color derived from accentColor ── */
  const glowColor =
    vehicle.accentColor === 'red'
      ? 'rgba(180, 40, 40, 0.12)'
      : 'rgba(40, 80, 180, 0.12)';

  const heroSrc = vehicle.media.heroImage?.startsWith('http') || vehicle.media.heroImage?.startsWith('/')
    ? vehicle.media.heroImage
    : `/${vehicle.media.heroImage}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          role="dialog"
          aria-modal="true"
          aria-label={`${vehicle.brand} ${vehicle.model} Atmosfer Sahnesi`}
        >
          {/* ── Ambient Glow ── */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 50% at 50% 100%, ${glowColor}, transparent 70%),
                radial-gradient(ellipse 60% 40% at 20% 80%, ${glowColor}, transparent 60%)
              `,
            }}
          />

          {/* ── Ken Burns Hero Image ── */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 1.0, opacity: 0 }}
            animate={{ scale: 1.0, opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          >
            <img
              src={heroSrc}
              alt={`${vehicle.brand} ${vehicle.model}`}
              onLoad={() => setImageLoaded(true)}
              className="atmosphere-ken-burns pointer-events-none h-full w-full object-contain md:object-contain"
              style={{
                maxHeight: '75vh',
                objectPosition: 'center center',
                filter: 'brightness(0.85) contrast(1.05)',
              }}
              draggable={false}
            />
          </motion.div>

          {/* ── Vignette Overlay ── */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%),
                linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)
              `,
            }}
          />

          {/* ── Close Button ── */}
          <motion.button
            type="button"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute right-6 top-8 z-10 flex items-center gap-3 border border-white/10 bg-black/40 px-6 py-3.5 font-display text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-white/50 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-black/60 hover:text-white/80 md:right-12 md:top-12"
            aria-label="Sahneden çık"
          >
            <span className="hidden sm:inline">Sahneden Çık</span>
            <X className="size-4" strokeWidth={1.5} />
          </motion.button>

          {/* ── Vehicle Identity ── */}
          <motion.div
            className="absolute left-6 top-8 z-10 max-w-[60%] md:left-12 md:top-12"
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
          >
            <p className="font-display text-[10px] md:text-[11px] uppercase tracking-[0.5em] text-white/40">
              {vehicle.brand} · {vehicle.year}
            </p>
            <h2 className="mt-2 font-display text-3xl font-light tracking-widest text-white/90 md:text-4xl lg:text-5xl">
              {vehicle.model}
            </h2>
            <p className="mt-2 font-display text-sm md:text-base font-light text-white/40">
              {vehicle.tagline}
            </p>
          </motion.div>

          {/* ── Floating Specs ── */}
          <div className="absolute bottom-10 left-6 right-6 z-10 flex flex-wrap items-end justify-between gap-6 md:bottom-16 md:left-12 md:right-12 md:gap-10 lg:left-20 lg:right-20">
            {specs.map((spec, i) => (
              <FloatingSpec
                key={spec.label}
                label={spec.label}
                value={spec.value}
                index={i}
              />
            ))}
          </div>

          {/* ── Bottom Gradient Bar ── */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function buildSpecs(vehicle: Vehicle) {
  const specs: { label: string; value: string }[] = [];

  specs.push({
    label: 'Beygir Gücü',
    value: `${vehicle.engine.powerHp} HP`,
  });

  specs.push({
    label: 'Tork',
    value: `${vehicle.engine.torqueNm} Nm`,
  });

  specs.push({
    label: '0–100 km/h',
    value: `${vehicle.performance.zeroTo100Kmh}s`,
  });

  specs.push({
    label: 'Motor',
    value: vehicle.engine.configuration,
  });

  return specs;
}
