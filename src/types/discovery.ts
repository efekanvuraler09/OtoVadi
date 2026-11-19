/**
 * Akıllı Keşif API sözleşmesi (istemci ↔ api/discover.ts).
 * Bu dosya yalnızca tip içerir: sunucu fonksiyonu onu `import type` ile kullanır,
 * çalışma zamanında yüklenmez. Buraya değer (const, fonksiyon) EKLEMEYİN.
 */

export type DiscoverLocale = 'tr' | 'en' | 'de';

/** Modele gönderilen sade araç özeti (görsel, ses, galeri gibi alanlar gönderilmez). */
export interface DiscoverCatalogItem {
  slug: string;
  /** Marka + model, boşlukları temizlenmiş */
  name: string;
  year?: number;
  bodyType?: string;
  segment?: string;
  fuelType?: string;
  powerHp?: number;
  zeroTo100Kmh?: number;
  drivetrain?: string;
  bootCapacityL?: number;
  /** Liste fiyatı; para birimi `currency` alanındadır (resolveCurrency ile çözülmüş) */
  price?: number;
  currency?: string;
  /** Yalnızca karşılaştırma için yaklaşık TL karşılığı (farklı para birimli fiyatları ve bütçeleri kıyaslamak için) */
  approxPriceTry?: number;
  trim?: string;
  description?: string;
  highlights?: string[];
}

export interface DiscoverRequest {
  query: string;
  locale: DiscoverLocale;
  catalog: DiscoverCatalogItem[];
}

export interface DiscoverSuccessResponse {
  /** Katalogda bulunduğu sunucuda doğrulanmış slug */
  slug: string;
  reasoning: string;
  /** En fazla 2 alternatif slug (ana öneriden farklı, katalogda var) */
  alternatives: string[];
  /** Sorgudan anlaşılan kısa kriter etiketleri (en fazla 4) */
  criteria: string[];
  /** Yanıtı üreten model kimliği (teşhis için) */
  model: string;
}

export type DiscoverErrorCode =
  | 'method_not_allowed'
  | 'forbidden'
  | 'payload_too_large'
  | 'invalid_json'
  | 'invalid_query'
  | 'query_too_long'
  | 'invalid_catalog'
  | 'rate_limited'
  | 'not_configured'
  | 'upstream_timeout'
  | 'upstream_unavailable'
  | 'upstream_error'
  | 'invalid_model_output';

export interface DiscoverErrorResponse {
  error: DiscoverErrorCode;
}
