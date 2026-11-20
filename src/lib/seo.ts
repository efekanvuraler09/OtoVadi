/**
 * P6/P7: Site geneli SEO sabitleri. index.html'deki varsayılan etiketler ve api/og-meta.ts
 * (sosyal medya botları için sunucu tarafı kart) aynı değerleri kullanır; birini değiştirirsen diğerlerini de güncelle.
 * (api/ dosyaları göreli çalışma zamanı import'u yapamadığı için değerler orada kopyalanmıştır.)
 */
export const SITE_URL = 'https://otovadi.vercel.app';
export const SITE_NAME = 'OtoVadi';
export const DEFAULT_TITLE = 'OtoVadi | Dijital Showroom';
export const DEFAULT_DESCRIPTION =
  'OtoVadi dijital showroom: araçları sinematik detay sayfalarında keşfedin, yan yana karşılaştırın, yapay zekâ destekli Akıllı Keşif ile size en uygun modeli bulun ve test sürüşü randevusu alın.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
export const DEFAULT_OG_IMAGE_ALT = 'OtoVadi logosu: çember içinde V monogramı ve OTOVADİ yazısı, siyah zemin üzerinde';

export interface PageMeta {
  /** Sayfa adı; sonuna " | OtoVadi" eklenir. Boşsa varsayılan site başlığı kullanılır. */
  title?: string;
  description?: string;
  /** Mutlak URL veya kök göreli yol (/...) */
  image?: string;
  /** Kişisel veya yönetim sayfaları arama motorlarına kapalı */
  noindex?: boolean;
}

/** Arama sonucu ve paylaşım kartı için açıklamayı ~160 karaktere kısaltır (kelime ortasında kesmez) */
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}
