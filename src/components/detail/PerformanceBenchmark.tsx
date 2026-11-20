import { useMemo } from 'react';
import { m } from 'framer-motion';
import type { Vehicle } from '../../types/vehicle';
import { catalogBenchmarks } from '../../lib/catalogStats';
import { TRANSITION, staggerDelay } from '../../lib/motion';

interface PerformanceBenchmarkProps {
  vehicle: Vehicle;
  vehicles: Vehicle[];
}

const format = (value: number, decimals: number) =>
  value.toLocaleString('tr-TR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/**
 * U4 — Aracın temel performans değerlerini katalogdaki min / ortalama / maks ile kıyaslayan ince showroom çubukları.
 * Çubuk her metrikte "daha iyi = daha uzun" okunur (0–100'de kısa süre daha iyi). İnce dikey çizgi katalog ortalamasıdır.
 */
export function PerformanceBenchmark({ vehicle, vehicles }: PerformanceBenchmarkProps) {
  const stats = useMemo(() => catalogBenchmarks(vehicle, vehicles), [vehicle, vehicles]);
  if (stats.length === 0) return null;

  return (
    <section aria-labelledby="benchmark-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Katalog Kıyası</p>
          <h3 id="benchmark-title" className="font-display text-xl font-normal text-foreground md:text-2xl">
            Sınıfındaki Yeri
          </h3>
        </div>
        <p className="flex items-center gap-2 text-2xs text-muted">
          <span className="inline-block h-3 w-px bg-muted" aria-hidden />
          Katalog ortalaması · çubuk uzadıkça daha iyi
        </p>
      </div>

      <dl className="grid gap-x-12 gap-y-8 md:grid-cols-2">
        {stats.map((stat, i) => {
          const { metric } = stat;
          return (
            <div key={metric.key} className="min-w-0">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="stat-label">{metric.label}</dt>
                <dd className="stat-value text-2xl">
                  {format(stat.value, metric.decimals)}
                  <span className="ml-1 text-xs text-muted">{metric.unit}</span>
                </dd>
              </div>

              <div className="relative mt-3 h-[2px] w-full bg-border-subtle" aria-hidden>
                <m.div
                  className="absolute inset-y-0 left-0 bg-foreground"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${stat.score * 100}%` }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ ...TRANSITION.slow, delay: staggerDelay(i, 0.06) }}
                />
                <span
                  className="absolute -top-1.5 h-[14px] w-px bg-muted"
                  style={{ left: `${stat.avgScore * 100}%` }}
                />
              </div>

              <p className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-2xs tabular-nums text-muted">
                <span>
                  {stat.count} araç içinde <span className="text-secondary">{stat.rank}.</span>
                </span>
                <span>
                  min {format(stat.min, metric.decimals)} · ort {format(stat.avg, metric.decimals)} · maks{' '}
                  {format(stat.max, metric.decimals)}
                </span>
              </p>
            </div>
          );
        })}
      </dl>
    </section>
  );
}
