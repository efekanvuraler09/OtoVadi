import { m } from 'framer-motion';
import { Sparkles, Compass, GitCompare } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { TRANSITION, fade, fadeUp, staggerDelay } from '../lib/motion';

import { usePageMeta } from '../hooks/usePageMeta';
export function AboutPage() {
  usePageMeta({
    title: 'Hakkımızda',
    description: 'OtoVadi: araç seçimini bir showroom deneyimine dönüştüren dijital otomotiv vitrini.',
  });
  const { t } = useI18n();

  const features = [
    { icon: Sparkles, title: t.about.feature1Title, desc: t.about.feature1Desc },
    { icon: Compass, title: t.about.feature2Title, desc: t.about.feature2Desc },
    { icon: GitCompare, title: t.about.feature3Title, desc: t.about.feature3Desc },
  ];

  return (
    <m.div {...fade} transition={TRANSITION.base}>
      <PageContainer width="medium">
        <PageHeader
          align="center"
          eyebrow={t.about.tagline}
          title={
            <>
              {t.about.titleLine1} <br className="hidden md:block" /> {t.about.titleLine2}
            </>
          }
          description={t.about.description}
        />

        {/* Vizyon & Misyon */}
        <section className="grid grid-cols-1 gap-12 border-t border-border-subtle py-14 md:grid-cols-2 md:gap-16 md:py-20">
          {[
            { label: t.about.vision, text: t.about.visionDesc },
            { label: t.about.mission, text: t.about.missionDesc },
          ].map((block) => (
            <div key={block.label} className="space-y-4">
              <p className="eyebrow">{block.label}</p>
              <p className="text-display-sm font-normal leading-snug text-foreground">{block.text}</p>
            </div>
          ))}
        </section>

        {/* Neden OtoVadi? */}
        <section className="border-t border-border-subtle pt-14 md:pt-20">
          <h2 className="mb-10 text-center text-display-md font-normal text-foreground md:mb-14">{t.about.whyOtoVadi}</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            {features.map(({ icon: Icon, title, desc }, index) => (
              <m.div
                key={title}
                {...fadeUp}
                transition={{ ...TRANSITION.base, delay: staggerDelay(index) }}
                className="flex flex-col items-start border border-border-subtle bg-surface p-6 transition-colors hover:border-border-strong md:p-8"
              >
                <Icon className="mb-6 size-7 text-foreground" strokeWidth={1.25} aria-hidden />
                <h3 className="mb-3 font-display text-lg font-normal text-foreground">{title}</h3>
                <p className="text-sm leading-relaxed text-secondary">{desc}</p>
              </m.div>
            ))}
          </div>
        </section>
      </PageContainer>
    </m.div>
  );
}
