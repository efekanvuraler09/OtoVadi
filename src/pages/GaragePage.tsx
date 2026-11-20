import { useState } from 'react';
import { ArrowRight, Check, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../types/vehicle';
import { MAX_DOSSIER, dossierHref } from '../lib/dossier';
import { vehicleName } from '../utils/vehicleText';
import { useGarage } from '../context/GarageContext';
import { useAuth } from '../context/AuthContext';
import { useVehicleStore } from '../store/useVehicleStore';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { VehicleCard } from '../components/vehicle/VehicleCard';
import { LoadingState, StatusScreen, VehicleLoadError } from '../components/ui/DataState';
import { primaryButtonClass } from '../components/ui/buttonStyles';

import { usePageMeta } from '../hooks/usePageMeta';
export function GaragePage() {
  usePageMeta({ title: 'Garajım', noindex: true });
  const { user, isLoading: isAuthLoading, openAuthModal } = useAuth();
  const { garagedSlugs } = useGarage();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const loadError = useVehicleStore((s) => s.loadError);

  // Sayfa yenilendiğinde Firebase oturumu birkaç yüz ms sonra gelir; o ana kadar karar verme
  if (isAuthLoading) {
    return <LoadingState label="Oturum kontrol ediliyor..." />;
  }

  if (!user) {
    return (
      <StatusScreen
        eyebrow="Garajım"
        title="Garajınızı görmek için giriş yapın"
        description="Beğendiğiniz araçları kaydedin, dilediğiniz zaman karşılaştırın."
        actions={
          <button type="button" onClick={() => openAuthModal()} className={primaryButtonClass}>
            Giriş Yap
          </button>
        }
      />
    );
  }

  // Garaj geçiş döneminde slug veya id saklayabilir
  const garagedVehicles = vehicles.filter((v) => garagedSlugs.includes(v.slug) || garagedSlugs.includes(v.id));

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Kişisel Koleksiyon"
        title="Garajım"
        description={garagedVehicles.length > 0 ? `${garagedVehicles.length} kayıtlı araç` : undefined}
      />

      {isLoading && vehicles.length === 0 ? (
        <LoadingState compact label="Garaj yükleniyor..." />
      ) : loadError && vehicles.length === 0 ? (
        <VehicleLoadError compact />
      ) : garagedVehicles.length === 0 ? (
        <StatusScreen
          compact
          title="Garajınız şu an boş"
          description="Araç kartlarındaki kaydet simgesiyle beğendiğiniz modelleri buraya ekleyebilirsiniz."
          actions={
            <Link to="/modeller" className={primaryButtonClass}>
              Koleksiyonu Keşfet
              <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
            </Link>
          }
        />
      ) : (
        <>
          <DossierPanel vehicles={garagedVehicles} />
          <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {garagedVehicles.map((vehicle, index) => (
              <li key={vehicle.id}>
                <VehicleCard vehicle={vehicle} index={index} />
              </li>
            ))}
          </ul>
        </>
      )}
    </PageContainer>
  );
}

/**
 * 2.3 — "Özel Dosyamı Hazırla": garajdan en fazla 3 araç seçilir (varsayılan: ilk 3), /dosya sayfası URL parametreleriyle açılır.
 * Seçim yalnızca bu sayfada tutulur; dosyada araç ve finansman ayarları ayrıca değiştirilebilir.
 */
function DossierPanel({ vehicles }: { vehicles: Vehicle[] }) {
  const [chosen, setChosen] = useState<string[] | null>(null);
  const [notice, setNotice] = useState('');
  // Kullanıcı dokunana kadar ilk 3 araç seçili; garajdan çıkarılan araç seçimden de düşer
  const selectedIds = (chosen ?? vehicles.slice(0, MAX_DOSSIER).map((v) => v.id)).filter((id) => vehicles.some((v) => v.id === id));
  const selected = vehicles.filter((v) => selectedIds.includes(v.id));

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      setChosen(selectedIds.filter((x) => x !== id));
      setNotice('');
    } else if (selectedIds.length >= MAX_DOSSIER) {
      setNotice(`Dosyaya en fazla ${MAX_DOSSIER} model eklenebilir; önce birini çıkarın.`);
    } else {
      setChosen([...selectedIds, id]);
      setNotice('');
    }
  };

  return (
    <section aria-labelledby="dossier-panel-title" className="mb-14 border-y border-border-subtle py-8 md:mb-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="max-w-xl">
          <p className="eyebrow mb-3" lang="en">
            Private Office
          </p>
          <h2 id="dossier-panel-title" className="text-display-sm font-normal text-foreground">
            Özel Dosyanız
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-secondary">
            En fazla üç modeli seçin; finansman ve 5 yıllık sahip olma maliyetleriyle tek sayfada, paylaşılabilir ve
            yazdırılabilir bir dosya hazırlayalım.
          </p>
        </div>
        {selected.length > 0 ? (
          <Link to={dossierHref(selected)} className={`${primaryButtonClass} shrink-0`}>
            <FileText className="size-4" strokeWidth={1.5} aria-hidden />
            Özel Dosyamı Hazırla
          </Link>
        ) : (
          <span className={`${primaryButtonClass} shrink-0 cursor-not-allowed opacity-50`} aria-disabled="true">
            <FileText className="size-4" strokeWidth={1.5} aria-hidden />
            Özel Dosyamı Hazırla
          </span>
        )}
      </div>

      {vehicles.length > 1 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Dosyaya eklenecek modeller">
          {vehicles.map((v) => {
            const isSelected = selectedIds.includes(v.id);
            return (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => toggle(v.id)}
                  aria-pressed={isSelected}
                  className={`inline-flex min-h-10 items-center gap-2 border px-3 text-sm transition-colors ${
                    isSelected ? 'border-foreground text-foreground' : 'border-border-subtle text-muted hover:border-border-strong'
                  }`}
                >
                  {isSelected && <Check className="size-3.5" strokeWidth={1.75} aria-hidden />}
                  <span lang="en">{vehicleName(v)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <p role="status" aria-live="polite" className="mt-3 min-h-4 text-2xs text-muted">
        {notice}
      </p>
    </section>
  );
}
