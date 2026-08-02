import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { DetailHero } from '../components/detail/DetailHero';
import { InteractiveGallery } from '../components/detail/InteractiveGallery';
import { InteriorMaterials } from '../components/detail/InteriorMaterials';
import { MultimediaList } from '../components/detail/MultimediaList';
import { SpecGrid } from '../components/detail/SpecGrid';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { FinanceCalculator } from '../components/detail/FinanceCalculator';
import { Accordion } from '../components/ui/Accordion';
import { Tabs } from '../components/ui/Tabs';
import { TestDriveModal } from '../components/ui/TestDriveModal';
import { useVehicleStore } from '../store/useVehicleStore';

const DETAIL_TABS = [
  { id: 'audio', label: 'Ses' },
  { id: 'tech', label: 'Teknik' },
  { id: 'media', label: 'Multimedya' },
  { id: 'interior', label: 'İç Mekan' },
  { id: 'dims', label: 'Boyutlar' },
] as const;

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const getVehicleById = useVehicleStore((s) => s.getVehicleById);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const vehicle = id ? getVehicleById(id) : undefined;
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(
    tabFromUrl && DETAIL_TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'audio',
  );
  const [isTestDriveOpen, setIsTestDriveOpen] = useState(false);

  useEffect(() => {
    if (tabFromUrl && DETAIL_TABS.some((t) => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted" />
          <p className="font-sans text-xs uppercase tracking-widest text-muted">
            Araç Verileri Yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return <Navigate to="/" replace />;
  }

  const { dimensions, technicalSections } = vehicle;

  const technicalAccordionItems = technicalSections.map((section) => ({
    id: section.id,
    title: section.title,
    content: (
      <dl className="flex flex-col gap-2">
        {section.items.map((item) => (
          <div
            key={item.label}
            className="flex justify-between gap-4 border-b border-border-subtle/30 py-3 last:border-0"
          >
            <dt className="text-xs font-light tracking-wide text-muted">{item.label}</dt>
            <dd className="text-right text-xs font-light tracking-wide text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    ),
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <DetailHero vehicle={vehicle} onOpenTestDrive={() => setIsTestDriveOpen(true)} />

      <div className="py-10">
        <InteractiveGallery vehicle={vehicle} />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 pb-8 py-10 md:px-12 lg:px-24">
        <section className="py-10">
          <p className="font-display text-lg md:text-xl text-gray-500 dark:text-neutral-400 capitalize mb-4">Donanımlar</p>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground/90 font-light tracking-wide mb-8">
            {vehicle.shortDescription}
          </h2>
          <div className="flex flex-wrap gap-8">
            {vehicle.highlights.map((tag) => (
              <span
                key={tag}
                className="text-foreground font-normal"
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        <Tabs
          tabs={[...DETAIL_TABS]}
          activeId={activeTab}
          onChange={setActiveTab}
        />

        <div className="mt-6">
          {activeTab === 'audio' && (
            <motion.div
              key="audio"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              <AudioPlayer track={vehicle.audio.idle} />
              <AudioPlayer track={vehicle.audio.exhaust} />
              {vehicle.audio.rev && (
                <AudioPlayer track={vehicle.audio.rev} />
              )}
            </motion.div>
          )}

          {activeTab === 'tech' && (
            <motion.div
              key="tech"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
            >
              <SpecGrid vehicle={vehicle} />
              {technicalAccordionItems.length > 0 ? (
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-foreground">
                    Ek Teknik Bilgiler
                  </h3>
                  <Accordion
                    items={technicalAccordionItems}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted">Ek teknik bölüm bulunmuyor.</p>
              )}
            </motion.div>
          )}

          {activeTab === 'media' && (
            <motion.div
              key="media"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <MultimediaList
                features={vehicle.multimedia}
                accentColor={vehicle.accentColor}
              />
            </motion.div>
          )}

          {activeTab === 'interior' && (
            <motion.div
              key="interior"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <InteriorMaterials materials={vehicle.interiorMaterials} />
            </motion.div>
          )}

          {activeTab === 'dims' && (
            <motion.div
              key="dims"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <dl className="grid grid-cols-2 gap-x-8 gap-y-12 py-6">
                {[
                  { label: 'Uzunluk', value: `${dimensions.lengthMm} mm` },
                  { label: 'Genişlik', value: `${dimensions.widthMm} mm` },
                  { label: 'Yükseklik', value: `${dimensions.heightMm} mm` },
                  { label: 'Aks Mesafesi', value: `${dimensions.wheelbaseMm} mm` },
                  { label: 'Bagaj', value: `${dimensions.bootCapacityL} L` },
                  { label: 'Ağırlık', value: `${dimensions.curbWeightKg} kg` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 border-b border-border-subtle pb-4"
                  >
                    <dt className="font-display text-lg md:text-xl text-gray-500 dark:text-neutral-400 capitalize">{label}</dt>
                    <dd className="text-4xl md:text-5xl font-light tracking-wide text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          )}
        </div>

        {/* Finance Calculator */}
        <FinanceCalculator price={vehicle.pricing.msrp} />
      </div>

      <TestDriveModal 
        vehicle={vehicle} 
        isOpen={isTestDriveOpen} 
        onClose={() => setIsTestDriveOpen(false)} 
      />
    </motion.div>
  );
}
