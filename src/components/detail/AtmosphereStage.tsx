import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { useI18n } from '../../i18n/useI18n';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { SmartImage } from '../ui/SmartImage';
import { vehicleBrand, vehicleModel, vehicleName } from '../../utils/vehicleText';
import { TRANSITION, staggerDelay } from '../../lib/motion';

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      // Eskiden son değer 3. saniyede geliyordu; artık tümü ~0.6 sn içinde yerinde
      transition={{ ...TRANSITION.slow, delay: 0.3 + staggerDelay(index, 0.08) }}
      className="flex flex-col items-center gap-1 md:items-start"
    >
      <span className="stat-label text-white/55">{label}</span>
      <span className="font-display text-3xl font-light tabular-nums text-white md:text-4xl lg:text-5xl">{value}</span>
    </motion.div>
  );
}

/* ── Main Stage Component ───────────────────────────────────────── */

export function AtmosphereStage({ vehicle, isOpen, onClose }: AtmosphereStageProps) {
  const { t } = useI18n();

  /* ── ESC key handler ── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  /* ── Lock body scroll (ortak sayaçlı kilit) & listen for ESC ── */
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  /* ── Build spec metrics from vehicle data ── */
  const specs = buildSpecs(vehicle);

  /* ── Ambient glow color derived from accentColor ── */
  const glowColor =
    vehicle.accentColor === 'red'
      ? 'rgba(180, 40, 40, 0.12)'
      : 'rgba(40, 80, 180, 0.12)';

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-stage flex items-center justify-center overflow-hidden bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION.slow}
          role="dialog"
          aria-modal="true"
          aria-label={`${vehicleName(vehicle)} Atmosfer Sahnesi`}
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

          {/* ── Ken Burns Hero Image: görsel kırıksa sonsuz siyah ekran yerine siluet + stüdyo zemini ── */}
          <div className="absolute inset-x-0 top-1/2 h-[75svh] -translate-y-1/2">
            <SmartImage
              src={vehicle.media.heroImage}
              alt={vehicleName(vehicle)}
              fit="contain"
              tone="dark"
              bodyType={vehicle.bodyType}
              colorHex={vehicle.media.colorHex}
              priority
              draggable={false}
              className="!bg-none"
              imgClassName="atmosphere-ken-burns pointer-events-none"
              imgStyle={{ filter: 'brightness(0.85) contrast(1.05)' }}
            />
          </div>

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
            transition={{ ...TRANSITION.base, delay: 0.2 }}
            className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top,0px))] z-10 flex min-h-11 items-center gap-3 rounded-full border border-white/20 bg-black/60 px-5 text-xs font-semibold uppercase tracking-eyebrow text-white/85 backdrop-blur-md transition-colors hover:border-white/50 hover:text-white md:right-8 md:top-8"
            aria-label={t.catalog.exitStage}
          >
            <span className="hidden sm:inline">{t.catalog.exitStage}</span>
            <X className="size-4" strokeWidth={1.5} />
          </motion.button>

          {/* ── Vehicle Identity ── */}
          <motion.div
            className="absolute left-4 top-[calc(5rem+env(safe-area-inset-top,0px))] z-10 max-w-[80%] md:left-12 md:top-12 md:max-w-[60%]"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...TRANSITION.slow, delay: 0.15 }}
          >
            <p className="stat-label text-white/55">
              <span lang="en">{vehicleBrand(vehicle)}</span> · <span className="tabular-nums">{vehicle.year}</span>
            </p>
            <h2 className="mt-2 text-display-md font-light text-white">{vehicleModel(vehicle)}</h2>
            <p className="mt-2 text-sm text-white/60 md:text-base">{vehicle.tagline}</p>
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
    </AnimatePresence>,
    document.body
  );
}

/* ── Helpers ─────────────────────────────────────────────────────── */

function buildSpecs(vehicle: Vehicle) {
  const specs: { label: string; value: string }[] = [];

  specs.push({
    label: 'Beygir Gücü',
    value: `${vehicle.engine.powerHp.toLocaleString('tr-TR')} HP`,
  });

  specs.push({
    label: 'Tork',
    value: `${vehicle.engine.torqueNm.toLocaleString('tr-TR')} Nm`,
  });

  specs.push({
    label: '0–100 km/h',
    value: `${vehicle.performance.zeroTo100Kmh.toLocaleString('tr-TR')} sn`,
  });

  specs.push({
    label: 'Motor',
    value: vehicle.engine.configuration,
  });

  return specs;
}
