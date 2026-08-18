import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { HeroSection } from '../components/home/HeroSection';
import { SegmentPicker } from '../components/home/SegmentPicker';
import { VehicleCard } from '../components/home/VehicleCard';
import { getSegmentOption } from '../data/segments';
import { filterVehicles, useVehicleStore } from '../store/useVehicleStore';
import { useI18n } from '../i18n/useI18n';

export function HomePage() {
  const { t } = useI18n();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const searchQuery = useVehicleStore((s) => s.searchQuery);
  const setSearchQuery = useVehicleStore((s) => s.setSearchQuery);
  const selectedSegment = useVehicleStore((s) => s.selectedSegment);
  const selectedBodyType = useVehicleStore((s) => s.selectedBodyType);
  const setSelectedCategory = useVehicleStore((s) => s.setSelectedCategory);

  const segmentInfo = (selectedSegment && selectedBodyType) ? getSegmentOption(selectedSegment, selectedBodyType) : null;

  const filteredVehicles = useMemo(
    () => filterVehicles(vehicles, searchQuery, selectedSegment, selectedBodyType),
    [vehicles, searchQuery, selectedSegment, selectedBodyType],
  );

  return (
    <>
      <HeroSection showCatalogCta={!selectedSegment} />

      {/* GLOBAL SEARCH BAR */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-12 pb-4">
        <div className="border border-border-subtle bg-transparent flex min-h-14 items-center gap-4 rounded-none px-6 w-full hover:border-foreground/50 transition-colors focus-within:border-foreground">
          <Search className="size-5 shrink-0 text-muted" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.catalog.searchPlaceholder}
            className="w-full bg-transparent font-display text-base font-light tracking-wide text-foreground outline-none placeholder:text-muted"
            aria-label="Araç ara"
          />
        </div>
      </div>

      {!selectedBodyType && !searchQuery ? (
        <SegmentPicker />
      ) : (
        <section id="catalog" className="scroll-mt-4 px-4 pt-6 md:px-8 lg:px-12 py-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            {(selectedBodyType || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(null, null);
                  setSearchQuery('');
                }}
                className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Geri Dön
              </button>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-left">
                <p className="text-xs font-medium uppercase tracking-mb-wider text-muted">
                  {segmentInfo ? segmentInfo.label : (searchQuery ? 'Arama Sonuçları' : '')}
                </p>
                <h2 className="mt-1 text-xl font-display font-light tracking-wide text-foreground md:text-2xl">
                  Araç Kataloğu
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {filteredVehicles.length} araç
                  {searchQuery ? ` · "${searchQuery}"` : ''}
                </p>
              </div>
            </div>
          </motion.div>

          {filteredVehicles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="border border-border-subtle rounded-none px-6 py-12 text-center"
            >
              <p className="text-sm text-muted">
                Bu klasmanda henüz araç yok veya aramanızla eşleşmedi.
              </p>
              <div className="mt-4 flex flex-col items-center gap-2">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
                  >
                    Aramayı temizle
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(null, null);
                    setSearchQuery('');
                  }}
                  className="text-sm font-medium text-muted underline hover:text-foreground transition-colors"
                >
                  Başka klasman seç
                </button>
              </div>
            </motion.div>
          ) : (
            <ul className="flex flex-col gap-12 md:grid md:grid-cols-2 md:gap-16 lg:grid-cols-2 xl:grid-cols-3">
              {filteredVehicles.map((vehicle, index) => (
                <li key={vehicle.id} className="w-full">
                  <VehicleCard vehicle={vehicle} index={index} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
