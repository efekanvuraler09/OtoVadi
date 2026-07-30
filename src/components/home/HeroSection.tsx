import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { getHeroStats } from '../../lib/catalogStats';
import { useVehicleStore } from '../../store/useVehicleStore';

interface HeroSectionProps {
  showCatalogCta?: boolean;
}

export function HeroSection({ showCatalogCta = true }: HeroSectionProps) {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const vehicleCount = vehicles.length;
  const activeSegmentCount = useMemo(() => new Set(vehicles.map(v => v.bodyType)).size, [vehicles]);
  const heroStats = useMemo(() => getHeroStats(vehicles), [vehicles]);

  return (
    <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden bg-black">
      {/* Cinematic Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src="/hero-video.mp4"
      />
      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-black/60 z-10" />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 mx-auto max-w-7xl px-4 md:px-8 lg:px-12"
      >
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl font-light tracking-wide text-white md:text-6xl lg:text-7xl">
            Sürüş Deneyiminizi Yeniden Tanımlayın
          </h1>

          <p className="mt-6 max-w-xl text-sm leading-relaxed tracking-wide text-white/70 md:text-base">
            Yapay zeka destekli akıllı eşleştirme ve kusursuz karşılaştırma motoruyla, yaşam tarzınıza en uygun aracı saniyeler içinde keşfedin.
          </p>

          {showCatalogCta && (
            <div className="mt-12 flex flex-col items-start gap-6">
              <motion.a
                href="#segment-picker"
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 border border-white/30 px-8 py-4 font-sans text-sm font-medium uppercase tracking-[0.15em] text-white transition-all duration-300 hover:bg-white hover:text-black"
              >
                Klasman Seç
                <ChevronRight className="size-4" />
              </motion.a>

              <p className="text-xs uppercase tracking-widest text-white/60">
                {vehicleCount} Araç · {activeSegmentCount} Aktif Klasman
              </p>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-16 flex flex-wrap items-center gap-8 border-t border-white/20 pt-8 md:gap-16"
        >
          {heroStats.map((stat) => (
            <div key={stat.label} className="flex flex-col text-white">
              <span className="font-display text-3xl font-light">{stat.value}</span>
              <span className="mt-1 text-xs uppercase tracking-widest text-white/60">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
