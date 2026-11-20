import { useCallback, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Vehicle } from '../types/vehicle';
import { canUseVehicleTransition, startVehicleTransition, vehicleTransitionState } from '../lib/viewTransition';
import { prefetchVehicleDetail } from '../lib/routeLoaders';
import { preloadImage } from '../lib/imageCache';

/**
 * 1.1 — Araç kartı linkleri için: hover/focus/dokunuşta detay parçasını ve hero görselini önceden indirir,
 * tıklamada View Transition ile gezinir. Kaynak öğeler `root` içindeki [data-vt="media"] ve [data-vt="title"].
 * Orta tık, Ctrl/⌘ + tık ve "yeni sekmede aç" <Link>'in doğal davranışında kalır.
 */
export function useVehicleTransitionLink(vehicle: Vehicle) {
  const navigate = useNavigate();
  const to = `/arac/${vehicle.id}`;
  // DetailHero'nun çizdiği görselle aynı kaynak
  const heroSrc = vehicle.media?.heroImage;

  const prefetch = useCallback(() => {
    void prefetchVehicleDetail();
    void preloadImage(heroSrc);
  }, [heroSrc]);

  const onClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, root: HTMLElement | null) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (!canUseVehicleTransition()) return;
      event.preventDefault();
      startVehicleTransition({
        media: root?.querySelector<HTMLElement>('[data-vt="media"]'),
        title: root?.querySelector<HTMLElement>('[data-vt="title"]'),
        heroSrc,
        navigate: () => navigate(to, { state: vehicleTransitionState() }),
      });
    },
    [heroSrc, navigate, to],
  );

  return { to, prefetch, onClick };
}
