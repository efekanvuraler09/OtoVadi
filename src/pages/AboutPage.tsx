import { motion } from 'framer-motion';
import { Sparkles, Compass, GitCompare } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';

export function AboutPage() {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-void pt-24 pb-20"
    >
      {/* Hero Section */}
      <section className="px-4 md:px-8 lg:px-12 mb-24">
        <div className="mx-auto max-w-4xl text-center">
          <span className="font-display text-[10px] md:text-[11px] tracking-[0.5em] font-light text-muted uppercase mb-6 block">{t.about.tagline}</span>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-foreground leading-tight">
            {t.about.titleLine1} <br className="hidden md:block" /> {t.about.titleLine2}
          </h1>
          <p className="mt-6 font-display text-lg md:text-xl text-foreground/80 font-light max-w-2xl mx-auto leading-relaxed">
            {t.about.description}
          </p>
        </div>
      </section>

      {/* Vizyon & Misyon */}
      <section className="px-4 md:px-8 lg:px-12 mb-24">
        <div className="mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
          <div className="space-y-6">
            <span className="font-display text-[10px] md:text-[11px] tracking-[0.5em] font-light text-muted uppercase block">{t.about.vision}</span>
            <p className="font-display text-2xl md:text-3xl font-light leading-[1.6] text-foreground/90">
              {t.about.visionDesc}
            </p>
          </div>
          <div className="space-y-6">
            <span className="font-display text-[10px] md:text-[11px] tracking-[0.5em] font-light text-muted uppercase block">{t.about.mission}</span>
            <p className="font-display text-2xl md:text-3xl font-light leading-[1.6] text-foreground/90">
              {t.about.missionDesc}
            </p>
          </div>
        </div>
      </section>

      {/* Neden OtoVadi? */}
      <section className="px-4 md:px-8 lg:px-12 border-t border-border-subtle/30 pt-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl md:text-5xl font-light tracking-wide text-foreground">{t.about.whyOtoVadi}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Özellik 1 */}
            <div className="flex flex-col items-center text-center p-8 border border-border-subtle/50 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors">
              <Sparkles className="size-8 text-foreground mb-6" strokeWidth={1} />
              <h3 className="font-display text-xl mb-4">{t.about.feature1Title}</h3>
              <p className="font-sans text-sm text-muted leading-relaxed">
                {t.about.feature1Desc}
              </p>
            </div>
            
            {/* Özellik 2 */}
            <div className="flex flex-col items-center text-center p-8 border border-border-subtle/50 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors">
              <Compass className="size-8 text-foreground mb-6" strokeWidth={1} />
              <h3 className="font-display text-xl mb-4">{t.about.feature2Title}</h3>
              <p className="font-sans text-sm text-muted leading-relaxed">
                {t.about.feature2Desc}
              </p>
            </div>

            {/* Özellik 3 */}
            <div className="flex flex-col items-center text-center p-8 border border-border-subtle/50 bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors">
              <GitCompare className="size-8 text-foreground mb-6" strokeWidth={1} />
              <h3 className="font-display text-xl mb-4">{t.about.feature3Title}</h3>
              <p className="font-sans text-sm text-muted leading-relaxed">
                {t.about.feature3Desc}
              </p>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
