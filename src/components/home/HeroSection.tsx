
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Volume2, Sparkles } from 'lucide-react';
import { countActiveSegments, getHeroStats } from '../../lib/catalogStats';
import { useVehicleStore } from '../../store/useVehicleStore';
import { ThemeToggle } from '../layout/ThemeToggle';

interface HeroSectionProps {
  showCatalogCta?: boolean;
}

export function HeroSection({ showCatalogCta = true }: HeroSectionProps) {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const vehicleCount = vehicles.length;
  const activeSegmentCount = useMemo(() => countActiveSegments(vehicles), [vehicles]);
  const heroStats = useMemo(() => getHeroStats(vehicles), [vehicles]);

  return (
    <section className="safe-top px-4 pt-4 md:px-8 md:pt-10 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-panel relative overflow-hidden rounded-3xl p-6 md:p-10 lg:p-12"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-accent-red/10" />
        <div className="absolute -right-8 -top-8 size-40 rounded-full bg-accent/20 blur-3xl" />
        
        <div className="absolute right-6 top-6 z-20">
          <ThemeToggle />
        </div>

        <div className="relative z-10 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-glass-border bg-white/5 px-3 py-1.5"
          >
            <Sparkles className="size-3.5 text-accent" />
            <span className="text-xs font-medium tracking-wide text-muted">
              İnteraktif Araç Kataloğu
            </span>
          </motion.div>

          <h1 className="text-left text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Araçları{' '}
            <span className="bg-gradient-to-r from-accent to-blue-300 bg-clip-text text-transparent">
              duyarak
            </span>{' '}
            keşfet
          </h1>

          <p className="mt-4 text-left text-sm leading-relaxed text-muted md:text-base lg:max-w-lg">
            Gövde tipi ve klasman seçin; motor sesi, donanım ve teknik detayları tek ekranda
            inceleyin.
          </p>

          {showCatalogCta && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <motion.a
                href="#segment-picker"
                whileTap={{ scale: 0.97 }}
                className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-glow"
              >
                Klasman Seç
                <ChevronRight className="size-4" />
              </motion.a>

              <div className="flex items-center gap-2 rounded-2xl border border-glass-border bg-white/5 px-4 py-3">
                <Volume2 className="size-4 text-accent" />
                <span className="text-xs text-muted">
                  {vehicleCount} araç · {activeSegmentCount} aktif klasman
                </span>
              </div>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className={`relative z-10 mt-8 grid gap-2 md:absolute md:bottom-8 md:right-8 md:mt-0 ${
            heroStats.length <= 3
              ? 'grid-cols-3'
              : heroStats.length === 4
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-3'
          }`}
        >
          {heroStats.map((stat) => (
            <div
              key={stat.label}
              className="flex min-w-[72px] flex-col justify-center rounded-xl border border-glass-border bg-void/40 px-3 py-3 text-center backdrop-blur-sm"
            >
              <p className="text-lg font-semibold text-foreground">{stat.value}</p>
              <p className="mt-0.5 text-[10px] text-muted">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
