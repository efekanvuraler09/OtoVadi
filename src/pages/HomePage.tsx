import { useMemo } from 'react';
import { m } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { HeroSection } from '../components/home/HeroSection';
import { FeaturedShowcase } from '../components/home/FeaturedShowcase';
import { WelcomeStrip } from '../components/home/WelcomeStrip';
import { InstantSearch } from '../components/home/InstantSearch';
import { SegmentPicker } from '../components/home/SegmentPicker';
import { VehicleCard } from '../components/vehicle/VehicleCard';
import { VehicleLoadError } from '../components/ui/DataState';
import { PageContainer } from '../components/layout/PageContainer';
import { SectionHeader } from '../components/layout/PageHeader';
import { getSegmentOption } from '../data/segments';
import { filterVehicles, useVehicleStore } from '../store/useVehicleStore';
import { useI18n } from '../i18n/useI18n';
import { fadeUp } from '../lib/motion';

import { usePageMeta } from '../hooks/usePageMeta';
export function HomePage() {
  // Varsayılan site başlığı ve açıklaması (index.html ile aynı)
  usePageMeta({});
  const { t } = useI18n();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const loadError = useVehicleStore((s) => s.loadError);
  const searchQuery = useVehicleStore((s) => s.searchQuery);
  const setSearchQuery = useVehicleStore((s) => s.setSearchQuery);
  const selectedSegment = useVehicleStore((s) => s.selectedSegment);
  const selectedBodyType = useVehicleStore((s) => s.selectedBodyType);
  const setSelectedCategory = useVehicleStore((s) => s.setSelectedCategory);

  const segmentInfo = selectedSegment && selectedBodyType ? getSegmentOption(selectedSegment, selectedBodyType) : null;
  const showResults = Boolean(selectedBodyType || searchQuery);

  const filteredVehicles = useMemo(
    () => filterVehicles(vehicles, searchQuery, selectedSegment, selectedBodyType),
    [vehicles, searchQuery, selectedSegment, selectedBodyType],
  );

  const resetFilters = () => {
    setSelectedCategory(null, null);
    setSearchQuery('');
  };

  const resultsLabel = segmentInfo
    ? t.catalog.segments[`${segmentInfo.segment}-${segmentInfo.bodyType}` as keyof typeof t.catalog.segments] || segmentInfo.label
    : selectedBodyType
      ? t.catalog.bodyTypes[selectedBodyType]
      : 'Arama Sonuçları';

  const showAllResults = (query: string) => {
    setSelectedCategory(null, null);
    setSearchQuery(query);
    requestAnimationFrame(() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  return (
    <>
      <HeroSection />

      {/* 1.3 — Kişisel karşılama ve son incelenenler (yalnızca geçmiş veya oturum varsa) */}
      <WelcomeStrip />

      <FeaturedShowcase />

      <section aria-labelledby="explore-title" className="border-t border-border-subtle">
        <PageContainer spacing="section">
          <SectionHeader id="explore-title" title={t.home.bodyTypesTitle} description={t.home.bodyTypesSubtitle} />

          <div className="mb-10 md:mb-12">
            <InstantSearch onShowAll={showAllResults} />
          </div>

          {loadError && vehicles.length === 0 ? (
            // Firestore'a ulaşılamadıysa boş liste yerine bağlantı hatası + tekrar dene
            <VehicleLoadError compact />
          ) : !showResults ? (
            <SegmentPicker />
          ) : (
            // scroll-mt-20: sticky header (h-16) başlığın üstünü örtmesin
            <div id="catalog" className="scroll-mt-20">
              <m.div {...fadeUp} className="mb-8">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-secondary transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
                  Geri Dön
                </button>
                <p className="eyebrow">{resultsLabel}</p>
                <h2 className="mt-2 text-display-sm font-normal text-foreground">Araç Kataloğu</h2>
                <p className="mt-1 text-sm text-muted">
                  <span className="tabular-nums">{filteredVehicles.length}</span> araç
                  {searchQuery ? ` · "${searchQuery}"` : ''}
                </p>
              </m.div>

              {filteredVehicles.length === 0 ? (
                <div className="border border-border-subtle px-6 py-12 text-center">
                  <p className="text-sm text-muted">Bu klasmanda henüz araç yok veya aramanızla eşleşmedi.</p>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-sm font-medium text-foreground transition-colors hover:text-secondary"
                      >
                        Aramayı temizle
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-sm font-medium text-muted underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      Başka klasman seç
                    </button>
                  </div>
                </div>
              ) : (
                <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredVehicles.map((vehicle, index) => (
                    <li key={vehicle.id}>
                      <VehicleCard vehicle={vehicle} index={index} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </PageContainer>
      </section>
    </>
  );
}
