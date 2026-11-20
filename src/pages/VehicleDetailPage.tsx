import { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { Info, Maximize2 } from 'lucide-react';
import { DetailHero } from '../components/detail/DetailHero';
import { MobileActionBar } from '../components/detail/MobileActionBar';
import { LoadingState, VehicleLoadError } from '../components/ui/DataState';
import { NotFoundPage } from './NotFoundPage';
import { useAuth } from '../context/AuthContext';
import { InteractiveGallery } from '../components/detail/InteractiveGallery';
import { InteriorMaterials } from '../components/detail/InteriorMaterials';
import { MultimediaList } from '../components/detail/MultimediaList';
import { SpecGrid } from '../components/detail/SpecGrid';
import { AudioPlayer } from '../components/audio/AudioPlayer';
import { OwnershipCostPanel } from '../components/detail/OwnershipCostPanel';
import { GalleryLightbox } from '../components/detail/GalleryLightbox';
import { PerformanceBenchmark } from '../components/detail/PerformanceBenchmark';
import { DetailStickyBar } from '../components/detail/DetailStickyBar';
import { vehicleImages } from '../lib/vehicleMetrics';
import { Accordion } from '../components/ui/Accordion';
import { Tabs } from '../components/ui/Tabs';
import { TestDriveModal } from '../components/ui/TestDriveModal';
import { AtmosphereStage } from '../components/detail/AtmosphereStage';
import { PageContainer } from '../components/layout/PageContainer';
import { secondaryButtonClass } from '../components/ui/buttonStyles';
import { useVehicleStore } from '../store/useVehicleStore';
import { usePlayableTracks } from '../hooks/usePlayableTracks';
import { TRANSITION, fade, fadeUp } from '../lib/motion';

import { usePageMeta } from '../hooks/usePageMeta';
import { cleanText, vehicleName } from '../utils/vehicleText';
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

  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const [heroPassed, setHeroPassed] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Masaüstü yapışkan şerit: hero header'ın altına kaydığında görünür (rootMargin = sticky header yüksekliği)
  const vehicleId = vehicle?.id;
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroPassed(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { rootMargin: '-64px 0px 0px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [vehicleId]);

  const { playable: audioTracks } = usePlayableTracks([vehicle?.audio?.idle, vehicle?.audio?.exhaust, vehicle?.audio?.rev]);
  // U4: içeriği boş sekmeler (admin'den eklenen araçlarda multimedya / iç mekan / sürücü notu) hiç gösterilmez
  const baseTabs = BASE_TABS.filter((tab) => {
    if (tab.id === 'media') return (vehicle?.multimedia?.length ?? 0) > 0;
    if (tab.id === 'interior') return (vehicle?.interiorMaterials?.length ?? 0) > 0;
    if (tab.id === 'notes') return (vehicle?.driverNotes?.length ?? 0) > 0;
    return true;
  });
  const tabs = audioTracks.length > 0 ? [baseTabs[0], AUDIO_TAB, ...baseTabs.slice(1)] : baseTabs;
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

  // Kayıt yoksa null: içeride render edilen NotFoundPage kendi başlığını yazar
  usePageMeta(
    vehicle
      ? {
          title: vehicleName(vehicle),
          description: cleanText(vehicle.shortDescription) || cleanText(vehicle.tagline),
          image: vehicle.media?.heroImage || vehicle.media?.thumbnail,
        }
      : isLoading
        ? { title: 'Araç Detayı' }
        : loadError
          ? { title: 'Bağlantı Hatası', noindex: true }
          : null,
  );

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
  const images = vehicleImages(vehicle);
  const studioImage = vehicle.interactiveGallery?.studioImage?.trim();
  const studioIndex = studioImage ? Math.max(0, images.indexOf(studioImage)) : 0;

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
      <m.div {...fade} transition={TRANSITION.base}>
        <div ref={heroRef}>
          <DetailHero
            vehicle={vehicle}
            onOpenTestDrive={requestTestDrive}
            onOpenGallery={images.length > 0 ? () => setGalleryIndex(0) : undefined}
            imageCount={images.length}
          />
        </div>

        {/* ── Atmosfer Sahne Butonu ── */}
        <div className="flex justify-center py-6">
          <button type="button" onClick={() => setIsAtmosphereOpen(true)} className={`group ${secondaryButtonClass}`}>
            <Maximize2 className="size-4 transition-transform group-hover:scale-110" strokeWidth={1.5} aria-hidden />
            Atmosferi Yaşa
          </button>
        </div>

        <InteractiveGallery vehicle={vehicle} onExpand={() => setGalleryIndex(studioIndex)} />

        <PageContainer spacing="none" className="pb-16 pt-12 md:pb-24 md:pt-16">
          <section className="mb-12 md:mb-16">
            <p className="eyebrow mb-4">Donanımlar</p>
            <h2 className="max-w-4xl text-display-sm font-normal text-foreground">{vehicle.shortDescription}</h2>
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
              <m.div key="audio" {...panelMotion} className="flex flex-col gap-6">
                {audioTracks.map((track) => (
                  <AudioPlayer key={track.id} track={track} />
                ))}
              </m.div>
            )}

            {currentTab === 'tech' && (
              <m.div key="tech" {...panelMotion} className="flex flex-col gap-10">
                <SpecGrid vehicle={vehicle} />
                <PerformanceBenchmark vehicle={vehicle} vehicles={vehicles} />
                {technicalAccordionItems.length > 0 ? (
                  <div>
                    <h3 className="mb-4 font-sans text-sm font-semibold text-foreground">Ek Teknik Bilgiler</h3>
                    <Accordion items={technicalAccordionItems} />
                  </div>
                ) : (
                  <p className="text-sm text-muted">Ek teknik bölüm bulunmuyor.</p>
                )}
              </m.div>
            )}

            {currentTab === 'media' && (
              <m.div key="media" {...panelMotion}>
                <MultimediaList features={vehicle.multimedia} accentColor={vehicle.accentColor} />
              </m.div>
            )}

            {currentTab === 'interior' && (
              <m.div key="interior" {...panelMotion}>
                <InteriorMaterials materials={vehicle.interiorMaterials} />
              </m.div>
            )}

            {currentTab === 'dims' && (
              <m.div key="dims" {...panelMotion}>
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
              </m.div>
            )}

            {currentTab === 'notes' && (
              <m.div key="notes" {...panelMotion} className="flex flex-col gap-4">
                {/* Sekme yalnızca not varsa gösterilir (boş sekme gizleme) */}
                {(vehicle.driverNotes ?? []).map((note, idx) => (
                  <div key={idx} className="flex items-start gap-5 border-l-2 border-foreground/20 bg-surface p-6 md:p-8">
                    <Info className="mt-0.5 size-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
                    <div className="flex flex-col gap-2">
                      <h3 className="font-display text-lg font-normal text-foreground">{note.title}</h3>
                      <p className="text-sm leading-relaxed text-secondary md:text-base">{note.description}</p>
                    </div>
                  </div>
                ))}
              </m.div>
            )}
          </div>

          <OwnershipCostPanel vehicle={vehicle} onApply={requestTestDrive} />
        </PageContainer>
      </m.div>

      {/* Sabit/portal katmanlar, opaklık animasyonu yapan sayfa kabının dışında tutulur */}
      <MobileActionBar vehicle={vehicle} onTestDrive={requestTestDrive} />

      <DetailStickyBar vehicle={vehicle} visible={heroPassed} onTestDrive={requestTestDrive} />

      <GalleryLightbox
        images={images}
        index={galleryIndex}
        onIndexChange={setGalleryIndex}
        onClose={() => setGalleryIndex(null)}
        title={vehicleName(vehicle)}
        colorHex={vehicle.media?.colorHex}
      />

      <TestDriveModal vehicle={vehicle} isOpen={isTestDriveOpen} onClose={() => setIsTestDriveOpen(false)} />

      <AtmosphereStage vehicle={vehicle} isOpen={isAtmosphereOpen} onClose={() => setIsAtmosphereOpen(false)} />
    </>
  );
}
