import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/** location.key → son kaydırma konumu (oturum boyunca bellekte tutulur) */
const savedPositions = new Map<string, number>();

/** Geri dönülen sayfa henüz yeterince uzun değilse konumu birkaç kare boyunca yeniden dener */
const MAX_RESTORE_FRAMES = 30;

function scrollToTop() {
  // 'instant': html { scroll-behavior: smooth } ayarına rağmen sayfa geçişinde animasyonsuz kaydırır
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}

/**
 * Scroll restoration:
 * - Yeni sayfaya geçişte (PUSH/REPLACE) en üste kaydırır.
 * - Tarayıcı geri/ileri (POP) ile dönüldüğünde sayfanın önceki kaydırma konumunu geri yükler.
 * - URL'de #hash varsa ilgili öğeye kaydırır.
 * - state.preserveScroll ile yapılan REPLACE (sayfa içi URL durumu) konumu değiştirmez (Faz 6, /dosya).
 */
export function ScrollManager() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const activeKey = useRef(location.key);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const handleScroll = () => {
      savedPositions.set(activeKey.current, window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useLayoutEffect(() => {
    activeKey.current = location.key;
    let frame = 0;

    const savedY = savedPositions.get(location.key);

    if (navigationType === 'POP' && savedY !== undefined) {
      let attempts = 0;
      const restore = () => {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
        attempts += 1;
        if (Math.abs(window.scrollY - savedY) > 1 && attempts < MAX_RESTORE_FRAMES) {
          frame = requestAnimationFrame(restore);
        }
      };
      restore();
    } else if (navigationType === 'REPLACE' && (location.state as { preserveScroll?: boolean } | null)?.preserveScroll) {
      // Sayfa içi durum güncellemesi (ör. /dosya sürgüleri URL'ye yazılırken): konum korunur
    } else if (location.hash) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target) {
        target.scrollIntoView();
      } else {
        scrollToTop();
      }
    } else {
      scrollToTop();
    }

    return () => cancelAnimationFrame(frame);
  }, [location.key, location.hash, location.state, navigationType]);

  return null;
}
