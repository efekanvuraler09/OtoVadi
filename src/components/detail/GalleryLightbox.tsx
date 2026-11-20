import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { SmartImage } from '../ui/SmartImage';
import { TRANSITION, fade } from '../../lib/motion';

interface GalleryLightboxProps {
  images: string[];
  /** null → kapalı; sayı → açık ve o görselde */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  title: string;
  colorHex?: string;
}

const navButtonClass =
  'flex size-12 items-center justify-center border border-white/20 bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-white hover:text-black';

/**
 * U4 — Tam ekran galeri. Portal + useBodyScrollLock; ←/→ gezinme, ESC kapatma, kaydırma (swipe), sayaç ve küçük önizleme şeridi.
 * Her zaman koyu sahne (fotoğraf izleme ortamı). Odak açılışta kapat butonuna gider, kapanınca tetikleyen öğeye döner; Tab içeride döner.
 */
export function GalleryLightbox({ images, index, onIndexChange, onClose, title, colorHex }: GalleryLightboxProps) {
  const isOpen = index !== null && images.length > 0;
  const current = isOpen ? Math.min(index, images.length - 1) : 0;
  const count = images.length;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchStartX = useRef<number | null>(null);

  useBodyScrollLock(isOpen);

  const go = (delta: number) => {
    if (count < 2) return;
    onIndexChange((current + delta + count) % count);
  };

  // Klavye: ok tuşları, ESC ve odak tuzağı. Güncel değerler ref üzerinden okunur (dinleyici yalnızca açılışta bağlanır).
  const handlers = useRef({ go, onClose });
  useEffect(() => {
    handlers.current = { go, onClose };
  });

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handlers.current.onClose();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handlers.current.go(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlers.current.go(-1);
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])');
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <m.div
          key="lightbox"
          ref={dialogRef}
          {...fade}
          transition={TRANSITION.base}
          role="dialog"
          aria-modal="true"
          aria-label={`${title} galerisi`}
          className="fixed inset-0 z-modal flex flex-col bg-black pb-safe pt-safe text-white"
        >
          {/* Üst bar: başlık, sayaç, kapat */}
          <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-4 md:px-8">
            <p className="min-w-0 truncate font-display text-base text-white md:text-lg">{title}</p>
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-sm tabular-nums text-white/70" aria-live="polite">
                {current + 1} / {count}
              </span>
              <button ref={closeRef} type="button" onClick={onClose} aria-label="Galeriyi kapat" className={navButtonClass}>
                <X className="size-5" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
          </div>

          {/* Sahne */}
          <div
            className="relative min-h-0 flex-1"
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              const start = touchStartX.current;
              const end = e.changedTouches[0]?.clientX;
              touchStartX.current = null;
              if (start === null || end === undefined) return;
              const delta = end - start;
              if (Math.abs(delta) > 50) go(delta < 0 ? 1 : -1);
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <m.div key={images[current]} {...fade} transition={TRANSITION.fast} className="absolute inset-0">
                <SmartImage
                  src={images[current]}
                  alt={`${title}, görsel ${current + 1} / ${count}`}
                  fit="contain"
                  tone="dark"
                  colorHex={colorHex}
                  priority
                  draggable={false}
                />
              </m.div>
            </AnimatePresence>

            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Önceki görsel"
                  className={`${navButtonClass} absolute left-3 top-1/2 z-10 -translate-y-1/2 md:left-8`}
                >
                  <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Sonraki görsel"
                  className={`${navButtonClass} absolute right-3 top-1/2 z-10 -translate-y-1/2 md:right-8`}
                >
                  <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
                </button>
              </>
            )}
          </div>

          {/* Küçük önizleme şeridi */}
          {count > 1 && (
            <div className="shrink-0 px-4 py-4 md:px-8">
              <ul className="mx-auto flex max-w-full justify-center gap-2 overflow-x-auto scrollbar-none">
                {images.map((src, i) => (
                  <li key={src} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onIndexChange(i)}
                      aria-label={`Görsel ${i + 1}`}
                      aria-current={i === current ? 'true' : undefined}
                      className={`relative block w-20 border transition-opacity md:w-24 ${
                        i === current ? 'border-white opacity-100' : 'border-white/10 opacity-50 hover:opacity-90'
                      }`}
                    >
                      <SmartImage src={src} alt="" aspectRatio="16 / 10" tone="dark" colorHex={colorHex} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
