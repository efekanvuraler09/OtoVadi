/**
 * Lazy sayfa parçalarının yükleyicileri (App.tsx'teki lazyPage ve önceden indirme aynı fonksiyonu paylaşır).
 * Dinamik import'un sonucu modül önbelleğinde tutulduğu için tekrar çağırmak ağ isteği üretmez.
 */
export const loadVehicleDetail = () => import('../pages/VehicleDetailPage');
export const loadModels = () => import('../pages/ModelsPage');
export const loadDossier = () => import('../pages/DossierPage');

let detailPromise: Promise<unknown> | null = null;

/** Kart hover/focus/dokunuşunda detay parçasını önceden indirir (hata sessizce yutulur, gerçek gezinmede tekrar denenir) */
export function prefetchVehicleDetail(): Promise<unknown> {
  if (!detailPromise) {
    detailPromise = loadVehicleDetail().catch(() => {
      detailPromise = null;
    });
  }
  return detailPromise;
}
