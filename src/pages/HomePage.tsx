import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search } from 'lucide-react';
import { HeroSection } from '../components/home/HeroSection';
import { SegmentPicker } from '../components/home/SegmentPicker';
import { VehicleCard } from '../components/home/VehicleCard';
import { getSegmentOption } from '../data/segments';
import { filterVehicles, useVehicleStore } from '../store/useVehicleStore';

export function HomePage() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const searchQuery = useVehicleStore((s) => s.searchQuery);
  const setSearchQuery = useVehicleStore((s) => s.setSearchQuery);
  const selectedSegment = useVehicleStore((s) => s.selectedSegment);
  const setSelectedSegment = useVehicleStore((s) => s.setSelectedSegment);

  const segmentInfo = selectedSegment ? getSegmentOption(selectedSegment) : null;

  const filteredVehicles = useMemo(
    () => filterVehicles(vehicles, searchQuery, selectedSegment),
    [vehicles, searchQuery, selectedSegment],
  );

  return (
    <>
      <HeroSection showCatalogCta={!selectedSegment} />

      {!selectedSegment ? (
        <SegmentPicker />
      ) : (
        <section id="catalog" className="scroll-mt-4 px-4 pt-6 md:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <button
              type="button"
              onClick={() => setSelectedSegment(null)}
              className="mb-4 inline-flex min-h-10 items-center gap-2 text-sm font-medium text-accent"
            >
              <ArrowLeft className="size-4" />
              Klasman Değiştir
            </button>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-left">
                <p className="text-xs font-medium uppercase tracking-wider text-accent">
                  {segmentInfo?.label}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-foreground md:text-2xl">
                  Araç Kataloğu
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {filteredVehicles.length} araç
                  {searchQuery ? ` · "${searchQuery}"` : ''}
                </p>
              </div>

              <div className="glass-panel flex min-h-12 items-center gap-3 rounded-2xl px-4 md:max-w-xs md:flex-1">
                <Search className="size-4 shrink-0 text-muted" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Marka veya model ara..."
                  className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                  aria-label="Araç ara"
                />
              </div>
            </div>
          </motion.div>

          {filteredVehicles.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="glass-panel rounded-3xl px-6 py-12 text-center"
            >
              <p className="text-sm text-muted">
                Bu klasmanda henüz araç yok veya aramanızla eşleşmedi.
              </p>
              <div className="mt-4 flex flex-col items-center gap-2">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-sm font-medium text-accent"
                  >
                    Aramayı temizle
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedSegment(null)}
                  className="text-sm font-medium text-muted underline"
                >
                  Başka klasman seç
                </button>
              </div>
            </motion.div>
          ) : (
            <ul className="flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-6 lg:grid-cols-2 xl:grid-cols-3 xl:gap-8">
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
