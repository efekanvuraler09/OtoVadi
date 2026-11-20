import type { Vehicle } from '../types/vehicle';
import { formatPrice, resolveCurrency, type Currency } from '../utils/formatPrice';
import { vehicleName } from '../utils/vehicleText';
import { DEFAULT_PLAN, calculateFinance, sanitizePlan, type FinanceResult, type OwnershipPlan } from './finance';
import { DEFAULT_UNIT_PRICE, calculateTco, type TcoResult } from './tco';
import { energyKind } from './vehicleMetrics';
import { UNVERIFIED_NOTE, buildDuelRows } from './duel';

/**
 * 2.3 — Özel Müşteri Dosyası (/dosya). Tüm durum URL'dedir (Firestore koleksiyonu/kuralı yok):
 *   /dosya?ids=<slug|id>,<slug|id>,<slug|id>&km=15000&term=36&down=30
 * Düello bağlantılarıyla aynı mantık: paylaşılabilir, yer imine eklenebilir, yazdırılabilir.
 */
export const MAX_DOSSIER = 3;

export interface DossierParams {
  keys: string[];
  plan: OwnershipPlan;
}

export function parseDossierParams(params: URLSearchParams): DossierParams {
  const keys = [
    ...new Set(
      (params.get('ids') ?? '')
        .split(',')
        .map((key) => key.trim())
        .filter((key) => /^[A-Za-z0-9_-]{1,120}$/.test(key)),
    ),
  ].slice(0, MAX_DOSSIER);
  return {
    keys,
    plan: sanitizePlan({ annualKm: params.get('km'), term: params.get('term'), downPercent: params.get('down') }),
  };
}

export function dossierSearch(vehicles: Pick<Vehicle, 'id' | 'slug'>[], plan: OwnershipPlan = DEFAULT_PLAN): URLSearchParams {
  const params = new URLSearchParams();
  params.set('ids', vehicles.slice(0, MAX_DOSSIER).map((v) => v.slug || v.id).join(','));
  params.set('km', String(plan.annualKm));
  params.set('term', String(plan.term));
  params.set('down', String(plan.downPercent));
  return params;
}

export function dossierHref(vehicles: Pick<Vehicle, 'id' | 'slug'>[], plan: OwnershipPlan = DEFAULT_PLAN): string {
  // Virgüller okunur kalsın (URLSearchParams %2C yazar)
  return `/dosya?${dossierSearch(vehicles, plan).toString().replace(/%2C/gi, ',')}`;
}

/** Anahtarları (slug veya id) katalogla eşleştirir; bulunamayanlar sessizce atlanır, sıra korunur */
export function resolveDossierVehicles(keys: string[], vehicles: Vehicle[]): Vehicle[] {
  const picked: Vehicle[] = [];
  for (const key of keys) {
    const vehicle = vehicles.find((v) => v.slug === key) ?? vehicles.find((v) => v.id === key);
    if (vehicle && !picked.some((p) => p.id === vehicle.id)) picked.push(vehicle);
  }
  return picked;
}

export interface DossierEntry {
  vehicle: Vehicle;
  currency: Currency;
  finance: FinanceResult;
  tco: TcoResult;
}

export function buildDossierEntries(vehicles: Vehicle[], plan: OwnershipPlan): DossierEntry[] {
  return vehicles.map((vehicle) => {
    const currency = resolveCurrency(vehicle.pricing);
    return {
      vehicle,
      currency,
      finance: calculateFinance(vehicle.pricing?.msrp ?? 0, currency, plan.downPercent, plan.term),
      tco: calculateTco(vehicle, { annualKm: plan.annualKm, unitPrice: DEFAULT_UNIT_PRICE[energyKind(vehicle)] }),
    };
  });
}

export interface DossierSummary {
  lines: { label: string; text: string }[];
  /** Doğrulanmamış veri nedeniyle kıyaslanamayan satır var mı */
  hasUnverified: boolean;
}

const MAX_SUMMARY_LINES = 6;

/**
 * Kısa fark özeti: Düello satırlarından (duel.ts) kazananı belli olanlar + 5 yıllık maliyet ve aylık ödeme kıyası.
 * Doğrulanmamış teknik değerler kıyasa girmez (Cila 1).
 */
export function buildDossierSummary(entries: DossierEntry[]): DossierSummary {
  if (entries.length < 2) return { lines: [], hasUnverified: false };
  const vehicles = entries.map((e) => e.vehicle);
  const { numeric } = buildDuelRows(vehicles);
  const lines: { label: string; text: string }[] = [];

  // Maliyet satırları önce (dosyanın amacı)
  const byTco = entries.map((e, i) => ({ total: e.tco.total, i })).sort((a, b) => a.total - b.total);
  const tcoDiff = byTco[1].total - byTco[0].total;
  if (tcoDiff >= 1000) {
    lines.push({
      label: '5 Yıllık Maliyet',
      text: `${vehicleName(vehicles[byTco[0].i])}, ${vehicleName(vehicles[byTco[1].i])} modeline göre tahminen ${formatPrice(Math.round(tcoDiff / 1000) * 1000, 'TRY')} daha az tutuyor.`,
    });
  }

  const sameCurrency = entries.every((e) => e.currency === entries[0].currency);
  if (sameCurrency) {
    const byMonthly = entries.map((e, i) => ({ monthly: e.finance.monthly, i })).sort((a, b) => a.monthly - b.monthly);
    const diff = byMonthly[1].monthly - byMonthly[0].monthly;
    if (diff > 0) {
      lines.push({
        label: 'Aylık Ödeme',
        text: `${vehicleName(vehicles[byMonthly[0].i])} ile aylık taksit ${formatPrice(diff, entries[0].currency)} daha düşük.`,
      });
    }
  }

  for (const row of numeric) {
    if (lines.length >= MAX_SUMMARY_LINES) break;
    if (row.id === 'price' || row.winner === null || !row.badge) continue;
    lines.push({ label: row.label, text: `${vehicleName(vehicles[row.winner])} öne çıkıyor (${row.badge}).` });
  }

  return { lines, hasUnverified: numeric.some((row) => row.note === UNVERIFIED_NOTE) };
}
