import { flushSync } from 'react-dom';
import { prefetchVehicleDetail } from './routeLoaders';
import { preloadImage } from './imageCache';

/**
 * 1.1 — Kart → detay kesintisiz geçişi (View Transitions API, kütüphanesiz).
 *
 * BrowserRouter (deklaratif) kullanıldığı için React Router'ın `viewTransition` özelliği (data router ister) yerine:
 *   document.startViewTransition(async () => { flushSync(navigate); await hedef hazır })
 * Kaynak kartın görseli/başlığı tıklama anında isimlendirilir; DetailHero aynı isimleri her zaman taşır.
 * Desteklemeyen tarayıcıda veya "hareketi azalt" açıkken hiçbir şey yapılmaz: <Link> normal çalışır.
 */
export const VT_MEDIA = 'vt-vehicle-media';
export const VT_TITLE = 'vt-vehicle-title';

/** Detay sayfasının "kart geçişiyle geldim" işareti (history state; yenilemede eskir) */
const STATE_KEY = 'vehicleTransition';
const ARRIVAL_WINDOW_MS = 4000;

/** Hedef hazır olana kadar ekranın donuk kalabileceği üst sınırlar (tıklama hissi gecikmesin) */
const CHUNK_WAIT_MS = 300;
const READY_WAIT_MS = 450;

export function supportsViewTransitions(): boolean {
  return typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

export function canUseVehicleTransition(): boolean {
  return supportsViewTransitions() && !prefersReducedMotion();
}

export function vehicleTransitionState(): Record<string, number> {
  return { [STATE_KEY]: Date.now() };
}

/** Detay sayfası az önce kart geçişiyle mi açıldı (perde açılışı ve sayfa solması bu durumda atlanır) */
export function arrivedViaVehicleTransition(state: unknown): boolean {
  if (!state || typeof state !== 'object') return false;
  const stamp = (state as Record<string, unknown>)[STATE_KEY];
  return typeof stamp === 'number' && Date.now() - stamp < ARRIVAL_WINDOW_MS;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Koşul sağlanana ya da süre dolana kadar bekler (rAF yerine setTimeout: geçiş sırasında boyama askıdadır) */
async function waitFor(check: () => boolean, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!check() && Date.now() < deadline) {
    await wait(16);
  }
}

interface VehicleTransitionOptions {
  /** Kaynak öğeler (kart görseli ve başlık metni); yoksa yalnızca sayfa çapraz geçişi olur */
  media?: HTMLElement | null;
  title?: HTMLElement | null;
  /** Hedef hero görseli: yeni anlık görüntüde fotoğraf hazır olsun diye önceden yüklenir */
  heroSrc?: string;
  /** Gezinmeyi yapan fonksiyon (navigate) */
  navigate: () => void;
}

export function startVehicleTransition({ media, title, heroSrc, navigate }: VehicleTransitionOptions): void {
  if (!canUseVehicleTransition()) {
    navigate();
    return;
  }

  // Aynı anda tek öğe bu isimleri taşımalı; eski anlık görüntü startViewTransition çağrısında alınır
  if (media) media.style.viewTransitionName = VT_MEDIA;
  if (title) title.style.viewTransitionName = VT_TITLE;
  const heroReady = preloadImage(heroSrc);

  const cleanup = () => {
    if (media) media.style.viewTransitionName = '';
    if (title) title.style.viewTransitionName = '';
  };

  try {
    const transition = document.startViewTransition(async () => {
      // Lazy detay parçası + hero görseli (çoğunlukla hover'da zaten inmiş olur)
      await Promise.race([Promise.all([prefetchVehicleDetail(), heroReady]), wait(CHUNK_WAIT_MS)]);
      cleanup();
      flushSync(navigate);
      // DetailHero görseli çizilene kadar (data-vt-ready) kısa bir süre beklenir; Suspense geçişi bölmez
      await waitFor(() => document.querySelector('[data-vt-ready="true"]') !== null, READY_WAIT_MS);
    });
    // Geçiş atlanırsa (ör. sekme gizli) gezinme yine de gerçekleşmiştir; reddedilen söz konsolu kirletmesin
    transition.ready.catch(() => undefined);
    transition.finished.catch(() => undefined).finally(cleanup);
  } catch {
    cleanup();
    navigate();
  }
}
