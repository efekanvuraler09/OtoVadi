import type { Vehicle } from '../types/vehicle';
import { approximateTry, resolveCurrency } from '../utils/formatPrice';
import { cleanText } from '../utils/vehicleText';

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
}

const positive = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;

/**
 * Temsili karma tüketim (WLTP benzeri, L/100 km veya kWh/100 km). Güç ve ağırlık arttıkça artar; büyük hacimli
 * motorlar, pick-up/SUV gövdeler ve klasik (1990 öncesi) araçlar ek pay alır. Dizel ve hibrit daha verimlidir.
 */
export function estimateConsumption(vehicle: Vehicle): ConsumptionEstimate {
  const hp = positive(vehicle.engine?.powerHp, 150);
  const kg = positive(vehicle.dimensions?.curbWeightKg, 1500);

  if (energyKind(vehicle) === 'electric') {
    const kwh = 13.5 + 0.0045 * (kg - 1500) + 0.006 * Math.max(0, hp - 200);
    return { value: round1(clamp(kwh, 12, 28)), unit: 'kWh' };
  }

  const litres = positive(vehicle.engine?.displacementCc, 1500) / 1000;
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

  return { value: round1(clamp(consumption, 3, 24)), unit: 'L' };
}

/** Aracın yaklaşık TL değeri (kasko ve kıyas için). Döviz fiyatlarda YAKLAŞIK kur kullanılır; ekranda fiyat olarak gösterilmez. */
export function approximateVehicleValueTry(vehicle: Vehicle): number {
  const msrp = positive(vehicle.pricing?.msrp, 0);
  return approximateTry(msrp, resolveCurrency(vehicle.pricing));
}

/** Güç / ağırlık (HP / ton) */
export function powerToWeight(vehicle: Vehicle): number {
  const hp = positive(vehicle.engine?.powerHp, 0);
  const kg = positive(vehicle.dimensions?.curbWeightKg, 0);
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
