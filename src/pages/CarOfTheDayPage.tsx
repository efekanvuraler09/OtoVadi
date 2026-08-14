import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Gauge, Zap, Weight, Timer, Wind, Loader2 } from 'lucide-react';
import { subscribeCarOfTheDay, type CarOfTheDayData } from '../services/carOfTheDayService';

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

  useEffect(() => {
    const unsubscribe = subscribeCarOfTheDay((incoming) => {
      setData(incoming);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted" />
          <p className="font-sans text-xs uppercase tracking-widest text-muted">
            Editöryal İçerik Yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="flex flex-col items-center gap-4 text-center px-6">
          <p className="font-serif text-2xl text-foreground/80">Henüz bir içerik yayınlanmadı.</p>
          <p className="text-sm text-muted">Yönetim panelinden &quot;Günün Aracı&quot; içeriğini ekleyebilirsiniz.</p>
        </div>
      </div>
    );
  }

  const paragraphs = data.articleText.split('\n\n').filter(Boolean);
  const todayStr = new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-void pt-24 pb-20"
    >
      {/* Header strip */}
      <div className="mx-auto max-w-6xl px-4 md:px-8 lg:px-12 mb-8">
        <div className="flex items-center justify-between border-b border-border-subtle pb-4">
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-foreground font-medium border border-foreground px-3 py-1">
              SÜRÜŞ İZLENİMİ
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted hidden sm:inline">
              OtoVadi Editöryal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] uppercase tracking-widest text-muted flex items-center gap-1.5">
              <Calendar className="size-3" />
              {todayStr}
            </span>
          </div>
        </div>
      </div>

      {/* Title block */}
      <section className="mx-auto max-w-6xl px-4 md:px-8 lg:px-12 mb-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-light tracking-tight text-foreground leading-[0.95] mb-6"
        >
          {data.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="font-serif text-xl md:text-2xl font-light text-foreground/70 leading-relaxed max-w-3xl"
        >
          {data.spotText}
        </motion.p>
      </section>

      {/* Hero image */}
      {data.imageUrl && (
        <motion.section
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 mb-16"
        >
          <div className="aspect-video w-full overflow-hidden bg-surface/20 border border-border-subtle">
            <img
              src={data.imageUrl}
              alt={data.title}
              className="w-full h-full object-cover"
            />
          </div>
        </motion.section>
      )}

      {/* Editorial body + sidebar grid */}
      <section className="mx-auto max-w-6xl px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16">

          {/* Main article body */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="order-2 lg:order-1"
          >
            {/* First paragraph with drop cap */}
            {paragraphs.length > 0 && (
              <p className="font-serif text-base md:text-lg leading-[1.9] text-foreground/85 mb-8 first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.8] first-letter:text-foreground first-letter:font-serif">
                {paragraphs[0]}
              </p>
            )}

            {/* Remaining paragraphs in multi-column */}
            {paragraphs.length > 1 && (
              <div className="md:columns-2 gap-8 space-y-6">
                {paragraphs.slice(1).map((p, i) => (
                  <p
                    key={i}
                    className="font-serif text-base md:text-[15px] leading-[1.85] text-foreground/80 break-inside-avoid"
                  >
                    {p}
                  </p>
                ))}
              </div>
            )}
          </motion.article>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="order-1 lg:order-2 space-y-6 lg:sticky lg:top-24 lg:self-start"
          >
            {/* Technical Data Box */}
            <div className="border border-border-subtle p-6">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-foreground font-medium mb-6 pb-3 border-b border-border-subtle">
                Teknik Veriler
              </h3>
              <dl className="space-y-4">
                {SPEC_ICONS.map((spec) => {
                  const Icon = spec.icon;
                  const value = data[spec.key];
                  if (!value) return null;
                  return (
                    <div key={spec.key} className="flex items-center justify-between gap-4">
                      <dt className="flex items-center gap-2.5 text-xs text-muted">
                        <Icon className="size-3.5 text-foreground/40" strokeWidth={1.5} />
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
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-medium">
                    Sonuç
                  </h3>
                  {data.verdictScore && (
                    <span className="text-3xl font-light font-serif tracking-tight">
                      {data.verdictScore}<span className="text-base text-void/50">/10</span>
                    </span>
                  )}
                </div>
                <p className="font-serif text-sm leading-relaxed opacity-90">
                  {data.conclusion}
                </p>
              </div>
            )}
          </motion.aside>
        </div>
      </section>

      {/* Bottom divider */}
      <div className="mx-auto max-w-6xl px-4 md:px-8 lg:px-12 mt-20">
        <div className="border-t border-border-subtle pt-8 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-widest text-muted">
            © {new Date().getFullYear()} OtoVadi Editöryal
          </p>
          <p className="text-[10px] uppercase tracking-widest text-muted">
            Günün Aracı Serisi
          </p>
        </div>
      </div>
    </motion.div>
  );
}
