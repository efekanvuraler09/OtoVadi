import type { Vehicle } from '../types/vehicle';
import { approximateTry, resolveCurrency } from '../utils/formatPrice';
import { cleanText } from '../utils/vehicleText';
import { trustedSpec } from './specTrust';

/**
 * Araç verisinden türetilen ortak ölçüler (Faz 5). Firestore'da yakıt tüketimi alanı YOK; tüketim burada
 * güç, ağırlık, motor hacmi, gövde ve yakıt tipinden deterministik olarak TAHMİN edilir. Arayüzde her zaman
 * "tahmini" olarak etiketlenmelidir.
 */

/** Galeri/lightbox için aracın tüm benzersiz görselleri (hero → stüdyo → galeri → küçük resim). */
export function vehicleImages(vehicle: Vehicle): string[] {
  const candidates = [
    vehicle.media?.heroImage,
    vehicle.interactiveGallery?.studioImage,
    ...(vehicle.media?.gallery ?? []),
    vehicle.media?.thumbnail,
  ];
  const seen = new Set<string>();
  for (const src of candidates) {
    const value = src?.trim();
    if (value) seen.add(value);
  }
  return [...seen];
}

export type EnergyKind = 'petrol' | 'diesel' | 'electric';

/** Yakıt/enerji maliyetinin hangi birim fiyattan hesaplanacağı (hibritler benzinle çalışır). */
export function energyKind(vehicle: Vehicle): EnergyKind {
  const fuel = vehicle.engine?.fuelType;
  if (fuel === 'electric') return 'electric';
  if (fuel === 'diesel') return 'diesel';
  return 'petrol';
}

export interface ConsumptionEstimate {
  /** 100 km'deki tahmini tüketim */
  value: number;
  /** L (benzin/dizel/hibrit) veya kWh (elektrik) */
  unit: 'L' | 'kWh';
  /**
   * Faz 6: güç ve ağırlık doğrulanmış değerlerden mi geldi. false → doğrulanmamış (şablon) değerler yerine
   * gövde tipi ortalaması kullanıldı; Düello bu satırı kıyaslamaz, TCO dipnotta belirtir.
   */
  reliable: boolean;
}

const positive = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

/** Teknik değer doğrulanmamışsa kullanılan gövde tipi ortalamaları (güç HP, ağırlık kg, motor hacmi cc) */
const BODY_FALLBACK: Record<string, { hp: number; kg: number; cc: number }> = {
  'muscle-car': { hp: 420, kg: 1750, cc: 5700 },
  pickup: { hp: 200, kg: 2200, cc: 2800 },
  suv: { hp: 180, kg: 1700, cc: 1800 },
  sedan: { hp: 150, kg: 1450, cc: 1600 },
  hatchback: { hp: 130, kg: 1300, cc: 1400 },
};

export function bodyFallback(vehicle: Vehicle): { hp: number; kg: number; cc: number } {
  return BODY_FALLBACK[vehicle.bodyType] ?? BODY_FALLBACK.sedan;
}

/**
 * Temsili karma tüketim (WLTP benzeri, L/100 km veya kWh/100 km). Güç ve ağırlık arttıkça artar; büyük hacimli
 * motorlar, pick-up/SUV gövdeler ve klasik (1990 öncesi) araçlar ek pay alır. Dizel ve hibrit daha verimlidir.
 * Yalnızca doğrulanmış teknik değerler kullanılır (lib/specTrust.ts); eksikse gövde tipi ortalaması devreye girer.
 */
export function estimateConsumption(vehicle: Vehicle): ConsumptionEstimate {
  const fallback = bodyFallback(vehicle);
  const trustedHp = trustedSpec(vehicle, 'powerHp');
  const trustedKg = trustedSpec(vehicle, 'curbWeightKg');
  const hp = trustedHp ?? fallback.hp;
  const kg = trustedKg ?? fallback.kg;
  const reliable = trustedHp !== null && trustedKg !== null;

  if (energyKind(vehicle) === 'electric') {
    const kwh = 13.5 + 0.0045 * (kg - 1500) + 0.006 * Math.max(0, hp - 200);
    return { value: round1(clamp(kwh, 12, 28)), unit: 'kWh', reliable };
  }

  const litres = (trustedSpec(vehicle, 'displacementCc') ?? fallback.cc) / 1000;
  let consumption = 4.2 + 0.0105 * hp + 0.0011 * (kg - 1300) + 0.6 * Math.max(0, litres - 2);

  if (vehicle.bodyType === 'pickup') consumption += 1.0;
  else if (vehicle.bodyType === 'suv') consumption += 0.6;
  if (vehicle.year && vehicle.year < 1990) consumption *= 1.6;

  switch (vehicle.engine?.fuelType) {
    case 'diesel':
      consumption *= 0.82;
      break;
    case 'hybrid':
      consumption *= 0.72;
      break;
    case 'plug-in-hybrid':
      consumption *= 0.45;
      break;
  }

  return { value: round1(clamp(consumption, 3, 24)), unit: 'L', reliable };
}

/** Aracın yaklaşık TL değeri (kasko ve kıyas için). Döviz fiyatlarda YAKLAŞIK kur kullanılır; ekranda fiyat olarak gösterilmez. */
export function approximateVehicleValueTry(vehicle: Vehicle): number {
  const msrp = positive(vehicle.pricing?.msrp, 0);
  return approximateTry(msrp, resolveCurrency(vehicle.pricing));
}

/** Güç / ağırlık (HP / ton). Değerlerden biri doğrulanmamışsa 0 (kıyasa girmez). */
export function powerToWeight(vehicle: Vehicle): number {
  const hp = trustedSpec(vehicle, 'powerHp');
  const kg = trustedSpec(vehicle, 'curbWeightKg');
  return hp && kg ? Math.round((hp / kg) * 1000) : 0;
}

const PREMIUM_BRANDS = ['audi', 'bmw', 'mercedes', 'mercedes-benz', 'volvo', 'lexus', 'porsche', 'land rover', 'jaguar', 'genesis', 'tesla'];
const PERFORMANCE_BRANDS = ['dodge', 'chevrolet', 'ford performance', 'alfa romeo'];

export type BrandTier = 'premium' | 'performance' | 'mainstream';

/** Bakım ve prestij hesaplarında kullanılan kaba marka sınıfı */
export function brandTier(vehicle: Vehicle): BrandTier {
  const brand = cleanText(vehicle.brand).toLowerCase();
  if (PREMIUM_BRANDS.includes(brand)) return 'premium';
  if (PERFORMANCE_BRANDS.includes(brand) || vehicle.bodyType === 'muscle-car') return 'performance';
  return 'mainstream';
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
