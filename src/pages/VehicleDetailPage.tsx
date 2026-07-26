import { useEffect, useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cog, LayoutGrid, Monitor, Sofa, Volume2 } from 'lucide-react';
import { DetailHero } from '../components/detail/DetailHero';
import { VehicleConfigurator } from '../components/detail/VehicleConfigurator';
import { InteriorMaterials } from '../components/detail/InteriorMaterials';
import { MultimediaList } from '../components/detail/MultimediaList';
import { SpecGrid } from '../components/detail/SpecGrid';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { Accordion } from '../components/ui/Accordion';
import { Tabs } from '../components/ui/Tabs';
import { useVehicleStore } from '../store/useVehicleStore';

const DETAIL_TABS = [
  { id: 'audio', label: 'Ses', icon: <Volume2 className="size-3.5" /> },
  { id: 'tech', label: 'Teknik', icon: <Cog className="size-3.5" /> },
  { id: 'media', label: 'Multimedya', icon: <Monitor className="size-3.5" /> },
  { id: 'interior', label: 'İç Mekan', icon: <Sofa className="size-3.5" /> },
  { id: 'dims', label: 'Boyutlar', icon: <LayoutGrid className="size-3.5" /> },
] as const;

export function VehicleDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const getVehicleBySlug = useVehicleStore((s) => s.getVehicleBySlug);
  const vehicle = slug ? getVehicleBySlug(slug) : undefined;
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(
    tabFromUrl && DETAIL_TABS.some((t) => t.id === tabFromUrl) ? tabFromUrl : 'audio',
  );

  useEffect(() => {
    if (tabFromUrl && DETAIL_TABS.some((t) => t.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

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
            className="flex justify-between gap-4 border-b border-glass-border/50 py-2 last:border-0"
          >
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="text-right text-xs font-medium text-foreground">{item.value}</dd>
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
      <DetailHero vehicle={vehicle} />

      <div className="py-6">
        <VehicleConfigurator vehicle={vehicle} />
      </div>

      <div className="px-4 pb-8 md:px-8 lg:mx-auto lg:max-w-4xl lg:px-12">
        {/* Hızlı özet */}
        <section className="py-6">
          <p className="text-sm leading-relaxed text-muted">{vehicle.shortDescription}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {vehicle.highlights.map((tag) => (
              <span
                key={tag}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                  vehicle.accentColor === 'red' ? 'bg-accent-red/15 text-accent-red' : 'bg-accent/15 text-accent'
                }`}
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
          accentColor={vehicle.accentColor}
        />

        <div className="mt-6">
          {activeTab === 'audio' && (
            <motion.div
              key="audio"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-4"
            >
              <AudioPlayer track={vehicle.audio.idle} accentColor={vehicle.accentColor} />
              <AudioPlayer track={vehicle.audio.exhaust} accentColor={vehicle.accentColor} />
              {vehicle.audio.rev && (
                <AudioPlayer track={vehicle.audio.rev} accentColor={vehicle.accentColor} />
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
                    accentColor={vehicle.accentColor}
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
              <dl className="grid grid-cols-2 gap-3">
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
                    className="glass-panel rounded-xl px-4 py-3"
                  >
                    <dt className="text-[10px] uppercase tracking-wider text-muted">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
