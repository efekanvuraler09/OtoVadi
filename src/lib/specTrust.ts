import type { Drivetrain, FuelType, Transmission, Vehicle } from '../types/vehicle';
import { cleanText } from '../utils/vehicleText';

/**
 * Cila 1 — Teknik veri güveni (Faz 6).
 *
 * Admin formu boş bırakılan alanlara sabit değerler yazıyordu; ayrıca birçok kayıt aynı "şablon" motor profiliyle
 * kopyalanmış. Bu değerler gerçekmiş gibi gösterilirse Düello'da sahte beraberlik, Sınıf Kıyası'nda yanlış sıra,
 * broşürde yanlış rakam ve AI danışmanında uydurma bilgi üretir.
 *
 * Kural (dikkatli ve tutarlı): TEK bir değer asla şüpheli sayılmaz (gerçek 150 HP araçlar elenmez). Yalnızca bilinen
 * şablon profilinin TÜM alanları birebir eşleşirse o alan grubu "doğrulanmamış" sayılır:
 * - Motor grubu: motor hacmi + güç + tork + 0–100 + maks. hız (5 alan birden).
 * - Boyut grubu: 6 boyut alanından en az 5'i form varsayılanıyla aynı.
 * `specsVerified: true` (Firestore'da elle) tüm sezgileri devre dışı bırakır; `false` tüm teknik veriyi şüpheli yapar.
 *
 * Aynı imzalar sunucuda api/ask.ts içinde kopya olarak durur (api/ göreli import alamaz) — birini değiştirirsen ikisini de güncelle.
 */

interface EngineSignature {
  displacementCc: number;
  powerHp: number;
  torqueNm: number;
  zeroTo100Kmh: number;
  topSpeedKmh: number;
}

/** Canlı katalogda (Kasım 2026) birden çok farklı modele kopyalanmış motor profilleri + admin formu varsayılanı */
export const PLACEHOLDER_ENGINES: readonly EngineSignature[] = [
  { displacementCc: 1498, powerHp: 150, torqueNm: 250, zeroTo100Kmh: 8.5, topSpeedKmh: 220 },
  { displacementCc: 1499, powerHp: 140, torqueNm: 220, zeroTo100Kmh: 8.5, topSpeedKmh: 213 },
  { displacementCc: 1000, powerHp: 100, torqueNm: 200, zeroTo100Kmh: 10, topSpeedKmh: 200 },
];

/** Admin formunun sabit boyut seti (AdminDashboard) */
export const PLACEHOLDER_DIMENSIONS = {
  lengthMm: 4500,
  widthMm: 1800,
  heightMm: 1600,
  wheelbaseMm: 2700,
  bootCapacityL: 500,
  curbWeightKg: 1500,
} as const;

/** Şablon kayıtlarda motorla birlikte gelen varsayılan kategorik değerler */
const DEFAULT_DRIVETRAIN: Drivetrain = 'fwd';
const DEFAULT_TRANSMISSION: Transmission = 'automatic';
const DEFAULT_FUEL: FuelType = 'petrol';
const DEFAULT_ENGINE_CODES = new Set(['1.5 turbo', '1.0']);

/** Şablon/varsayılan metinler: broşür, dosya ve AI bağlamına girmez */
const PLACEHOLDER_TEXTS = new Set(
  [
    'Premium tasarım, üstün performans',
    'Yeni Eklenen Araç',
    'Gelişmiş mühendislik ve premium donanımla sunulan ikonik model.',
    'Standart Donanım',
  ].map((t) => t.toLocaleLowerCase('tr')),
);

export type EngineSpecKey = 'displacementCc' | 'powerHp' | 'powerKw' | 'torqueNm' | 'zeroTo100Kmh' | 'topSpeedKmh';
export type DimensionSpecKey = keyof typeof PLACEHOLDER_DIMENSIONS;
export type SpecKey = EngineSpecKey | DimensionSpecKey;

export interface SpecTrust {
  /** Motor + performans değerleri gerçek mi */
  engine: boolean;
  /** Boyut / bagaj / ağırlık değerleri gerçek mi */
  dimensions: boolean;
  /** Firestore'da specsVerified: true */
  verified: boolean;
}

const near = (a: unknown, b: number) => typeof a === 'number' && Math.abs(a - b) < 0.05;

function matchesPlaceholderEngine(vehicle: Vehicle): boolean {
  const engine = vehicle.engine;
  const perf = vehicle.performance;
  return PLACEHOLDER_ENGINES.some(
    (sig) =>
      near(engine?.displacementCc, sig.displacementCc) &&
      near(engine?.powerHp, sig.powerHp) &&
      near(engine?.torqueNm, sig.torqueNm) &&
      near(perf?.zeroTo100Kmh, sig.zeroTo100Kmh) &&
      near(perf?.topSpeedKmh, sig.topSpeedKmh),
  );
}

function matchesPlaceholderDimensions(vehicle: Vehicle): boolean {
  const dims = vehicle.dimensions;
  if (!dims) return false;
  const keys = Object.keys(PLACEHOLDER_DIMENSIONS) as DimensionSpecKey[];
  return keys.filter((key) => near(dims[key], PLACEHOLDER_DIMENSIONS[key])).length >= 5;
}

const cache = new WeakMap<Vehicle, SpecTrust>();

/** Aracın teknik veri güveni (aynı nesne için önbellekli) */
export function specTrust(vehicle: Vehicle): SpecTrust {
  const cached = cache.get(vehicle);
  if (cached) return cached;

  const flag = vehicle.specsVerified;
  const result: SpecTrust =
    flag === true
      ? { engine: true, dimensions: true, verified: true }
      : flag === false
        ? { engine: false, dimensions: false, verified: false }
        : { engine: !matchesPlaceholderEngine(vehicle), dimensions: !matchesPlaceholderDimensions(vehicle), verified: false };

  cache.set(vehicle, result);
  return result;
}

const ENGINE_KEYS = new Set<SpecKey>(['displacementCc', 'powerHp', 'powerKw', 'torqueNm', 'zeroTo100Kmh', 'topSpeedKmh']);

function rawValue(vehicle: Vehicle, key: SpecKey): unknown {
  switch (key) {
    case 'displacementCc':
    case 'powerHp':
    case 'powerKw':
    case 'torqueNm':
      return vehicle.engine?.[key];
    case 'zeroTo100Kmh':
    case 'topSpeedKmh':
      return vehicle.performance?.[key];
    default:
      return vehicle.dimensions?.[key];
  }
}

/**
 * Gösterilebilir / kıyaslanabilir değer. Doğrulanmamış (şablon) veya eksik/sıfır değerde null döner;
 * arayüz bu durumda "—" gösterir, kıyas ve skorlar onu atlar.
 */
export function trustedSpec(vehicle: Vehicle, key: SpecKey): number | null {
  const trust = specTrust(vehicle);
  if (ENGINE_KEYS.has(key) ? !trust.engine : !trust.dimensions) return null;
  const value = rawValue(vehicle, key);
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

/** Şablon motorlu kayıtta formun varsayılan değerini taşıyan kategorik alanlar da doğrulanmamış sayılır */
export function trustedDrivetrain(vehicle: Vehicle): Drivetrain | null {
  const value = vehicle.performance?.drivetrain;
  if (!value) return null;
  return !specTrust(vehicle).engine && value === DEFAULT_DRIVETRAIN ? null : value;
}

export function trustedTransmission(vehicle: Vehicle): Transmission | null {
  const value = vehicle.performance?.transmission;
  if (!value) return null;
  return !specTrust(vehicle).engine && value === DEFAULT_TRANSMISSION ? null : value;
}

export function trustedFuel(vehicle: Vehicle): FuelType | null {
  const value = vehicle.engine?.fuelType;
  if (!value) return null;
  return !specTrust(vehicle).engine && value === DEFAULT_FUEL ? null : value;
}

export function trustedEngineCode(vehicle: Vehicle): string | null {
  const code = cleanText(vehicle.engine?.code);
  if (!code) return null;
  return !specTrust(vehicle).engine && DEFAULT_ENGINE_CODES.has(code.toLowerCase()) ? null : code;
}

/** Aracın gösterilmeyen (doğrulanmamış) teknik değeri var mı — dipnot göstermek için */
export function hasUnverifiedSpecs(vehicle: Vehicle): boolean {
  const trust = specTrust(vehicle);
  return !trust.engine || !trust.dimensions;
}

/** Şablon tanıtım metni mi (ör. 19 kayıtta aynı "Premium tasarım, üstün performans") */
export function isPlaceholderText(value: string | undefined | null): boolean {
  const text = cleanText(value ?? '');
  return !text || PLACEHOLDER_TEXTS.has(text.toLocaleLowerCase('tr'));
}

/** Gerçek tanıtım metni ya da boş string */
export function trustedText(value: string | undefined | null): string {
  return isPlaceholderText(value) ? '' : cleanText(value ?? '');
}

/** "Standart Donanım" gibi şablon etiketler çıkarılmış donanım listesi */
export function trustedHighlights(vehicle: Vehicle): string[] {
  return (vehicle.highlights ?? []).map((h) => cleanText(h)).filter((h) => h && !isPlaceholderText(h));
}
