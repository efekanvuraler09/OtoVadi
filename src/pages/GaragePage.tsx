import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
        <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          {garagedVehicles.map((vehicle, index) => (
            <li key={vehicle.id}>
              <VehicleCard vehicle={vehicle} index={index} />
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
