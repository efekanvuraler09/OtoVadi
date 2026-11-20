import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gauge, Zap, Weight, Timer, Wind } from 'lucide-react';
import { subscribeCarOfTheDay, type CarOfTheDayData } from '../services/carOfTheDayService';
import { LoadErrorState, LoadingState, StatusScreen } from '../components/ui/DataState';
import { SmartImage } from '../components/ui/SmartImage';
import { PageContainer } from '../components/layout/PageContainer';
import { TRANSITION, fade, fadeUp } from '../lib/motion';

const SPEC_ICONS = [
  { label: 'Motor Hacmi', key: 'engine' as const, icon: Gauge },
  { label: 'Güç', key: 'power' as const, icon: Zap },
  { label: 'Maks Tork', key: 'torque' as const, icon: Wind },
  { label: 'Ağırlık', key: 'weight' as const, icon: Weight },
  { label: '0-100 km/s', key: 'acceleration' as const, icon: Timer },
  { label: 'Maks Hız', key: 'topSpeed' as const, icon: Gauge },
];

export function CarOfTheDayPage() {
  const [data, setData] = useState<CarOfTheDayData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeCarOfTheDay(
      (incoming) => {
        setData(incoming);
        setLoadFailed(false);
        setIsLoading(false);
      },
      () => {
        setLoadFailed(true);
        setIsLoading(false);
      },
    );
    return () => unsubscribe();
  }, [attempt]);

  if (isLoading) {
    return <LoadingState label="Editoryal içerik yükleniyor..." />;
  }

  if (loadFailed && !data) {
    return (
      <LoadErrorState
        title="Editoryal içerik yüklenemedi"
        onRetry={() => {
          setIsLoading(true);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  if (!data) {
    return (
      <StatusScreen
        eyebrow="Günün Aracı"
        title="Henüz bir içerik yayınlanmadı"
        description="Yeni sürüş izlenimi yayınlandığında burada olacak."
      />
    );
  }

  const paragraphs = data.articleText.split('\n\n').filter(Boolean);
  const todayStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div {...fade} transition={TRANSITION.base}>
      <PageContainer width="medium">
      {/* Header strip */}
      <div className="mb-10">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-4">
            <span className="border border-foreground px-3 py-1 text-2xs font-semibold uppercase tracking-eyebrow text-foreground">
              SÜRÜŞ İZLENİMİ
            </span>
            <span className="eyebrow hidden sm:inline">
              OtoVadi Editöryal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="eyebrow flex items-center gap-1.5">
              <Calendar className="size-3" />
              {todayStr}
            </span>
          </div>
        </div>
      </div>

      {/* Title block */}
      <section className="mb-12">
        <motion.h1
          {...fadeUp}
          transition={TRANSITION.slow}
          className="mb-6 text-balance text-display-xl font-light text-foreground"
        >
          {data.title}
        </motion.h1>
        <motion.p
          {...fadeUp}
          transition={{ ...TRANSITION.slow, delay: 0.05 }}
          className="max-w-3xl text-xl font-light leading-relaxed text-secondary md:text-2xl"
        >
          {data.spotText}
        </motion.p>
      </section>

      {/* Hero image */}
      {data.imageUrl && (
        <motion.section {...fadeUp} transition={{ ...TRANSITION.slow, delay: 0.1 }} className="mb-16">
          <SmartImage src={data.imageUrl} alt={data.title} aspectRatio="16 / 9" priority className="border border-border-subtle" />
        </motion.section>
      )}

      {/* Editorial body + sidebar grid */}
      <section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_300px] lg:gap-16">

          {/* Main article body */}
          <motion.article {...fadeUp} transition={{ ...TRANSITION.slow, delay: 0.15 }} className="order-2 lg:order-1">
            {/* First paragraph with drop cap */}
            {paragraphs.length > 0 && (
              <p className="mb-8 text-base leading-[1.85] text-secondary first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:font-display first-letter:text-6xl first-letter:font-light first-letter:leading-[0.8] first-letter:text-foreground md:text-lg">
                {paragraphs[0]}
              </p>
            )}

            {/* Remaining paragraphs in multi-column */}
            {paragraphs.length > 1 && (
              <div className="md:columns-2 gap-8 space-y-6">
                {paragraphs.slice(1).map((p, i) => (
                  <p
                    key={i}
                    className="break-inside-avoid text-base leading-[1.85] text-secondary"
                  >
                    {p}
                  </p>
                ))}
              </div>
            )}
          </motion.article>

          {/* Sidebar */}
          <motion.aside
            {...fadeUp}
            transition={{ ...TRANSITION.slow, delay: 0.2 }}
            className="order-1 space-y-6 lg:sticky lg:top-24 lg:order-2 lg:self-start"
          >
            {/* Technical Data Box */}
            <div className="border border-border-subtle p-6">
              <h3 className="eyebrow mb-6 border-b border-border-subtle pb-3 text-foreground">
                Teknik Veriler
              </h3>
              <dl className="space-y-4">
                {SPEC_ICONS.map((spec) => {
                  const Icon = spec.icon;
                  const value = data[spec.key];
                  if (!value) return null;
                  return (
                    <div key={spec.key} className="flex items-center justify-between gap-4">
                      <dt className="flex items-center gap-2.5 text-sm text-muted">
                        <Icon className="size-4 text-muted" strokeWidth={1.5} aria-hidden />
                        {spec.label}
                      </dt>
                      <dd className="text-sm font-medium text-foreground tracking-wide tabular-nums">
                        {value}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>

            {/* Verdict Box */}
            {data.conclusion && (
              <div className="bg-foreground text-void p-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-void/20">
                  <h3 className="text-2xs font-semibold uppercase tracking-eyebrow">
                    Sonuç
                  </h3>
                  {data.verdictScore && (
                    <span className="font-display text-3xl font-light tabular-nums">
                      {data.verdictScore}<span className="text-base text-void/70">/10</span>
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed opacity-90">
                  {data.conclusion}
                </p>
              </div>
            )}
          </motion.aside>
        </div>
      </section>

      {/* Bottom divider */}
      <div className="mt-20">
        <div className="flex items-center justify-between border-t border-border-subtle pt-8">
          <p className="eyebrow">
            © {new Date().getFullYear()} OtoVadi Editöryal
          </p>
          <p className="eyebrow">
            Günün Aracı Serisi
          </p>
        </div>
      </div>
      </PageContainer>
    </motion.div>
  );
}
