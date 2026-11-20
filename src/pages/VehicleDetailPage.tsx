import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, Maximize2 } from 'lucide-react';
import { DetailHero } from '../components/detail/DetailHero';
import { MobileActionBar } from '../components/detail/MobileActionBar';
import { LoadingState, VehicleLoadError } from '../components/ui/DataState';
import { NotFoundPage } from './NotFoundPage';
import { useAuth } from '../context/AuthContext';
import { resolveCurrency } from '../utils/formatPrice';
import { InteractiveGallery } from '../components/detail/InteractiveGallery';
import { InteriorMaterials } from '../components/detail/InteriorMaterials';
import { MultimediaList } from '../components/detail/MultimediaList';
import { SpecGrid } from '../components/detail/SpecGrid';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { FinanceCalculator } from '../components/detail/FinanceCalculator';
import { Accordion } from '../components/ui/Accordion';
import { Tabs } from '../components/ui/Tabs';
import { TestDriveModal } from '../components/ui/TestDriveModal';
import { AtmosphereStage } from '../components/detail/AtmosphereStage';
import { PageContainer } from '../components/layout/PageContainer';
import { secondaryButtonClass } from '../components/ui/buttonStyles';
import { useVehicleStore } from '../store/useVehicleStore';
import { usePlayableTracks } from '../hooks/usePlayableTracks';
import { TRANSITION, fade, fadeUp } from '../lib/motion';

/** Ses sekmesi yalnızca çalınabilir bir kayıt doğrulandığında eklenir (K11) */
const BASE_TABS = [
  { id: 'tech', label: 'Teknik' },
  { id: 'media', label: 'Multimedya' },
  { id: 'interior', label: 'İç Mekan' },
  { id: 'dims', label: 'Boyutlar' },
  { id: 'notes', label: 'Sürücü Notları' },
];
const AUDIO_TAB = { id: 'audio', label: 'Ses' };
const DEFAULT_TAB = 'tech';

const panelMotion = { ...fadeUp, transition: TRANSITION.base };

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isLoading = useVehicleStore((s) => s.isLoading);
  const loadError = useVehicleStore((s) => s.loadError);
  // Listeye abone olunur: Firestore'dan gelen güncellemeler sayfaya da yansır
  const vehicles = useVehicleStore((s) => s.vehicles);
  const vehicle = id ? vehicles.find((v) => v.id === id) : undefined;
  const { user, openAuthModal } = useAuth();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl ?? DEFAULT_TAB);
  const [isTestDriveOpen, setIsTestDriveOpen] = useState(false);
  const [isAtmosphereOpen, setIsAtmosphereOpen] = useState(false);

  const { playable: audioTracks } = usePlayableTracks([vehicle?.audio?.idle, vehicle?.audio?.exhaust, vehicle?.audio?.rev]);
  const tabs = audioTracks.length > 0 ? [BASE_TABS[0], AUDIO_TAB, ...BASE_TABS.slice(1)] : BASE_TABS;
  // URL'deki sekme (ör. ?tab=audio) mevcut değilse varsayılana düşülür
  const currentTab = tabs.some((t) => t.id === activeTab) ? activeTab : DEFAULT_TAB;

  // URL'deki ?tab= değişirse (ör. geri/ileri) aktif sekme ona uyar — effect yerine render sırasında senkron
  const [syncedUrlTab, setSyncedUrlTab] = useState(tabFromUrl);
  if (tabFromUrl !== syncedUrlTab) {
    setSyncedUrlTab(tabFromUrl);
    if (tabFromUrl) setActiveTab(tabFromUrl);
  }

  /** Hero, mobil aksiyon barı ve finans bölümündeki tüm "Test Sürüşü" butonları buradan geçer */
  const requestTestDrive = () => {
    if (!user) {
      openAuthModal('Bu ayrıcalığı yaşamak için lütfen giriş yapın.');
      return;
    }
    setIsTestDriveOpen(true);
  };

  if (isLoading) {
    return <LoadingState label="Araç Verileri Yükleniyor..." />;
  }

  if (!vehicle) {
    // Veri hiç gelemediyse "bulunamadı" demek yanıltıcı olur; önce bağlantı hatasını göster
    if (loadError) {
      return <VehicleLoadError />;
    }
    return (
      <NotFoundPage
        title="Bu araç katalogda bulunamadı"
        description="Araç katalogdan kaldırılmış ya da bağlantı hatalı olabilir. Benzer modelleri keşfetmeye devam edebilirsiniz."
      />
    );
  }

  const { dimensions, technicalSections } = vehicle;

  const technicalAccordionItems = technicalSections.map((section) => ({
    id: section.id,
    title: section.title,
    content: (
      <dl className="flex flex-col">
        {section.items.map((item) => (
          <div key={item.label} className="flex justify-between gap-4 border-b border-border-subtle py-3 last:border-0">
            <dt className="text-sm text-muted">{item.label}</dt>
            <dd className="text-right text-sm tabular-nums text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    ),
  }));

  return (
    <>
      <motion.div {...fade} transition={TRANSITION.base}>
        <DetailHero vehicle={vehicle} onOpenTestDrive={requestTestDrive} />

        {/* ── Atmosfer Sahne Butonu ── */}
        <div className="flex justify-center py-6">
          <button type="button" onClick={() => setIsAtmosphereOpen(true)} className={`group ${secondaryButtonClass}`}>
            <Maximize2 className="size-4 transition-transform group-hover:scale-110" strokeWidth={1.5} aria-hidden />
            Atmosferi Yaşa
          </button>
        </div>

        <InteractiveGallery vehicle={vehicle} />

        <PageContainer spacing="none" className="pb-16 pt-12 md:pb-24 md:pt-16">
          <section className="mb-12 md:mb-16">
            <p className="eyebrow mb-4">Donanımlar</p>
            <h2 className="max-w-4xl text-display-sm font-light text-foreground">{vehicle.shortDescription}</h2>
            {vehicle.highlights.length > 0 && (
              <ul className="mt-8 flex flex-wrap gap-2">
                {vehicle.highlights.map((tag) => (
                  <li key={tag} className="border border-border-subtle px-3 py-1.5 text-sm text-secondary">
                    {tag}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Tabs tabs={tabs} activeId={currentTab} onChange={setActiveTab} />

          <div className="mt-8">
            {currentTab === 'audio' && (
              <motion.div key="audio" {...panelMotion} className="flex flex-col gap-6">
                {audioTracks.map((track) => (
                  <AudioPlayer key={track.id} track={track} />
                ))}
              </motion.div>
            )}

            {currentTab === 'tech' && (
              <motion.div key="tech" {...panelMotion} className="flex flex-col gap-10">
                <SpecGrid vehicle={vehicle} />
                {technicalAccordionItems.length > 0 ? (
                  <div>
                    <h3 className="mb-4 text-sm font-semibold text-foreground">Ek Teknik Bilgiler</h3>
                    <Accordion items={technicalAccordionItems} />
                  </div>
                ) : (
                  <p className="text-sm text-muted">Ek teknik bölüm bulunmuyor.</p>
                )}
              </motion.div>
            )}

            {currentTab === 'media' && (
              <motion.div key="media" {...panelMotion}>
                <MultimediaList features={vehicle.multimedia} accentColor={vehicle.accentColor} />
              </motion.div>
            )}

            {currentTab === 'interior' && (
              <motion.div key="interior" {...panelMotion}>
                <InteriorMaterials materials={vehicle.interiorMaterials} />
              </motion.div>
            )}

            {currentTab === 'dims' && (
              <motion.div key="dims" {...panelMotion}>
                <dl className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-3">
                  {[
                    { label: 'Uzunluk', value: dimensions.lengthMm, unit: 'mm' },
                    { label: 'Genişlik', value: dimensions.widthMm, unit: 'mm' },
                    { label: 'Yükseklik', value: dimensions.heightMm, unit: 'mm' },
                    { label: 'Aks Mesafesi', value: dimensions.wheelbaseMm, unit: 'mm' },
                    { label: 'Bagaj', value: dimensions.bootCapacityL, unit: 'L' },
                    { label: 'Ağırlık', value: dimensions.curbWeightKg, unit: 'kg' },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="flex flex-col gap-2 border-b border-border-subtle pb-4">
                      <dt className="stat-label">{label}</dt>
                      <dd className="stat-value text-2xl md:text-3xl">
                        {value?.toLocaleString('tr-TR')}
                        <span className="ml-1 text-base text-muted">{unit}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </motion.div>
            )}

            {currentTab === 'notes' && (
              <motion.div key="notes" {...panelMotion} className="flex flex-col gap-4">
                {(vehicle.driverNotes && vehicle.driverNotes.length > 0
                  ? vehicle.driverNotes
                  : [{ title: 'Bilgi Bulunamadı', description: 'Bu araç için henüz kaydedilmiş bir sürücü notu bulunmamaktadır.' }]
                ).map((note, idx) => (
                  <div key={idx} className="flex items-start gap-5 border-l-2 border-foreground/20 bg-surface p-6 md:p-8">
                    <Info className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display text-lg font-normal text-foreground">{note.title}</h3>
                      <p className="text-sm leading-relaxed text-secondary md:text-base">{note.description}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          <FinanceCalculator price={vehicle.pricing.msrp} currency={resolveCurrency(vehicle.pricing)} onApply={requestTestDrive} />
        </PageContainer>
      </motion.div>

      {/* Sabit/portal katmanlar, opaklık animasyonu yapan sayfa kabının dışında tutulur */}
      <MobileActionBar vehicle={vehicle} onTestDrive={requestTestDrive} />

      <TestDriveModal vehicle={vehicle} isOpen={isTestDriveOpen} onClose={() => setIsTestDriveOpen(false)} />

      <AtmosphereStage vehicle={vehicle} isOpen={isAtmosphereOpen} onClose={() => setIsAtmosphereOpen(false)} />
    </>
  );
}
