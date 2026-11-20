import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Pause, Play, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useI18n } from '../../i18n/useI18n';
import { vehicleBrand } from '../../utils/vehicleText';
import { TRANSITION, fadeUp } from '../../lib/motion';

/**
 * Sinematik hero (U2). Header ana sayfada bu bölümün üzerinde şeffaf durur; bu yüzden bölüm header yüksekliği kadar
 * yukarı çekilir (negatif margin) ve içerik alttan hizalanır. Video zemini temadan bağımsız olarak koyudur.
 */
export function HeroSection() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoVisible, setVideoVisible] = useState(false);
  // null: kullanıcı henüz dokunmadı → sistem tercihine uy (hareket azaltma açıksa video durur)
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? Boolean(prefersReducedMotion);

  // Video oynatma durumu DOM'a senkronlanır (autoPlay yerine: hareket azaltma tercihinde hiç başlamaz)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused) {
      video.pause();
    } else {
      // Otomatik oynatma engellenirse (düşük güç modu vb.) poster zemini kalır; buton ile başlatılabilir
      video.play().catch(() => undefined);
    }
  }, [paused]);

  const stats = useMemo(
    () => [
      { value: vehicles.length, label: t.hero.statsVehicles },
      { value: new Set(vehicles.map((v) => vehicleBrand(v).toLocaleLowerCase('tr'))).size, label: t.hero.statsBrands },
      { value: new Set(vehicles.map((v) => v.bodyType)).size, label: t.hero.statsBodyTypes },
    ],
    [vehicles, t],
  );

  return (
    <section
      className="relative isolate -mt-[calc(4rem+env(safe-area-inset-top,0px))] flex min-h-[100svh] flex-col justify-end overflow-hidden bg-black text-white"
      aria-labelledby="hero-title"
    >
      {/* Video gelene kadar görünen stüdyo zemini (siyah kare yerine) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 80% 60% at 70% 45%, rgb(255 255 255 / 0.08), transparent 70%), linear-gradient(180deg, #111 0%, #000 100%)',
        }}
      />
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        preload={prefersReducedMotion ? 'metadata' : 'auto'}
        aria-hidden
        tabIndex={-1}
        onLoadedData={() => setVideoVisible(true)}
        onPlaying={() => setVideoVisible(true)}
        className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-1000 ease-out-expo ${
          videoVisible ? 'opacity-100' : 'opacity-0'
        }`}
        src="/hero-challenger.mp4"
      />

      {/* Okunabilirlik: üstte header için yumuşak geçiş, altta metin için scrim, kenarlarda hafif vinyet */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-black/60 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[75%] bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 120% 90% at 50% 45%, transparent 55%, rgb(0 0 0 / 0.55) 100%)' }}
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-[calc(var(--bottom-bar-height)+env(safe-area-inset-bottom,0px)+2rem)] pt-[calc(4rem+env(safe-area-inset-top,0px)+3rem)] md:px-8 md:pb-16 lg:px-12">
        <motion.div {...fadeUp} transition={TRANSITION.slow} className="max-w-4xl">
          <p className="eyebrow text-white/70">{t.hero.eyebrow}</p>
          <h1 id="hero-title" className="mt-4 text-balance text-display-xl font-light text-white">
            {t.hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">{t.hero.subtitle}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/kesif"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-7 text-xs font-semibold uppercase tracking-eyebrow text-black transition-colors hover:bg-white/85"
            >
              <Sparkles className="size-4" strokeWidth={1.75} aria-hidden />
              {t.hero.ctaPrimary}
            </Link>
            <Link
              to="/modeller"
              className="group inline-flex min-h-12 items-center justify-center gap-2 border border-white/40 px-7 text-xs font-semibold uppercase tracking-eyebrow text-white transition-colors hover:border-white hover:bg-white hover:text-black"
            >
              {t.hero.ctaSecondary}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} aria-hidden />
            </Link>
          </div>
        </motion.div>

        {/* İstatistik şeridi + video kontrolü */}
        <motion.div
          {...fadeUp}
          transition={{ ...TRANSITION.slow, delay: 0.1 }}
          className="mt-12 flex items-end justify-between gap-6 border-t border-white/20 pt-6 md:mt-16"
        >
          <dl className="grid grid-cols-3 gap-6 sm:gap-12">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col-reverse gap-1">
                <dt className="stat-label text-white/60">{stat.label}</dt>
                <dd className="font-display text-3xl font-light tabular-nums md:text-4xl">
                  {isLoading && stat.value === 0 ? '—' : stat.value}
                </dd>
              </div>
            ))}
          </dl>

          <button
            type="button"
            onClick={() => setUserPaused(!paused)}
            aria-label={paused ? t.hero.playVideo : t.hero.pauseVideo}
            title={paused ? t.hero.playVideo : t.hero.pauseVideo}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur-sm transition-colors hover:border-white hover:bg-black/50"
          >
            {paused ? (
              <Play className="ml-0.5 size-4" fill="currentColor" aria-hidden />
            ) : (
              <Pause className="size-4" fill="currentColor" aria-hidden />
            )}
          </button>
        </motion.div>
      </div>
    </section>
  );
}
