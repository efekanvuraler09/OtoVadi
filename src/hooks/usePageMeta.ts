import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  clampDescription,
  type PageMeta,
} from '../lib/seo';

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function removeMetaTag(attr: 'name' | 'property', key: string) {
  document.head.querySelector(`meta[${attr}="${key}"]`)?.remove();
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/**
 * P7: Sayfa başlığı, açıklama, canonical ve OG/Twitter etiketlerini rota bazında günceller
 * (Google JS'i çalıştırarak bunları görür; WhatsApp/X gibi botlar için sunucu tarafı kart api/og-meta.ts'tedir).
 *
 * Her sayfa bileşeni en üstte bir kez çağırır. `null` → bu bileşen meta yazmaz; örneğin detay sayfası kayıt
 * bulunamayınca `null` verir ve içinde render ettiği NotFoundPage kendi başlığını yazar
 * (çocuğun effect'i ebeveynden önce çalıştığı için ebeveyn onu ezmemelidir).
 */
export function usePageMeta(meta: PageMeta | null) {
  const { pathname } = useLocation();
  const enabled = meta !== null;
  const title = meta?.title;
  const description = meta?.description;
  const image = meta?.image;
  const noindex = meta?.noindex ?? false;

  useEffect(() => {
    if (!enabled) return;
    const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
    const desc = clampDescription(description || DEFAULT_DESCRIPTION);
    const url = `${SITE_URL}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`;
    const img = image ? absoluteUrl(image) : DEFAULT_OG_IMAGE;
    const imgAlt = image ? (title ?? SITE_NAME) : DEFAULT_OG_IMAGE_ALT;

    document.title = fullTitle;
    // Boyut/tip yalnızca bilinen varsayılan kart için doğrudur; araç görsellerinde kaldırılır
    if (image) {
      removeMetaTag('property', 'og:image:width');
      removeMetaTag('property', 'og:image:height');
      removeMetaTag('property', 'og:image:type');
    } else {
      setMetaTag('property', 'og:image:width', '1200');
      setMetaTag('property', 'og:image:height', '630');
      setMetaTag('property', 'og:image:type', 'image/jpeg');
    }
    setMetaTag('property', 'og:image:alt', imgAlt);
    setMetaTag('name', 'twitter:image:alt', imgAlt);
    setMetaTag('name', 'description', desc);
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    setMetaTag('property', 'og:title', fullTitle);
    setMetaTag('property', 'og:description', desc);
    setMetaTag('property', 'og:url', url);
    setMetaTag('property', 'og:image', img);
    setMetaTag('name', 'twitter:title', fullTitle);
    setMetaTag('name', 'twitter:description', desc);
    setMetaTag('name', 'twitter:image', img);
    setCanonical(url);
  }, [enabled, title, description, image, noindex, pathname]);
}
