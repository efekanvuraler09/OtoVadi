import { useEffect } from 'react';

/*
 * Birden fazla katman aynı anda kilit isteyebilir (ör. menü + modal).
 * Sayaç sayesinde son katman kapanana kadar sayfa kilitli kalır.
 */
let lockCount = 0;
let savedStyles: { overflow: string; paddingRight: string } | null = null;

/** active=true iken arka plandaki sayfanın kaydırılmasını engeller. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const { body, documentElement } = document;

    if (lockCount === 0) {
      // Kaydırma çubuğu kaybolunca sayfanın yana kaymasını önle
      const scrollbarWidth = window.innerWidth - documentElement.clientWidth;
      savedStyles = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
      body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0 && savedStyles) {
        body.style.overflow = savedStyles.overflow;
        body.style.paddingRight = savedStyles.paddingRight;
        savedStyles = null;
      }
    };
  }, [active]);
}
