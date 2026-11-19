import type { VehiclePricing } from '../types/vehicle';

export type Currency = VehiclePricing['currency'];

export const SUPPORTED_CURRENCIES: readonly Currency[] = ['TRY', 'EUR', 'USD'];

/**
 * GEÇİCİ VERİ UYUMLULUK KURALI
 * Admin formu eskiden her kayıtta para birimini zorla "TRY" yazıyordu; bu yüzden Firestore'daki
 * bazı araçlar TRY olarak işaretli olduğu halde tutarları EUR cinsinden (ör. 58.900).
 * TRY olarak işaretli ve bu eşiğin altındaki tutarlar EUR kabul edilir.
 * Admin panelinden araçlar doğru para birimiyle yeniden kaydedildikten sonra bu kural kaldırılabilir.
 */
const LEGACY_TRY_MIN_AMOUNT = 1_000_000;

function isSupportedCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

/** Araç fiyatının gerçek para birimini döndürür (pricing.currency esas alınır). */
export function resolveCurrency(pricing: Pick<VehiclePricing, 'currency' | 'msrp'>): Currency {
  const { currency, msrp } = pricing;

  if (currency === 'TRY' && msrp > 0 && msrp < LEGACY_TRY_MIN_AMOUNT) {
    return 'EUR';
  }
  if (isSupportedCurrency(currency)) {
    return currency;
  }
  // Para birimi alanı hiç yoksa/bozuksa tutara göre tahmin et
  return msrp >= LEGACY_TRY_MIN_AMOUNT ? 'TRY' : 'EUR';
}

/** Tutarı verilen para birimiyle biçimlendirir (ör. "₺2.500.000", "€58.900"). */
export function formatPrice(amount: number, currency: Currency, locale = 'tr-TR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Araç fiyatını kendi para birimiyle biçimlendirir. Para birimini ayrıca yazdırmaya gerek yoktur. */
export function formatVehiclePrice(pricing: Pick<VehiclePricing, 'currency' | 'msrp'>): string {
  return formatPrice(pricing.msrp, resolveCurrency(pricing));
}
