/**
 * Faz 6 — Yüklenmiş görsellerin oturum içi kaydı. SmartImage, daha önce yüklenmiş bir görseli ilk render'da doğrudan
 * görünür çizer (shimmer + opaklık geçişi atlanır). Kart → detay View Transition'ında hedef hero görseli
 * önceden yüklendiği için yeni sayfanın anlık görüntüsü boş kutu değil, gerçek fotoğraf olur.
 */
const loaded = new Set<string>();
const pending = new Map<string, Promise<void>>();

/** SmartImage ile aynı normalizasyon: göreli yolları köke bağlar */
export function normalizeImageSrc(src?: string | null): string | null {
  const value = src?.trim();
  if (!value) return null;
  if (/^(https?:|data:|blob:)/i.test(value) || value.startsWith('/')) return value;
  return `/${value}`;
}

export function markImageLoaded(src: string): void {
  loaded.add(src);
}

export function isImageLoaded(src?: string | null): boolean {
  const resolved = normalizeImageSrc(src);
  return resolved !== null && loaded.has(resolved);
}

/** Görseli arka planda indirip çözer. Hata da "bitti" sayılır (SmartImage kendi yedeğini gösterir). */
export function preloadImage(src?: string | null): Promise<void> {
  const resolved = normalizeImageSrc(src);
  if (!resolved || loaded.has(resolved) || typeof Image === 'undefined') return Promise.resolve();
  const existing = pending.get(resolved);
  if (existing) return existing;

  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      // decode(): ilk boyamada kod çözme beklemesi olmasın
      const done = () => {
        loaded.add(resolved);
        resolve();
      };
      if (typeof img.decode === 'function') img.decode().then(done, done);
      else done();
    };
    img.onerror = () => resolve();
    img.src = resolved;
  }).finally(() => pending.delete(resolved));

  pending.set(resolved, promise);
  return promise;
}
