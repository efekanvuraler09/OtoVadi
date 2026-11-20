import type { Vehicle } from '../types/vehicle';
import { resolveCurrency } from '../utils/formatPrice';
import {
  approximateVehicleValueTry,
  bodyFallback,
  brandTier,
  energyKind,
  estimateConsumption,
  type EnergyKind,
} from './vehicleMetrics';
import { hasUnverifiedSpecs, trustedSpec } from './specTrust';

/**
 * Y2 — Türkiye'ye özel 5 yıllık sahip olma maliyeti (TCO). TAMAMI TEMSİLİ TAHMİNDİR:
 * tutarlar bugünkü fiyatlarla (enflasyon/zam yok) hesaplanır, kişisel hasarsızlık indirimi, il, tescil tarihi
 * ve kampanyalar dikkate alınmaz. Varsayılanlar her yıl güncellenmelidir (TCO_REFERENCE_YEAR).
 */
export const TCO_REFERENCE_YEAR = 2026;
export const TCO_YEARS = 5;

export const ANNUAL_KM = { min: 5_000, max: 40_000, step: 1_000, default: 15_000 } as const;

/** Kasım 2026 İstanbul pompa fiyatları ve kamusal AC şarj ortalaması (temsili varsayılan, kullanıcı değiştirebilir) */
export const DEFAULT_UNIT_PRICE: Record<EnergyKind, number> = {
  petrol: 71.2,
  diesel: 95.2,
  electric: 8.5,
};

export const ENERGY_LABEL: Record<EnergyKind, { name: string; unit: string }> = {
  petrol: { name: 'Benzin', unit: 'TL/L' },
  diesel: { name: 'Motorin', unit: 'TL/L' },
  electric: { name: 'Elektrik', unit: 'TL/kWh' },
};

/**
 * 2026 MTV tarifesi, 1–3 yaş, orta değer dilimi (temsili yıllık tutar, TL). Silindir hacmi üst sınırı → tutar.
 * Kaynak: 2026 tebliğiyle ilan edilen dilimlerin yuvarlanmış değerleri; kesin tutar tescil tarihi ve taşıt değerine göre değişir.
 */
const MTV_BY_CC: [maxCc: number, amount: number][] = [
  [1300, 5_750],
  [1600, 11_000],
  [1800, 20_500],
  [2000, 32_400],
  [2500, 48_000],
  [3000, 67_000],
  [3500, 102_000],
  [4000, 160_000],
  [Infinity, 262_000],
];

/** Elektrikli otomobillerde MTV motor gücüne (kW) göre eşdeğer dilimin %25'idir */
const EV_KW_TO_CC: [maxKw: number, equivalentCc: number][] = [
  [70, 1300],
  [85, 1600],
  [105, 1800],
  [120, 2000],
  [150, 2500],
  [180, 3000],
  [210, 3500],
  [240, 4000],
  [Infinity, 5000],
];

/** Kamyonet sınıfı pick-up'lar ağırlığa göre (otomobilden çok daha düşük) vergilendirilir */
const PICKUP_MTV_YEARLY = 4_200;

/** Araç yaşına göre MTV katsayısı (1–3, 4–6, 7–11, 12–15, 16+ yaş) */
function mtvAgeFactor(age: number): number {
  if (age <= 3) return 1;
  if (age <= 6) return 0.7;
  if (age <= 11) return 0.4;
  if (age <= 15) return 0.2;
  return 0.08;
}

function mtvForCc(cc: number): number {
  return (MTV_BY_CC.find(([max]) => cc <= max) ?? MTV_BY_CC[MTV_BY_CC.length - 1])[1];
}

/** Bakım: 15.000 km veya yılda bir periyot, servis başı temsili tutar (TL) */
const SERVICE_INTERVAL_KM = 15_000;
const SERVICE_COST: Record<ReturnType<typeof brandTier>, number> = {
  premium: 22_000,
  performance: 28_000,
  mainstream: 11_000,
};

export interface TcoInput {
  annualKm: number;
  /** TL/L veya TL/kWh */
  unitPrice: number;
}

export interface TcoBreakdownItem {
  id: 'energy' | 'mtv' | 'insurance' | 'maintenance';
  label: string;
  amount: number;
  /** Toplam içindeki pay (0–1) */
  share: number;
  note: string;
}

export interface TcoResult {
  total: number;
  monthly: number;
  items: TcoBreakdownItem[];
  consumption: ReturnType<typeof estimateConsumption>;
  energy: EnergyKind;
  /** Kasko hesabında döviz fiyatı yaklaşık kurla TL'ye çevrildi mi */
  usedApproxFx: boolean;
  /** Faz 6: doğrulanmamış teknik değer yerine gövde tipi ortalaması kullanıldı mı (dipnotta belirtilir) */
  usedFallbackSpecs: boolean;
}

export function calculateTco(vehicle: Vehicle, { annualKm, unitPrice }: TcoInput): TcoResult {
  const energy = energyKind(vehicle);
  const consumption = estimateConsumption(vehicle);
  const totalKm = annualKm * TCO_YEARS;

  // 1) Yakıt / enerji
  const energyCost = (totalKm / 100) * consumption.value * Math.max(0, unitPrice);

  // 2) MTV: 5 yıl boyunca aracın yaşı ilerler
  const startAge = Math.max(1, TCO_REFERENCE_YEAR - (vehicle.year || TCO_REFERENCE_YEAR) + 1);
  let yearlyBase: number;
  let mtvNote: string;
  if (vehicle.bodyType === 'pickup') {
    yearlyBase = PICKUP_MTV_YEARLY;
    mtvNote = 'Kamyonet sınıfı, temsili tutar';
  } else if (energy === 'electric') {
    const kw = trustedSpec(vehicle, 'powerKw') || Math.round((trustedSpec(vehicle, 'powerHp') ?? bodyFallback(vehicle).hp) * 0.7355);
    const cc = (EV_KW_TO_CC.find(([max]) => kw <= max) ?? EV_KW_TO_CC[EV_KW_TO_CC.length - 1])[1];
    yearlyBase = mtvForCc(cc) * 0.25;
    mtvNote = `${kw} kW elektrik motoru, eşdeğer dilimin %25'i`;
  } else {
    const trustedCc = trustedSpec(vehicle, 'displacementCc');
    const cc = trustedCc ?? bodyFallback(vehicle).cc;
    yearlyBase = mtvForCc(cc);
    mtvNote = trustedCc
      ? `${cc.toLocaleString('tr-TR')} cm³ dilimi`
      : `Motor hacmi doğrulanmadı · gövde tipi için temsili ${cc.toLocaleString('tr-TR')} cm³ dilimi`;
  }
  let mtv = 0;
  for (let year = 0; year < TCO_YEARS; year += 1) {
    mtv += yearlyBase * mtvAgeFactor(startAge + year);
  }

  // 3) Kasko: araç değerinin yüzdesi; değer her yıl reel olarak ~%8 düşer
  const value = approximateVehicleValueTry(vehicle);
  const isClassic = Boolean(vehicle.year && vehicle.year < 1990);
  let rate = isClassic ? 0.015 : 0.026;
  if (!isClassic && (trustedSpec(vehicle, 'powerHp') ?? bodyFallback(vehicle).hp) >= 300) rate += 0.006;
  if (vehicle.bodyType === 'muscle-car' || vehicle.bodyType === 'pickup') rate += 0.004;
  let insurance = 0;
  for (let year = 0; year < TCO_YEARS; year += 1) {
    insurance += value * Math.pow(0.92, year) * rate;
  }

  // 4) Periyodik bakım
  const services = Math.max(TCO_YEARS, Math.ceil(totalKm / SERVICE_INTERVAL_KM));
  let serviceCost = SERVICE_COST[brandTier(vehicle)];
  if (energy === 'electric') serviceCost *= 0.5;
  if (isClassic) serviceCost *= 1.5;
  const maintenance = services * serviceCost;

  const raw = [
    {
      id: 'energy' as const,
      label: energy === 'electric' ? 'Enerji (Şarj)' : 'Yakıt',
      amount: energyCost,
      note: `${totalKm.toLocaleString('tr-TR')} km × ${consumption.value.toLocaleString('tr-TR')} ${consumption.unit}/100 km`,
    },
    { id: 'mtv' as const, label: 'Tahmini MTV (5 yıl)', amount: mtv, note: mtvNote },
    {
      id: 'insurance' as const,
      label: 'Tahmini Kasko',
      amount: insurance,
      note: `Yıllık araç değerinin ~%${(rate * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}'i`,
    },
    { id: 'maintenance' as const, label: 'Periyodik Bakım', amount: maintenance, note: `${services} servis ziyareti` },
  ];

  const total = raw.reduce((sum, item) => sum + item.amount, 0);

  return {
    total,
    monthly: total / (TCO_YEARS * 12),
    items: raw.map((item) => ({ ...item, share: total > 0 ? item.amount / total : 0 })),
    consumption,
    energy,
    usedApproxFx: resolveCurrency(vehicle.pricing) !== 'TRY',
    usedFallbackSpecs: !consumption.reliable || hasUnverifiedSpecs(vehicle),
  };
}
