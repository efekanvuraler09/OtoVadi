import type { BodyType, Vehicle } from '../types/vehicle';

export function countByBodyType(vehicles: Vehicle[], bodyType: BodyType): number {
  return vehicles.filter((v) => v.bodyType === bodyType).length;
}

/* ── Katalog kıyas çubukları (U4) ─────────────────────────────────── */

export type BenchmarkKey = 'powerHp' | 'torqueNm' | 'zeroTo100Kmh' | 'topSpeedKmh';

export interface BenchmarkMetric {
  key: BenchmarkKey;
  label: string;
  unit: string;
  /** true: küçük değer daha iyi (0–100 süresi) */
  lowerIsBetter: boolean;
  decimals: number;
}

export const BENCHMARK_METRICS: BenchmarkMetric[] = [
  { key: 'powerHp', label: 'Güç', unit: 'HP', lowerIsBetter: false, decimals: 0 },
  { key: 'torqueNm', label: 'Tork', unit: 'Nm', lowerIsBetter: false, decimals: 0 },
  { key: 'zeroTo100Kmh', label: '0–100 km/s', unit: 'sn', lowerIsBetter: true, decimals: 1 },
  { key: 'topSpeedKmh', label: 'Maks. Hız', unit: 'km/s', lowerIsBetter: false, decimals: 0 },
];

export function benchmarkValue(vehicle: Vehicle, key: BenchmarkKey): number | null {
  const raw = key === 'powerHp' || key === 'torqueNm' ? vehicle.engine?.[key] : vehicle.performance?.[key];
  return typeof raw === 'number' && Number.isFinite(raw) && raw > 0 ? raw : null;
}

export interface BenchmarkStat {
  metric: BenchmarkMetric;
  value: number;
  min: number;
  max: number;
  avg: number;
  /** 1 = katalogdaki en iyi değer (eşitlikler aynı sırayı paylaşır) */
  rank: number;
  /** Geçerli değeri olan araç sayısı */
  count: number;
  /** 0–1: çubuğun doluluk oranı, her zaman "daha iyi = daha uzun" */
  score: number;
  /** 0–1: katalog ortalamasının çubuk üzerindeki yeri */
  avgScore: number;
}

/** Aracın her metrikte katalogdaki min/ortalama/maks değerlere göre yeri. Değeri olmayan metrik atlanır. */
export function catalogBenchmarks(vehicle: Vehicle, vehicles: Vehicle[]): BenchmarkStat[] {
  const stats: BenchmarkStat[] = [];

  for (const metric of BENCHMARK_METRICS) {
    const value = benchmarkValue(vehicle, metric.key);
    if (value === null) continue;

    const values = vehicles.map((v) => benchmarkValue(v, metric.key)).filter((n): n is number => n !== null);
    if (values.length < 3) continue;

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, n) => sum + n, 0) / values.length;
    const better = values.filter((n) => (metric.lowerIsBetter ? n < value : n > value)).length;
    const span = max - min;
    const toScore = (n: number) => (span === 0 ? 1 : metric.lowerIsBetter ? (max - n) / span : (n - min) / span);

    stats.push({
      metric,
      value,
      min,
      max,
      avg,
      rank: better + 1,
      count: values.length,
      // Katalogdaki en zayıf araçta da çubuk tamamen kaybolmasın
      score: Math.max(0.03, toScore(value)),
      avgScore: toScore(avg),
    });
  }

  return stats;
}
