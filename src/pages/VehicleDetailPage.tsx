import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { FileText, Info, Maximize2, MessageCircle } from 'lucide-react';
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
import { VehicleBrochure } from '../components/print/VehicleBrochure';
import { UnverifiedNote } from '../components/detail/UnverifiedNote';
import { printDocument } from '../lib/print';
import { arrivedViaVehicleTransition } from '../lib/viewTransition';
import { DEFAULT_PLAN, type OwnershipPlan } from '../lib/finance';
import { trustedSpec, type DimensionSpecKey } from '../lib/specTrust';
import { useRecentStore } from '../store/useRecentStore';

/** 2.1 — Danışman çekmecesi ayrı parça: yalnızca ilk açılışta (veya butona yaklaşınca) iner */
const loadAdvisor = () => import('../components/advisor/AdvisorDrawer');
const AdvisorDrawer = lazy(() => loadAdvisor().then((mod) => ({ default: mod.AdvisorDrawer })));
const prefetchAdvisor = () => {
  void loadAdvisor().catch(() => undefined);
};

const DIMENSIONS: { key: DimensionSpecKey; label: string; unit: string }[] = [
  { key: 'lengthMm', label: 'Uzunluk', unit: 'mm' },
  { key: 'widthMm', label: 'Genişlik', unit: 'mm' },
  { key: 'heightMm', label: 'Yükseklik', unit: 'mm' },
  { key: 'wheelbaseMm', label: 'Aks Mesafesi', unit: 'mm' },
  { key: 'bootCapacityL', label: 'Bagaj', unit: 'L' },
  { key: 'curbWeightKg', label: 'Ağırlık', unit: 'kg' },
];
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
  const location = useLocation();
  // 1.1: kart geçişiyle gelindiyse sayfa solması ve hero perdesi atlanır (görsel zaten yerine "uçarak" oturdu)
  const [arrivedViaTransition] = useState(() => arrivedViaVehicleTransition(location.state));
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
  // Finansman / TCO seçimi: panel, A4 broşür ve danışman aynı değerleri kullanır
  const [plan, setPlan] = useState<OwnershipPlan>(DEFAULT_PLAN);
  const updatePlan = (patch: Partial<OwnershipPlan>) => setPlan((current) => ({ ...current, ...patch }));
  // Danışman: ilk açılışta mount edilir, sonra kapanış animasyonu ve konuşma için mount kalır
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [advisorMounted, setAdvisorMounted] = useState(false);
  const openAdvisor = () => {
    setAdvisorMounted(true);
    setIsAdvisorOpen(true);
  };
  const [heroPassed, setHeroPassed] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // Masaüstü yapışkan şerit: hero header'ın altına kaydığında görünür (rootMargin = sticky header yüksekliği)
  const vehicleId = vehicle?.id;

  // 1.3 — "Kaldığınız Yerden": yalnızca bu tarayıcıda (localStorage), Firestore'a yazılmaz
  useEffect(() => {
    if (vehicleId) useRecentStore.getState().record(vehicleId);
  }, [vehicleId]);

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

  const { technicalSections } = vehicle;
  const printBrochure = () => void printDocument(`OtoVadi Teknik Künye — ${vehicleName(vehicle)}`);
  const hasUnverifiedDimensions = DIMENSIONS.some(({ key }) => trustedSpec(vehicle, key) === null);
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
      <m.div {...fade} initial={arrivedViaTransition ? false : fade.initial} transition={TRANSITION.base}>
        <div ref={heroRef}>
          <DetailHero
            vehicle={vehicle}
            onOpenTestDrive={requestTestDrive}
            onOpenGallery={images.length > 0 ? () => setGalleryIndex(0) : undefined}
            imageCount={images.length}
            onPrintBrochure={printBrochure}
            curtain={!arrivedViaTransition}
          />
        </div>

        {/* ── Aksiyon alanı: Atmosfer sahnesi + Danışmana Sor (2.1) + Broşür (1.2, mobilde "Daha fazla" menüsünde) ── */}
        <div className="flex flex-wrap justify-center gap-3 px-4 py-6">
          <button type="button" onClick={() => setIsAtmosphereOpen(true)} className={`group ${secondaryButtonClass}`}>
            <Maximize2 className="size-4 transition-transform group-hover:scale-110" strokeWidth={1.5} aria-hidden />
            Atmosferi Yaşa
          </button>
          <button
            type="button"
            onClick={openAdvisor}
            onPointerEnter={prefetchAdvisor}
            onFocus={prefetchAdvisor}
            onTouchStart={prefetchAdvisor}
            className={secondaryButtonClass}
          >
            <MessageCircle className="size-4" strokeWidth={1.5} aria-hidden />
            Danışmana Sor
          </button>
          <button type="button" onClick={printBrochure} className={`${secondaryButtonClass} hidden md:inline-flex`}>
            <FileText className="size-4" strokeWidth={1.5} aria-hidden />
            Broşürü İndir
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
                  {DIMENSIONS.map(({ key, label, unit }) => {
                    // Cila 1: form varsayılanı (4500 mm, 500 L, 1500 kg…) gerçek ölçü gibi gösterilmez
                    const value = trustedSpec(vehicle, key);
                    return (
                      <div key={key} className="flex flex-col gap-2 border-b border-border-subtle pb-4">
                        <dt className="stat-label">{label}</dt>
                        <dd className="stat-value text-2xl md:text-3xl">
                          {value === null ? (
                            <span className="text-muted" aria-label="Doğrulanmamış">
                              —
                            </span>
                          ) : (
                            <>
                              {value.toLocaleString('tr-TR')}
                              <span className="ml-1 text-base text-muted">{unit}</span>
                            </>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                {hasUnverifiedDimensions && <UnverifiedNote className="mt-6" />}
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

          <OwnershipCostPanel vehicle={vehicle} onApply={requestTestDrive} plan={plan} onPlanChange={updatePlan} />
        </PageContainer>
      </m.div>

      {/* Sabit/portal katmanlar, opaklık animasyonu yapan sayfa kabının dışında tutulur */}
      <MobileActionBar
        vehicle={vehicle}
        onTestDrive={requestTestDrive}
        onAskAdvisor={openAdvisor}
        onPrintBrochure={printBrochure}
        onPrefetchAdvisor={prefetchAdvisor}
      />

      <DetailStickyBar
        vehicle={vehicle}
        visible={heroPassed}
        onTestDrive={requestTestDrive}
        onAskAdvisor={openAdvisor}
        onPrintBrochure={printBrochure}
        onPrefetchAdvisor={prefetchAdvisor}
      />

      {/* 1.2 — A4 Teknik Künye: ekranda görünmez, yalnızca yazdırırken basılır (body'ye portal) */}
      <VehicleBrochure vehicle={vehicle} plan={plan} />

      {advisorMounted && (
        <Suspense fallback={null}>
          <AdvisorDrawer vehicle={vehicle} isOpen={isAdvisorOpen} onClose={() => setIsAdvisorOpen(false)} plan={plan} />
        </Suspense>
      )}

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
