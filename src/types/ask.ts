/**
 * 2.1 — "Bu Araca Sorun" danışman API sözleşmesi (istemci ↔ api/ask.ts). Yalnızca tip içerir; api/ bu dosyayı
 * `import type` ile kullanır (göreli çalışma zamanı import'u yok).
 */
export type AskLocale = 'tr' | 'en' | 'de';

/**
 * İstemcide hesaplanan temsili maliyet tahminleri. Sunucu yalnızca SAYI kabul eder ve aralık dışını atar
 * (metin alanı yok → istem enjeksiyonu taşıyamaz). Tutarlar TL; finansman tutarı aracın kendi para birimindedir.
 */
export interface AskEstimates {
  annualKm?: number;
  tcoTotalTry?: number;
  tcoMonthlyTry?: number;
  /** Doğrulanmış teknik değerlerden hesaplandıysa gönderilir */
  consumptionPer100Km?: number;
  consumptionUnit?: 'L' | 'kWh';
  financeMonthly?: number;
  financeTermMonths?: number;
  financeDownPercent?: number;
}

export interface AskRequest {
  /** Doküman id veya slug; araç kaydı sunucuda Firestore'dan okunur (istemci bağlamına güvenilmez) */
  vehicleId: string;
  question: string;
  locale: AskLocale;
  estimates?: AskEstimates;
}

export interface AskSuccessResponse {
  answer: string;
  /** Yanıtın dayandığı kayıt alanları (ör. "powerHp", "bootCapacityL") */
  usedFields: string[];
  /** Soru kayıttaki bilgilerle (tamamen veya kısmen) yanıtlanamadı */
  unknown: boolean;
  model: string;
}

export type AskErrorCode =
  | 'method_not_allowed'
  | 'forbidden'
  | 'rate_limited'
  | 'payload_too_large'
  | 'invalid_json'
  | 'invalid_question'
  | 'question_too_long'
  | 'invalid_vehicle'
  | 'vehicle_not_found'
  | 'vehicle_unavailable'
  | 'not_configured'
  | 'upstream_timeout'
  | 'upstream_unavailable'
  | 'upstream_error'
  | 'invalid_model_output';

export interface AskErrorResponse {
  error: AskErrorCode;
}
