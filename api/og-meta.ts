/**
 * P7 — Sosyal medya önizleme kartı (WhatsApp, X, LinkedIn, Facebook, Telegram, Slack, Discord…).
 *
 * Bu botlar JavaScript çalıştırmaz; SPA'nın index.html'indeki genel kartı görürler. vercel.json'daki rewrite,
 * YALNIZCA bilinen önizleme botlarının User-Agent'ı ile gelen /arac/:id isteklerini buraya yönlendirir
 * (normal ziyaretçiler ve Googlebot SPA'yı alır). Fonksiyon aracı Firestore REST API'sinden okur
 * (vehicles koleksiyonu firestore.rules'ta herkese açık okunur, anahtar gerekmez) ve araca özel OG etiketleri döner.
 * Firestore'a ulaşılamazsa / araç yoksa varsayılan OtoVadi kartına düşer; hiçbir durumda hata sayfası dönmez.
 *
 * Not: api/ altında göreli çalışma zamanı import'u yok (Vercel ESM'de kırılır). Sabitler src/lib/seo.ts ile aynı tutulmalı.
 */

const SITE_URL = 'https://otovadi.vercel.app';
const SITE_NAME = 'OtoVadi';
const DEFAULT_TITLE = 'OtoVadi | Dijital Showroom';
const DEFAULT_DESCRIPTION =
  'OtoVadi dijital showroom: araçları sinematik detay sayfalarında keşfedin, yan yana karşılaştırın, yapay zekâ destekli Akıllı Keşif ile size en uygun modeli bulun ve test sürüşü randevusu alın.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_IMAGE_ALT = 'OtoVadi logosu: çember içinde V monogramı ve OTOVADİ yazısı, siyah zemin üzerinde';

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'otovadi-99993';
const FIRESTORE_TIMEOUT_MS = 3000;
/** Doküman id'leri slug biçimindedir; başka karakterlere izin verilmez (yol enjeksiyonuna karşı) */
const VEHICLE_ID_PATTERN = /^[A-Za-z0-9_-]{1,120}$/;

interface CardData {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  url: string;
  isDefaultImage: boolean;
}

/* ── Firestore REST değer çözümleyici ───────────────────────────────── */

type FirestoreValue = {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  nullValue?: null;
  mapValue?: { fields?: Record<string, FirestoreValue> };
  arrayValue?: { values?: FirestoreValue[] };
};

function decode(value: FirestoreValue | undefined): unknown {
  if (!value) return undefined;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.mapValue) return decodeFields(value.mapValue.fields);
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(decode);
  return undefined;
}

function decodeFields(fields: Record<string, FirestoreValue> | undefined): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields ?? {})) out[key] = decode(value);
  return out;
}

/* ── Yardımcılar ─────────────────────────────────────────────────────── */

function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function clamp(value: string, max = 180): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Yalnızca http(s) mutlak URL veya kök göreli yol kabul edilir */
function toAbsoluteImage(value: string): string | null {
  if (/^https:\/\//i.test(value)) return value;
  if (/^http:\/\//i.test(value)) return value.replace(/^http:/i, 'https:');
  if (value.startsWith('/') && !value.startsWith('//')) return `${SITE_URL}${value}`;
  return null;
}

function defaultCard(url: string): CardData {
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    image: DEFAULT_IMAGE,
    imageAlt: DEFAULT_IMAGE_ALT,
    url,
    isDefaultImage: true,
  };
}

/* ── Firestore'dan araç kartı ────────────────────────────────────────── */

async function loadVehicleCard(id: string, url: string): Promise<CardData | null> {
  const endpoint =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(FIREBASE_PROJECT_ID)}` +
    `/databases/(default)/documents/vehicles/${encodeURIComponent(id)}`;

  const response = await fetch(endpoint, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FIRESTORE_TIMEOUT_MS),
  });
  if (!response.ok) return null;

  const doc = (await response.json()) as { fields?: Record<string, FirestoreValue> };
  const vehicle = decodeFields(doc.fields);

  const name = [text(vehicle.brand), text(vehicle.model)].filter(Boolean).join(' ');
  if (!name) return null;

  const year = typeof vehicle.year === 'number' && vehicle.year > 1900 ? ` (${vehicle.year})` : '';
  const engine = record(vehicle.engine);
  const performance = record(vehicle.performance);
  const facts = [
    typeof engine.powerHp === 'number' && engine.powerHp > 0 ? `${engine.powerHp} HP` : '',
    typeof performance.zeroTo100Kmh === 'number' && performance.zeroTo100Kmh > 0
      ? `0-100 km/s ${String(performance.zeroTo100Kmh).replace('.', ',')} sn`
      : '',
  ].filter(Boolean);

  const summary = text(vehicle.shortDescription) || text(vehicle.tagline);
  const description = clamp([summary, facts.join(' · ')].filter(Boolean).join(' — ') || DEFAULT_DESCRIPTION);

  const media = record(vehicle.media);
  const gallery = Array.isArray(media.gallery) ? media.gallery : [];
  const rawImage = [media.heroImage, media.thumbnail, gallery[0]].map(text).find(Boolean) ?? '';
  const image = rawImage ? toAbsoluteImage(rawImage) : null;

  return {
    title: `${name}${year} | ${SITE_NAME}`,
    description,
    image: image ?? DEFAULT_IMAGE,
    imageAlt: image ? `${name} görseli` : DEFAULT_IMAGE_ALT,
    url,
    isDefaultImage: !image,
  };
}

/* ── HTML ────────────────────────────────────────────────────────────── */

function renderHtml(card: CardData): string {
  const t = escapeHtml(card.title);
  const d = escapeHtml(card.description);
  const u = escapeHtml(card.url);
  const img = escapeHtml(card.image);
  const alt = escapeHtml(card.imageAlt);
  const imageSize = card.isDefaultImage
    ? `\n    <meta property="og:image:type" content="image/jpeg" />\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />`
    : '';

  // Bilinçli olarak meta refresh / yönlendirme yok: aynı URL'ye döner ve bot UA'lı bir istemcide döngü yaratır.
  return `<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${u}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="tr_TR" />
    <meta property="og:url" content="${u}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:alt" content="${alt}" />${imageSize}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />
    <meta name="twitter:image:alt" content="${alt}" />
  </head>
  <body>
    <h1>${t}</h1>
    <p>${d}</p>
    <p><a href="${u}">${u}</a></p>
  </body>
</html>`;
}

/* ── Handler ─────────────────────────────────────────────────────────── */

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get('id') ?? '';
  const validId = VEHICLE_ID_PATTERN.test(id);
  const url = validId ? `${SITE_URL}/arac/${id}` : SITE_URL + '/';

  let card = defaultCard(url);
  let cacheSeconds = 300; // varsayılan karta düşüldüyse kısa önbellek: Firestore düzelince araç kartı hızla gelsin

  if (validId) {
    try {
      const vehicleCard = await loadVehicleCard(id, url);
      if (vehicleCard) {
        card = vehicleCard;
        cacheSeconds = 3600;
      }
    } catch {
      // Zaman aşımı / ağ hatası → varsayılan kart
    }
  }

  return new Response(renderHtml(card), {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // Bilinçli olarak X-Robots-Tag yok: yanıt /arac/:id adresinde sunulur, sayfanın dizinlenmesini etkilememeli
      'Cache-Control': `public, max-age=0, s-maxage=${cacheSeconds}, stale-while-revalidate=86400`,
    },
  });
}
