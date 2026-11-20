import type { Vehicle } from '../types/vehicle';
import { approximateTry, formatPrice, resolveCurrency } from '../utils/formatPrice';
import { cleanText } from '../utils/vehicleText';
import { estimateConsumption, powerToWeight } from './vehicleMetrics';
import {
  hasUnverifiedSpecs,
  specTrust,
  trustedDrivetrain,
  trustedEngineCode,
  trustedFuel,
  trustedHighlights,
  trustedSpec,
  trustedTransmission,
} from './specTrust';

/**
 * Y1 — Kafa Kafaya Düello satırları. Sayısal satırlarda en iyi değer belirlenir, ikinci en iyiye göre
 * fark rozeti üretilir ve skora sayılır. Değeri eksik/geçersiz olan satır skora katılmaz.
 * Faz 6 (Cila 1): doğrulanmamış (şablon) teknik değerler "—" görünür ve kıyasa/skora girmez.
 */

/** Doğrulanmamış değer yüzünden kıyaslanamayan satırların dipnotu */
export const UNVERIFIED_NOTE = 'Doğrulanmamış teknik değer kıyasa alınmadı';

export interface DuelCell {
  /** Ekranda gösterilen değer (birimsiz) */
  display: string;
  unit?: string;
}

export interface DuelRow {
  id: string;
  label: string;
  /** Sayısal ve kıyaslanabilir mi (skora sayılır) */
  scored: boolean;
  cells: DuelCell[];
  /** Kazanan sütun (yoksa null: eşit/kıyaslanamaz) */
  winner: number | null;
  /** Kazanan için fark rozeti, ör. "+65 HP" */
  badge: string | null;
  /** Tüm değerler aynı mı ("Sadece farkları göster" filtresi) */
  allEqual: boolean;
  /** Metin satırı (motor, şanzıman…): dar sütunda kesilmez, alt satıra geçer */
  text?: boolean;
  note?: string;
}

const MINUS = '−';

function numberFormat(decimals: number) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

const valid = (n: number | undefined | null): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

interface NumericSpec {
  id: string;
  label: string;
  unit: string;
  decimals: number;
  lowerIsBetter: boolean;
  value: (v: Vehicle) => number | undefined;
  note?: string;
}

const NUMERIC_SPECS: NumericSpec[] = [
  { id: 'power', label: 'Güç', unit: 'HP', decimals: 0, lowerIsBetter: false, value: (v) => trustedSpec(v, 'powerHp') ?? undefined },
  { id: 'torque', label: 'Tork', unit: 'Nm', decimals: 0, lowerIsBetter: false, value: (v) => trustedSpec(v, 'torqueNm') ?? undefined },
  { id: 'accel', label: '0–100 km/s', unit: 'sn', decimals: 1, lowerIsBetter: true, value: (v) => trustedSpec(v, 'zeroTo100Kmh') ?? undefined },
  { id: 'topSpeed', label: 'Maks. Hız', unit: 'km/s', decimals: 0, lowerIsBetter: false, value: (v) => trustedSpec(v, 'topSpeedKmh') ?? undefined },
  { id: 'ptw', label: 'Güç / Ağırlık', unit: 'HP/t', decimals: 0, lowerIsBetter: false, value: powerToWeight },
  { id: 'weight', label: 'Ağırlık', unit: 'kg', decimals: 0, lowerIsBetter: true, value: (v) => trustedSpec(v, 'curbWeightKg') ?? undefined },
  { id: 'boot', label: 'Bagaj', unit: 'L', decimals: 0, lowerIsBetter: false, value: (v) => trustedSpec(v, 'bootCapacityL') ?? undefined },
];

function numericRow(spec: NumericSpec, vehicles: Vehicle[]): DuelRow {
  const fmt = numberFormat(spec.decimals);
  const values = vehicles.map(spec.value);
  const cells: DuelCell[] = values.map((n) => (valid(n) ? { display: fmt.format(n), unit: spec.unit } : { display: '—' }));
  const comparable = values.every(valid);
  const rounded = values.map((n) => (valid(n) ? Number(n.toFixed(spec.decimals)) : NaN));
  const allEqual = comparable && rounded.every((n) => n === rounded[0]);

  let winner: number | null = null;
  let badge: string | null = null;
  if (comparable && !allEqual) {
    const ordered = rounded
      .map((n, i) => ({ n, i }))
      .sort((a, b) => (spec.lowerIsBetter ? a.n - b.n : b.n - a.n));
    if (ordered[0].n !== ordered[1].n) {
      winner = ordered[0].i;
      const diff = Math.abs(ordered[0].n - ordered[1].n);
      badge = `${spec.lowerIsBetter ? MINUS : '+'}${fmt.format(diff)} ${spec.unit}`;
    }
  }

  // Eksik değer şablon veriden geliyorsa kullanıcıya nedeni söylenir
  const note = !comparable && vehicles.some(hasUnverifiedSpecs) ? UNVERIFIED_NOTE : spec.note;
  return { id: spec.id, label: spec.label, scored: comparable, cells, winner, badge, allEqual, note };
}

function consumptionRow(vehicles: Vehicle[]): DuelRow {
  const estimates = vehicles.map(estimateConsumption);
  const fmt = numberFormat(1);
  // Doğrulanmamış güç/ağırlıktan türeyen tahmin gösterilmez (gövde ortalaması düelloda yanıltıcı olur)
  const cells = estimates.map((e) =>
    e.reliable ? { display: `≈ ${fmt.format(e.value)}`, unit: `${e.unit}/100 km` } : { display: '—' },
  );
  const allReliable = estimates.every((e) => e.reliable);
  // Litre ile kWh kıyaslanamaz
  const sameUnit = allReliable && estimates.every((e) => e.unit === estimates[0].unit);
  const values = estimates.map((e) => e.value);
  const allEqual = sameUnit && values.every((n) => n === values[0]);
  let winner: number | null = null;
  let badge: string | null = null;
  if (sameUnit && !allEqual) {
    const ordered = values.map((n, i) => ({ n, i })).sort((a, b) => a.n - b.n);
    if (ordered[0].n !== ordered[1].n) {
      winner = ordered[0].i;
      badge = `${MINUS}${fmt.format(ordered[1].n - ordered[0].n)} ${estimates[0].unit}`;
    }
  }
  return {
    id: 'consumption',
    label: 'Tahmini Tüketim',
    scored: sameUnit,
    cells,
    winner,
    badge,
    allEqual,
    note: allReliable ? 'Güç, ağırlık ve motor hacminden hesaplanan temsili değer' : UNVERIFIED_NOTE,
  };
}

function priceRow(vehicles: Vehicle[]): DuelRow {
  const prices = vehicles.map((v) => ({ amount: v.pricing?.msrp, currency: resolveCurrency(v.pricing) }));
  const cells = prices.map((p) => ({ display: valid(p.amount) ? formatPrice(p.amount, p.currency) : '—' }));
  const comparable = prices.every((p) => valid(p.amount));
  const sameCurrency = prices.every((p) => p.currency === prices[0].currency);
  // Farklı para birimlerinde sıralama yalnızca YAKLAŞIK TL karşılığıyla yapılır; fark tutarı gösterilmez
  const tryValues = prices.map((p) => (valid(p.amount) ? approximateTry(p.amount, p.currency) : NaN));
  const allEqual = comparable && sameCurrency && prices.every((p) => p.amount === prices[0].amount);

  let winner: number | null = null;
  let badge: string | null = null;
  if (comparable && !allEqual) {
    const ordered = tryValues.map((n, i) => ({ n, i })).sort((a, b) => a.n - b.n);
    if (ordered[0].n !== ordered[1].n) {
      winner = ordered[0].i;
      if (sameCurrency) {
        const diff = (prices[ordered[1].i].amount ?? 0) - (prices[ordered[0].i].amount ?? 0);
        badge = `${MINUS}${formatPrice(diff, prices[0].currency)}`;
      } else {
        badge = 'Daha uygun';
      }
    }
  }

  return {
    id: 'price',
    label: 'Fiyat',
    scored: comparable,
    cells,
    winner,
    badge,
    allEqual,
    note: sameCurrency ? undefined : 'Farklı para birimleri yaklaşık kurla sıralandı',
  };
}

const TRANSMISSION: Record<string, string> = { automatic: 'Otomatik', cvt: 'CVT', dct: 'Çift kavrama', manual: 'Manuel' };
const DRIVETRAIN: Record<string, string> = { fwd: 'Önden çekiş', rwd: 'Arkadan itiş', awd: 'AWD', '4wd': '4x4' };
const FUEL: Record<string, string> = { petrol: 'Benzin', diesel: 'Dizel', hybrid: 'Hibrit', 'plug-in-hybrid': 'Plug-in hibrit', electric: 'Elektrik' };

function textRow(id: string, label: string, vehicles: Vehicle[], read: (v: Vehicle) => string): DuelRow {
  const values = vehicles.map((v) => read(v) || '—');
  return {
    id,
    label,
    scored: false,
    cells: values.map((display) => ({ display })),
    winner: null,
    badge: null,
    allEqual: values.every((value) => value === values[0]),
    text: true,
  };
}

export function buildDuelRows(vehicles: Vehicle[]): { numeric: DuelRow[]; specs: DuelRow[] } {
  const numeric = [
    ...NUMERIC_SPECS.slice(0, 4).map((spec) => numericRow(spec, vehicles)),
    numericRow(NUMERIC_SPECS[4], vehicles),
    consumptionRow(vehicles),
    ...NUMERIC_SPECS.slice(5).map((spec) => numericRow(spec, vehicles)),
    priceRow(vehicles),
  ];

  const specs = [
    textRow('engine', 'Motor', vehicles, (v) => {
      const cc = trustedSpec(v, 'displacementCc');
      return [trustedEngineCode(v) ?? '', valid(cc) ? `${(cc / 1000).toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L` : '']
        .filter(Boolean)
        .join(' · ');
    }),
    textRow('fuel', 'Yakıt', vehicles, (v) => FUEL[trustedFuel(v) ?? ''] ?? ''),
    textRow('transmission', 'Şanzıman', vehicles, (v) => {
      const transmission = trustedTransmission(v);
      const type = transmission ? (TRANSMISSION[transmission] ?? '') : '';
      // Vites sayısı şablon kayıtlarda varsayılan (7) olduğu için yalnızca motor verisi doğrulanmışsa yazılır
      return type && v.performance?.gears && specTrust(v).engine ? `${type} · ${v.performance.gears} ileri` : type;
    }),
    textRow('drivetrain', 'Çekiş', vehicles, (v) => DRIVETRAIN[trustedDrivetrain(v) ?? ''] ?? ''),
  ];

  return { numeric, specs };
}

export interface DuelScore {
  wins: number[];
  /** Kıyaslanan ama berabere biten kategori sayısı */
  ties: number;
  categories: number;
}

export function duelScore(rows: DuelRow[], count: number): DuelScore {
  const wins = Array.from({ length: count }, () => 0);
  let ties = 0;
  let categories = 0;
  for (const row of rows) {
    if (!row.scored) continue;
    categories += 1;
    if (row.winner === null) ties += 1;
    else wins[row.winner] += 1;
  }
  return { wins, ties, categories };
}

/** Seçili araçların donanım listesi birleşimi (en fazla 10 satır, en çok paylaşılan önce) */
export function duelFeatures(vehicles: Vehicle[]): { name: string; has: boolean[] }[] {
  const counts = new Map<string, number>();
  for (const v of vehicles) {
    // "Standart Donanım" gibi şablon etiketler listeye girmez
    for (const name of trustedHighlights(v)) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'tr'))
    .slice(0, 10)
    .map(([name]) => ({ name, has: vehicles.map((v) => (v.highlights ?? []).some((h) => cleanText(h) === name)) }));
}

/* ── Seçim çözümleme (URL → tepsi → varsayılan) ───────────────────── */

/**
 * URL'de parametre yoksa ve tepsi boşsa açılan varsayılan düello (doküman id'leri). Faz 6: teknik değerleri doğrulanmış
 * iki rakip (eski Tucson × Tiguan çiftinin motor verisi şablon olduğu için Cila 1 sonrası yalnızca 3 kategori kıyaslanıyordu).
 */
const DEFAULT_DUEL = ['ford-mustang-gt-2023', 'dodge-challenger-srt-hellcat-2023'];
export const DUEL_PARAM_KEYS = ['a', 'b', 'c'] as const;

function findByKey(vehicles: Vehicle[], key: string): Vehicle | undefined {
  return vehicles.find((v) => v.slug === key) ?? vehicles.find((v) => v.id === key);
}

/**
 * Düello sütunları: önce paylaşılabilir URL (?a=&b=&c=, slug veya id), yoksa karşılaştırma tepsisi, o da yoksa
 * varsayılan çift. Aynı araç iki kez seçilmez; 2'den az araç bulunursa katalogdan tamamlanır. En fazla 3 sütun.
 */
export function resolveDuelSelection(urlKeys: string[], trayIds: string[], vehicles: Vehicle[]): Vehicle[] {
  const source = urlKeys.length > 0 ? urlKeys : trayIds.length > 0 ? trayIds : DEFAULT_DUEL;
  const picked: Vehicle[] = [];
  const add = (v?: Vehicle) => {
    if (v && !picked.some((p) => p.id === v.id) && picked.length < 3) picked.push(v);
  };
  source.forEach((key) => add(findByKey(vehicles, key)));
  for (const fallback of [...DEFAULT_DUEL.map((id) => findByKey(vehicles, id)), ...vehicles]) {
    if (picked.length >= 2) break;
    add(fallback);
  }
  return picked;
}
