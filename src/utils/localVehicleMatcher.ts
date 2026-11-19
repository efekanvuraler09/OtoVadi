/**
 * "Hızlı Eşleştirme": yapay zeka yanıt veremediğinde kullanılan dürüst yerel eşleştirici.
 * Sorgudaki anahtar kelimelerden kriter çıkarır (bütçe, gövde tipi, yakıt, performans, kullanım amacı, marka/model)
 * ve katalogdaki her aracı bu kriterlere göre puanlar. Saf fonksiyondur; React'e ve ağa bağımlı değildir.
 *
 * Not: Katalogdaki bazı teknik alanlar admin varsayılanıdır (ör. 150 hp / 8,5 sn / önden çekiş / benzin).
 * Bu yüzden yakıt, çekiş ve güç bilgisi açıklama/öne çıkan özellik metinlerinden de okunur.
 */
import type { BodyType, Vehicle } from '../types/vehicle';
import { approximateTry, resolveCurrency, type Currency } from './formatPrice';

export type FuelPreference = 'electric' | 'hybrid' | 'diesel' | 'petrol';
export type UsageKind = 'performance' | 'economy' | 'family' | 'luxury' | 'offroad' | 'classic';

export type MatchCriterion =
  | { kind: 'budget'; direction: 'max' | 'min'; amount: number; currency: Currency }
  /** value: eşleştirme anahtarı (normalize), label: ekranda gösterilecek ad */
  | { kind: 'model'; value: string; label: string }
  | { kind: 'brand'; value: string; label: string }
  | { kind: 'body'; value: BodyType }
  | { kind: 'fuel'; value: FuelPreference }
  | { kind: UsageKind };

export interface LocalMatch {
  vehicle: Vehicle;
  alternatives: Vehicle[];
  /** Sorgudan anlaşılan kriterler (gösterim sırasıyla) */
  criteria: MatchCriterion[];
  /** Katalogda hiçbir aracın karşılamadığı kriterler (dürüstçe belirtmek için) */
  unmet: MatchCriterion[];
}

/* ── Metin normalleştirme ────────────────────────────────────────── */

/** Küçük harf, Türkçe/Almanca aksanlar sadeleştirilir: "Güçlü Şık İ" → "guclu sik i" */
function normalize(text: string): string {
  return text
    .replace(/ß/g, 'ss')
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9₺€$.,/\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Ekranda gösterim için boşlukları sadeleştirir (katalogda "\tVolkswagen", "Citroen " gibi kayıtlar var) */
function displayText(text: string | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/** Anahtar kelime eşleştirmesi için noktalama da atılmış hâli */
function toWords(normalized: string): string {
  return normalized.replace(/[.,/]/g, ' ').replace(/\s+/g, ' ').trim();
}

interface Keywords {
  /** Tam kelime eşleşmesi (kısa/çok anlamlı kelimeler için) */
  words?: string[];
  /** Kelime başı eşleşmesi: "aile" → "ailem", "ailemle" */
  prefixes?: string[];
  /** Birden çok kelimelik ifade (son kelimeye ek gelebilir): "dort ceker" → "dort cekerli" */
  phrases?: string[];
}

class TextIndex {
  readonly words: string;
  readonly tokens: string[];
  private readonly tokenSet: Set<string>;

  /**
   * splitHyphens: sorgularda "Familien-SUV" → "familien-suv", "familien", "suv".
   * Araç metinlerinde kapalı tutulur ("GT-Line" bir performans GT'si değildir).
   */
  constructor(normalized: string, splitHyphens = false) {
    this.words = toWords(normalized);
    const base = this.words ? this.words.split(' ') : [];
    this.tokens = splitHyphens ? base.flatMap((t) => (t.includes('-') ? [t, ...t.split('-').filter(Boolean)] : [t])) : base;
    this.tokenSet = new Set(this.tokens);
  }

  has(keywords: Keywords): boolean {
    if (keywords.words?.some((w) => this.tokenSet.has(w))) return true;
    if (keywords.prefixes?.some((p) => this.tokens.some((t) => t.startsWith(p)))) return true;
    const padded = ` ${this.words}`;
    return Boolean(keywords.phrases?.some((p) => padded.includes(` ${p}`)));
  }
}

/* ── Sorgu sözlüğü (normalize edilmiş biçimde: aksansız, küçük harf) ─ */

const BODY_KEYWORDS: Record<BodyType, Keywords> = {
  suv: { words: ['suv', 'cuv', 'jeep', 'crossover'], prefixes: ['suv', 'crossover'], phrases: ['arazi araci'] },
  sedan: { words: ['sedan', 'limo'], prefixes: ['sedan', 'limuzin', 'limousine'] },
  hatchback: { words: ['hb', 'hatch'], prefixes: ['hatchback'] },
  pickup: { words: ['pickup', 'pick-up', 'kamyonet', 'pritsche'], prefixes: ['pickup', 'pick-up', 'kamyonet'], phrases: ['pick up'] },
  'muscle-car': { words: ['coupe', 'kupe', 'amerikan', 'american'], prefixes: ['muscle'] },
};

const FUEL_KEYWORDS: Record<FuelPreference, Keywords> = {
  // "ev" bilinçli olarak yok: Türkçede "ev" (konut) çok yaygın ("evden işe")
  electric: { words: ['bev', 'e-auto'], prefixes: ['elektrik', 'electric', 'elektro', 'sarj', 'batarya', 'battery'] },
  hybrid: { words: ['phev'], prefixes: ['hibrit', 'hibrid', 'hybrid', 'plug-in', 'plugin'] },
  diesel: { words: ['tdi', 'cdi', 'crdi', 'hdi'], prefixes: ['dizel', 'diesel', 'mazot', 'motorin'] },
  petrol: { prefixes: ['benzin', 'petrol', 'gasoline'] },
};

const USAGE_KEYWORDS: Record<UsageKind, Keywords> = {
  performance: {
    words: ['spor', 'hiz', 'hp', 'ps', 'track', 'v8', 'gt', 'amg', 'rs'],
    prefixes: ['hizli', 'guclu', 'perform', 'sportif', 'heyecan', 'adrenalin', 'pist', 'yaris', 'agresif', 'beygir',
      'sport', 'fast', 'power', 'schnell', 'leistung', 'drift', 'tork'],
  },
  economy: {
    words: ['ekonomi', 'city', 'stadt', 'sehir', 'sehirde', 'sehirici'],
    prefixes: ['ekonomik', 'tasarruf', 'cimri', 'ucuz', 'hesapli', 'econom', 'cheap', 'afford', 'efficient',
      'budget-friendly', 'gunstig', 'sparsam', 'billig'],
    phrases: ['az yakan', 'az yakit', 'yakit cimrisi', 'uygun fiyat', 'ilk arac', 'ilk araba', 'sehir ici', 'sehir arac', 'sehir araba', 'ogrenci'],
  },
  family: {
    words: ['space', 'platz', 'kamp', 'tatil'],
    prefixes: ['aile', 'cocuk', 'genis', 'bagaj', 'ferah', 'bebek', 'family', 'kids', 'spacious', 'familie', 'kinder',
      'kofferraum', 'geraumig'],
    phrases: ['7 kisilik', 'yedi kisilik', 'uzun yol'],
  },
  luxury: {
    words: ['sik', 'lux', 'vip'],
    prefixes: ['luks', 'premium', 'konfor', 'prestij', 'elegan', 'zarif', 'makam', 'statu', 'luxur', 'luxus', 'comfort',
      'komfort'],
  },
  offroad: {
    words: ['4x4', 'kar', 'awd', '4wd'],
    prefixes: ['arazi', 'offroad', 'off-road', 'toprak', 'stabilize', 'gelande', 'quattro', 'xdrive', '4matic', '4motion'],
    phrases: ['off road', 'dort ceker', 'cift ceker', 'dort tekerden'],
  },
  classic: {
    words: ['60lar', '70ler', '60s', '70s'],
    prefixes: ['klasik', 'nostalji', 'vintage', 'retro', 'koleksiyon', 'efsane', 'classic', 'oldtimer', 'antika', 'legend'],
  },
};

const LOWER_BOUND_KEYWORDS: Keywords = {
  words: ['ab', 'over', 'above'],
  prefixes: ['ustu', 'uzeri', 'minimum', 'mindestens'],
  phrases: ['en az', 'more than', 'at least'],
};

const BRAND_ALIASES: Record<string, string> = { vw: 'volkswagen', mercedes: 'mercedes-benz', benz: 'mercedes-benz', chevy: 'chevrolet' };
const GENERIC_MODEL_TOKENS = new Set(['sedan', 'series', 'serisi', 'gran', 'coupe', 'hatchback', 'suv', 'sport', 'yeni', 'new']);
const PREMIUM_BRANDS = new Set(['audi', 'bmw', 'mercedes-benz', 'lexus', 'volvo', 'porsche', 'land rover', 'jaguar', 'genesis', 'maserati', 'tesla']);

/* ── Bütçe ayrıştırma ────────────────────────────────────────────── */

// Çarpan kelimeleri Türkçe ek alabilir: "2 milyonluk", "800 binlik"
const MONEY_PATTERN = /(\d{1,3}(?:[.,]\d{3})+|\d+(?:[.,]\d+)?)\s*(milyon[a-z]*|million[a-z]*|mio|mn|m|bin[a-z]*|k|thousand|tausend|tsd)?(?![a-z0-9])/g;
const NON_MONEY_UNIT = /^\s*(hp|bg|beygir|ps|kw|km|nm|cc|lt|litre|liter|l|sn|saniye|saat|kisilik|kisi|yil|yas|yasinda|model|kapi|koltuk|inc|mm|cm|kg|ton|gun|ay|dakika|dk|cocuk|%)(?![a-z])/;

function detectCurrency(context: string): Currency | null {
  if (/(₺|\btl\b|\btry\b|lira)/.test(context)) return 'TRY';
  if (/(€|\beur\b|euro|avro)/.test(context)) return 'EUR';
  if (/(\$|\busd\b|dolar|dollar)/.test(context)) return 'USD';
  return null;
}

function parseNumber(raw: string): number {
  // "2.000.000" / "45,000" → binlik ayırıcı; "1,5" / "2.5" → ondalık
  if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) return Number(raw.replace(/[.,]/g, ''));
  return Number(raw.replace(',', '.'));
}

function parseBudget(normalized: string): Extract<MatchCriterion, { kind: 'budget' }> | null {
  const amounts: { amount: number; currency: Currency | null; context: string }[] = [];
  for (const match of normalized.matchAll(MONEY_PATTERN)) {
    const [full, rawNumber, multiplierWord] = match;
    const start = match.index ?? 0;
    const after = normalized.slice(start + full.length, start + full.length + 14);
    const before = normalized.slice(Math.max(0, start - 3), start);
    if (!multiplierWord && NON_MONEY_UNIT.test(after)) continue;

    let amount = parseNumber(rawNumber);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    // "m" ile başlayanlar milyon (milyon, million, mio, mn, m); diğerleri bin (bin, k, thousand, tausend, tsd)
    if (multiplierWord) amount *= multiplierWord.startsWith('m') ? 1_000_000 : 1_000;

    const currency = detectCurrency(`${before} ${after}`);
    const looksLikeYear = !multiplierWord && !currency && amount >= 1900 && amount <= 2100;
    if (looksLikeYear || (amount < 1_000 && !currency)) continue;
    const context = normalized.slice(Math.max(0, start - 16), start + full.length + 16);
    amounts.push({ amount, currency, context });
  }
  if (amounts.length === 0) return null;

  // Aralıklarda ("1-2 milyon") üst sınır esas alınır
  const best = amounts.reduce((a, b) => (b.amount > a.amount ? b : a));
  // Para birimi yazılmadıysa büyüklükten tahmin: Türkiye'de 200 bin altı bir tutar TL olamaz → EUR
  const currency = best.currency ?? amounts.find((a) => a.currency)?.currency ?? (best.amount >= 200_000 ? 'TRY' : 'EUR');
  // Yön yalnızca tutarın çevresinden okunur ("en az 5 kişilik, 2 milyon altı" → üst sınır)
  const direction = new TextIndex(best.context).has(LOWER_BOUND_KEYWORDS) ? 'min' : 'max';
  return { kind: 'budget', direction, amount: best.amount, currency };
}

/* ── Araç özellikleri ────────────────────────────────────────────── */

interface VehicleFeatures {
  vehicle: Vehicle;
  priceTry: number | null;
  hp: number;
  fuels: Partial<Record<FuelPreference, number>>;
  awd: boolean;
  brandKey: string;
  modelToken: string | null;
  text: TextIndex;
}

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function extractFeatures(vehicle: Vehicle): VehicleFeatures {
  // Tagline bilinçli olarak dışarıda: birçok kayıtta varsayılan "Premium tasarım, üstün performans" metni var.
  const rawText = [vehicle.brand, vehicle.model, vehicle.pricing?.trim, vehicle.bodyStyle, vehicle.shortDescription, ...(vehicle.highlights ?? [])]
    .filter(Boolean)
    .join(' ');
  const normalized = normalize(rawText);
  const text = new TextIndex(normalized);

  const fuels: Partial<Record<FuelPreference, number>> = {};
  switch (vehicle.engine?.fuelType) {
    case 'electric': fuels.electric = 1; break;
    case 'plug-in-hybrid': fuels.hybrid = 1; fuels.electric = 0.5; break;
    case 'hybrid': fuels.hybrid = 1; break;
    case 'diesel': fuels.diesel = 1; break;
    case 'petrol': fuels.petrol = 1; break;
  }
  // Metin yapısal alandan daha güvenilir (yapısal alan çoğu kayıtta varsayılan "petrol")
  if (/(dizel|diesel|\btdi\b|d-4d|\bcrdi\b|\b\d{2}d\b)/.test(normalized)) {
    fuels.diesel = 1;
    fuels.petrol = 0;
  }
  if (/(hibrit|hybrid)/.test(normalized)) {
    const mild = /mild/.test(normalized);
    fuels.hybrid = Math.max(fuels.hybrid ?? 0, mild ? 0.6 : 1);
    if (!mild && fuels.petrol) fuels.petrol = 0.3;
  }
  // Yalın "elektrikli" kullanılmaz: açıklamalarda "elektrikli koltuk/bagaj kapağı" gibi donanımlar geçiyor
  if (/(tam elektrikli|100 elektrikli|elektrikli motor|electric vehicle|\bbev\b)/.test(normalized)) fuels.electric = 1;

  const parsedHp = [...normalized.matchAll(/(\d{2,4})\s?(hp|ps|bg|beygir)(?![a-z])/g)].map((m) => Number(m[1]));
  const hp = Math.max(vehicle.engine?.powerHp ?? 0, ...parsedHp);

  const msrp = vehicle.pricing?.msrp;
  const priceTry = typeof msrp === 'number' && msrp > 0 ? approximateTry(msrp, resolveCurrency(vehicle.pricing)) : null;

  const drivetrain = vehicle.performance?.drivetrain;
  const awd = drivetrain === 'awd' || drivetrain === '4wd' || /(quattro|xdrive|4matic|4motion|\bawd\b|4x4|dort ceker)/.test(normalized);

  const brandNorm = toWords(normalize(vehicle.brand ?? ''));
  const brandKey = BRAND_ALIASES[brandNorm] ?? brandNorm;
  const firstModelToken = toWords(normalize(vehicle.model ?? '')).split(' ')[0] ?? '';
  const modelToken = firstModelToken.length >= 2 && /[a-z]/.test(firstModelToken) && !GENERIC_MODEL_TOKENS.has(firstModelToken)
    ? firstModelToken
    : null;

  return { vehicle, priceTry, hp, fuels, awd, brandKey, modelToken, text };
}

/* ── Puanlama ────────────────────────────────────────────────────── */

const WEIGHTS = { model: 4, brand: 3, body: 2.5, budget: 2.5, fuel: 2, classic: 2, offroad: 1.5, performance: 1.5, family: 1.5, luxury: 1.2, economy: 1.2 } as const;

const STRONG_PERFORMANCE = { words: ['v8', 'v6', 'gt', 'srt', 'zl1', 'hemi', 'track', 'raptor', 'rs'], prefixes: ['supercharged', 'hellcat', 'pist', 'yaris', 'performans', 'baja'] };
const SPORTY_TRIM = { phrases: ['m sport', 's line', 'amg line', 'gt-line', 'r-line'] };
const LUXURY_TEXT = { prefixes: ['burmester', 'harman', 'levinson', 'bowers', 'hyperscreen', 'luks', 'konfor', 'masaj'], phrases: ['b o', 'bang olufsen', 'mark levinson'] };
const OFFROAD_TEXT = { prefixes: ['raptor', 'baja', 'fox', 'arazi', 'off-road', 'offroad', 'zorlu'] };

interface CatalogStats {
  pricePercentile: (priceTry: number | null) => number;
}

function buildStats(features: VehicleFeatures[]): CatalogStats {
  const prices = features.map((f) => f.priceTry).filter((p): p is number => p !== null).sort((a, b) => a - b);
  return {
    pricePercentile: (priceTry) => {
      if (priceTry === null || prices.length < 2) return 0.5;
      const below = prices.filter((p) => p < priceTry).length;
      return below / (prices.length - 1);
    },
  };
}

function performanceScore(f: VehicleFeatures): number {
  const z = f.vehicle.performance?.zeroTo100Kmh;
  const hpScore = clamp((f.hp - 100) / 500);
  const accelScore = typeof z === 'number' && z > 0 ? clamp((10 - z) / 6.5) : 0;
  const textScore = f.text.has(STRONG_PERFORMANCE) ? 1 : f.text.has(SPORTY_TRIM) ? 0.45 : 0;
  return Math.max(0.6 * hpScore + 0.4 * accelScore, textScore);
}

/**
 * Bütçe sınırına uzaklık cezası (logaritmik): %10 → 0,72; %33 → 0,18; 2 kat → -1; en fazla -3.
 * Hiçbir araç bütçeye uymasa bile sınıra en yakın olanlar öne çıkar.
 */
const budgetPenalty = (ratio: number) => Math.max(-3, 1 - 2 * Math.log2(ratio));

function budgetScore(f: VehicleFeatures, budget: Extract<MatchCriterion, { kind: 'budget' }>): number {
  if (f.priceTry === null) return -0.5;
  const limit = approximateTry(budget.amount, budget.currency);
  if (budget.direction === 'min') {
    return f.priceTry >= limit ? 1 : budgetPenalty(limit / f.priceTry);
  }
  if (f.priceTry <= limit) return 1 - (0.5 * (limit - f.priceTry)) / limit; // bütçeye yakın olan daha iyi
  return budgetPenalty(f.priceTry / limit);
}

function criterionScore(f: VehicleFeatures, c: MatchCriterion, stats: CatalogStats): number {
  const body = f.vehicle.bodyType;
  const segment = f.vehicle.segment;
  const pricePct = stats.pricePercentile(f.priceTry);

  switch (c.kind) {
    case 'budget':
      return budgetScore(f, c);
    case 'model':
      return f.modelToken === c.value.toLowerCase() ? 1 : 0;
    case 'brand':
      return f.brandKey === c.value.toLowerCase() ? 1 : 0;
    case 'body':
      if (body === c.value) return 1;
      if (c.value === 'suv' && body === 'pickup') return 0.2;
      if (c.value === 'sedan' && body === 'hatchback') return 0.2;
      return -0.5;
    case 'fuel': {
      const strength = f.fuels[c.value] ?? 0;
      if (c.value === 'electric' && strength === 0 && f.fuels.hybrid) return 0.3 * f.fuels.hybrid;
      return strength > 0 ? strength : -0.5;
    }
    case 'performance':
      return performanceScore(f);
    case 'economy': {
      let score = 0.6 * (1 - pricePct);
      if (segment === 'b' || segment === 'c' || body === 'hatchback') score += 0.2;
      if (f.fuels.hybrid || f.fuels.diesel || f.fuels.electric) score += 0.2;
      if (body === 'muscle-car' || body === 'pickup') score -= 0.4;
      return clamp(score, -1, 1);
    }
    case 'family': {
      const boot = f.vehicle.dimensions?.bootCapacityL ?? 0;
      let score = 0.6 * clamp((boot - 350) / 300);
      if (body === 'suv') score += 0.35;
      if (segment === 'd' || segment === 'e') score += 0.1;
      if (body === 'muscle-car') score -= 0.6;
      return clamp(score, -1, 1);
    }
    case 'luxury': {
      let score = 0.3 * pricePct;
      if (PREMIUM_BRANDS.has(f.brandKey)) score += 0.45;
      if (segment === 'e' || segment === 'f') score += 0.25;
      else if (segment === 'd') score += 0.1;
      if (f.text.has(LUXURY_TEXT)) score += 0.2;
      return clamp(score);
    }
    case 'offroad': {
      let score = f.awd ? 0.6 : 0;
      if (body === 'pickup') score += 0.4;
      else if (body === 'suv') score += 0.25;
      if (f.text.has(OFFROAD_TEXT)) score += 0.2;
      if (body === 'sedan' || body === 'hatchback' || body === 'muscle-car') score -= 0.3;
      return clamp(score, -1, 1);
    }
    case 'classic':
      return (f.vehicle.year ?? 9999) < 1990 ? 1 : 0;
  }
}

/** Kriterin katalogda karşılanıp karşılanmadığı (dürüst bilgilendirme için) */
function isSatisfiedBy(c: MatchCriterion, f: VehicleFeatures, stats: CatalogStats): boolean {
  switch (c.kind) {
    case 'budget':
    case 'model':
    case 'brand':
    case 'body':
    case 'classic':
      return criterionScore(f, c, stats) >= 0.5;
    case 'fuel':
      return (f.fuels[c.value] ?? 0) >= 0.6;
    default:
      return true;
  }
}

function extractCriteria(query: string, features: VehicleFeatures[]): MatchCriterion[] {
  const normalized = normalize(query);
  const index = new TextIndex(normalized, true);
  const criteria: MatchCriterion[] = [];

  const budget = parseBudget(normalized);
  if (budget) criteria.push(budget);

  for (const [body, keywords] of Object.entries(BODY_KEYWORDS) as [BodyType, Keywords][]) {
    if (index.has(keywords)) criteria.push({ kind: 'body', value: body });
  }
  for (const [fuel, keywords] of Object.entries(FUEL_KEYWORDS) as [FuelPreference, Keywords][]) {
    if (index.has(keywords)) criteria.push({ kind: 'fuel', value: fuel });
  }

  // Marka ve model adları katalogdan gelir (ör. "BMW", "Mustang", "Tiguan")
  const queryTokens = new Set(index.tokens.map((t) => BRAND_ALIASES[t] ?? t));
  const seenBrands = new Set<string>();
  const seenModels = new Set<string>();
  for (const f of features) {
    const brandTokens = f.brandKey.split(' ');
    if (!seenBrands.has(f.brandKey) && (queryTokens.has(f.brandKey) || brandTokens.every((t) => queryTokens.has(t)))) {
      seenBrands.add(f.brandKey);
      criteria.push({ kind: 'brand', value: f.brandKey, label: displayText(f.vehicle.brand) });
    }
    if (f.modelToken && !seenModels.has(f.modelToken) && queryTokens.has(f.modelToken)) {
      seenModels.add(f.modelToken);
      criteria.push({ kind: 'model', value: f.modelToken, label: displayText(f.vehicle.model).split(' ')[0] });
    }
  }

  for (const [usage, keywords] of Object.entries(USAGE_KEYWORDS) as [UsageKind, Keywords][]) {
    if (index.has(keywords)) criteria.push({ kind: usage });
  }
  return criteria;
}

/**
 * Sorguya en uygun aracı ve en fazla 2 alternatifi döndürür. Katalog boşsa null.
 * Sorguda tanınan kriter yoksa öne çıkan, orta fiyat bandındaki dengeli bir araç seçilir (criteria: []).
 */
export function matchVehiclesLocally(query: string, vehicles: Vehicle[]): LocalMatch | null {
  if (vehicles.length === 0) return null;

  const features = vehicles.map(extractFeatures);
  const stats = buildStats(features);
  const criteria = extractCriteria(query, features);

  // Aynı kriter türünden birden fazla değer (ör. "BMW veya Audi") varsa en iyi eşleşen sayılır
  const groups = new Map<string, MatchCriterion[]>();
  for (const c of criteria) {
    const groupKey = c.kind;
    groups.set(groupKey, [...(groups.get(groupKey) ?? []), c]);
  }

  const scored = features.map((f) => {
    let score = 0;
    for (const [kind, group] of groups) {
      const best = Math.max(...group.map((c) => criterionScore(f, c, stats)));
      score += WEIGHTS[kind as keyof typeof WEIGHTS] * best;
    }
    if (criteria.length === 0) {
      // Kriter yok: öne çıkan ve orta fiyat bandındaki araçları tercih et
      score += (f.vehicle.featured ? 0.3 : 0) + 0.2 * (1 - Math.abs(stats.pricePercentile(f.priceTry) - 0.5) * 2);
    } else {
      score += f.vehicle.featured ? 0.05 : 0;
    }
    return { f, score: score + 0.01 * performanceScore(f) };
  });

  scored.sort((a, b) => b.score - a.score);
  const [top, ...rest] = scored;

  const unmet = criteria.filter((c) => !features.some((f) => isSatisfiedBy(c, f, stats)));

  return {
    vehicle: top.f.vehicle,
    alternatives: rest.slice(0, 2).map((s) => s.f.vehicle),
    criteria,
    unmet,
  };
}
