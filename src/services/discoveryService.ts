import type { Vehicle } from '../types/vehicle';
import type {
  DiscoverCatalogItem,
  DiscoverErrorCode,
  DiscoverLocale,
  DiscoverRequest,
  DiscoverSuccessResponse,
} from '../types/discovery';
import { approximateTry, resolveCurrency } from '../utils/formatPrice';

/** Sunucudaki sınırla aynı (api/discover.ts → MAX_QUERY_LENGTH). */
export const DISCOVER_MAX_QUERY_LENGTH = 300;

const ENDPOINT = '/api/discover';
const MAX_CATALOG_ITEMS = 100;
/** Sunucu Gemini'ye en fazla 12 sn bekler; kalan pay ağ ve soğuk başlangıç içindir. */
const CLIENT_TIMEOUT_MS = 15_000;
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,119}$/;
const SEGMENTS = new Set(['b', 'c', 'd', 'e', 'f']);

export type DiscoveryFailureCode = DiscoverErrorCode | 'network' | 'timeout' | 'invalid_response';

export class DiscoveryRequestError extends Error {
  readonly code: DiscoveryFailureCode;
  readonly status: number | null;

  constructor(code: DiscoveryFailureCode, status: number | null = null) {
    super(`Akıllı Keşif isteği başarısız: ${code}${status ? ` (HTTP ${status})` : ''}`);
    this.name = 'DiscoveryRequestError';
    this.code = code;
    this.status = status;
  }
}

const clean = (value: string | undefined) => value?.replace(/\s+/g, ' ').trim() || undefined;

/** Modele gönderilecek sade katalog (görsel, ses, galeri gibi alanlar gönderilmez). */
export function buildDiscoveryCatalog(vehicles: Vehicle[]): DiscoverCatalogItem[] {
  return vehicles
    .filter((v) => typeof v.slug === 'string' && SLUG_PATTERN.test(v.slug))
    .slice(0, MAX_CATALOG_ITEMS)
    .map((v) => {
      const msrp = v.pricing?.msrp;
      const hasPrice = typeof msrp === 'number' && msrp > 0;
      const currency = hasPrice ? resolveCurrency(v.pricing) : undefined;
      return {
        slug: v.slug,
        name: clean(`${v.brand ?? ''} ${v.model ?? ''}`) ?? v.slug,
        year: v.year,
        bodyType: v.bodyType,
        segment: SEGMENTS.has(v.segment) ? v.segment : undefined,
        fuelType: v.engine?.fuelType,
        powerHp: v.engine?.powerHp,
        zeroTo100Kmh: v.performance?.zeroTo100Kmh,
        drivetrain: v.performance?.drivetrain,
        bootCapacityL: v.dimensions?.bootCapacityL,
        price: hasPrice ? msrp : undefined,
        currency,
        approxPriceTry: hasPrice && currency ? Math.round(approximateTry(msrp, currency) / 10_000) * 10_000 : undefined,
        trim: clean(v.pricing?.trim),
        description: clean(v.shortDescription),
        highlights: v.highlights?.map((h) => clean(h)).filter((h): h is string => Boolean(h)).slice(0, 5),
      };
    });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isSuccessResponse(value: unknown): value is DiscoverSuccessResponse {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as Record<string, unknown>;
  return (
    typeof data.slug === 'string' &&
    typeof data.reasoning === 'string' &&
    data.reasoning.trim().length > 0 &&
    isStringArray(data.alternatives) &&
    isStringArray(data.criteria)
  );
}

function readErrorCode(value: unknown): DiscoverErrorCode | null {
  if (typeof value !== 'object' || value === null) return null;
  const code = (value as Record<string, unknown>).error;
  return typeof code === 'string' ? (code as DiscoverErrorCode) : null;
}

/**
 * Akıllı Keşif önerisi ister. Başarısızlıkta DiscoveryRequestError fırlatır (çağıran yerel eşleştirmeye geçer).
 * `signal` iptal edilirse (bileşen kapandı / yeni arama) fırlatılan hata yok sayılmalıdır.
 */
export async function requestDiscovery(
  query: string,
  locale: DiscoverLocale,
  vehicles: Vehicle[],
  signal?: AbortSignal,
): Promise<DiscoverSuccessResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  const forwardAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', forwardAbort, { once: true });

  const payload: DiscoverRequest = { query, locale, catalog: buildDiscoveryCatalog(vehicles) };

  try {
    let response: Response;
    try {
      response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch {
      throw new DiscoveryRequestError(controller.signal.aborted && !signal?.aborted ? 'timeout' : 'network');
    }

    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new DiscoveryRequestError(readErrorCode(data) ?? 'invalid_response', response.status);
    }
    if (!isSuccessResponse(data)) {
      throw new DiscoveryRequestError('invalid_response', response.status);
    }
    return data;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', forwardAbort);
  }
}
