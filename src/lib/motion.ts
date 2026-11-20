/**
 * Ortak animasyon standardı (U8). Yeni animasyonlarda süre/eğri uydurmak yerine buradaki değerleri kullan.
 * - Süreler kısa: 0.2 sn (mikro etkileşim), 0.35 sn (varsayılan), 0.55 sn (büyük yüzey / sahne).
 * - Tek easing eğrisi (EASE_OUT). Tailwind'de `transition` varsayılanı da aynı eğri ve 200ms'dir.
 * - Liste stagger'ı yalnızca ilk 6 öğeye uygulanır; sonrası beklemeden gelir.
 * - Mobilde pahalı olan `filter: blur()` geçişleri kullanılmaz: opacity + translate yeterli.
 * - Hareket azaltma: App.tsx'teki <MotionConfig reducedMotion="user"> transform animasyonlarını kapatır,
 *   opacity korunur. Otomatik oynayan medya / zamanlayıcılar için ayrıca `useReducedMotion()` kontrol edilir.
 */
import type { Transition } from 'framer-motion';

export const DURATION = {
  fast: 0.2,
  base: 0.35,
  slow: 0.55,
} as const;

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const TRANSITION = {
  fast: { duration: DURATION.fast, ease: EASE_OUT },
  base: { duration: DURATION.base, ease: EASE_OUT },
  slow: { duration: DURATION.slow, ease: EASE_OUT },
} satisfies Record<string, Transition>;

const STAGGER_STEP = 0.05;
const STAGGER_MAX_ITEMS = 6;

/** Liste öğesi gecikmesi: ilk 6 öğe 50 ms arayla, sonrakiler 6. öğeyle aynı anda. */
export function staggerDelay(index: number, step = STAGGER_STEP): number {
  return Math.min(Math.max(index, 0), STAGGER_MAX_ITEMS - 1) * step;
}

/** Aşağıdan hafifçe belirme (kart, bölüm, liste öğesi). `transition` ile gecikme eklenebilir. */
export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
} as const;

/** Yalnızca opaklık (sayfa kabı, overlay zemini) */
export const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;
