import { useId, useMemo, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { formatPrice } from '../../utils/formatPrice';
import { ANNUAL_KM, DEFAULT_UNIT_PRICE, ENERGY_LABEL, TCO_YEARS, calculateTco } from '../../lib/tco';
import { energyKind } from '../../lib/vehicleMetrics';
import { TRANSITION } from '../../lib/motion';

interface TcoCalculatorProps {
  vehicle: Vehicle;
  /** Yıllık km VehicleDetailPage'de tutulur (A4 broşür aynı değeri basar) */
  annualKm: number;
  onAnnualKmChange: (value: number) => void;
}

const tl = (value: number) => formatPrice(Math.round(value), 'TRY');
const decimal = (value: number, digits = 2) =>
  value.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Virgüllü ("71,20") veya noktalı girişi sayıya çevirir */
function parseUnitPrice(raw: string): number {
  const normalized = raw.replace(/\s/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

const sliderBackground = (percent: number) =>
  `linear-gradient(to right, rgb(var(--color-foreground)) ${percent}%, rgb(var(--color-border-subtle)) ${percent}%)`;

/**
 * Y2 — Türkiye'ye özel 5 yıllık sahip olma maliyeti. Yıllık km ve birim enerji fiyatı kullanıcıdan;
 * MTV, kasko ve bakım temsili dilimlerden (lib/tco.ts). Bileşen araç id'siyle key'lenir: araç değişince varsayılanlara döner.
 */
export function TcoCalculator({ vehicle, annualKm, onAnnualKmChange: setAnnualKm }: TcoCalculatorProps) {
  const kind = energyKind(vehicle);
  const energy = ENERGY_LABEL[kind];
  const defaultPrice = DEFAULT_UNIT_PRICE[kind];
  const [priceInput, setPriceInput] = useState(() => decimal(defaultPrice));
  const unitPrice = parseUnitPrice(priceInput);
  const kmId = useId();
  const priceId = useId();

  const result = useMemo(() => calculateTco(vehicle, { annualKm, unitPrice }), [vehicle, annualKm, unitPrice]);
  const kmPercent = ((annualKm - ANNUAL_KM.min) / (ANNUAL_KM.max - ANNUAL_KM.min)) * 100;
  const isDefaultPrice = Math.abs(unitPrice - defaultPrice) < 0.005;

  return (
    <div className="flex flex-col items-start gap-12 lg:flex-row lg:gap-16">
      {/* ── Girdiler ── */}
      <div className="w-full flex-1 space-y-10">
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <label htmlFor={kmId} className="stat-label">
              Yıllık Kilometre
            </label>
            <span className="text-xl font-medium tabular-nums text-foreground">
              {annualKm.toLocaleString('tr-TR')} <span className="text-sm font-normal text-muted">km</span>
            </span>
          </div>
          <input
            id={kmId}
            type="range"
            min={ANNUAL_KM.min}
            max={ANNUAL_KM.max}
            step={ANNUAL_KM.step}
            value={annualKm}
            onChange={(e) => setAnnualKm(Number(e.target.value))}
            aria-valuetext={`${annualKm.toLocaleString('tr-TR')} km`}
            className="range-thumb h-0.5 w-full cursor-pointer appearance-none bg-border-subtle outline-none"
            style={{ background: sliderBackground(kmPercent) }}
          />
          <div className="flex justify-between text-2xs tabular-nums text-muted">
            <span>{ANNUAL_KM.min.toLocaleString('tr-TR')} km</span>
            <span>{ANNUAL_KM.max.toLocaleString('tr-TR')} km</span>
          </div>
        </div>

        <div className="space-y-3">
          <label htmlFor={priceId} className="stat-label block">
            {energy.name} Birim Fiyatı
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center border-b border-border-strong focus-within:border-foreground">
              <input
                id={priceId}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value.replace(/[^\d.,]/g, ''))}
                onBlur={() => setPriceInput(decimal(unitPrice))}
                className="w-24 bg-transparent text-xl font-medium tabular-nums text-foreground caret-foreground outline-none"
              />
              <span className="pl-2 text-sm text-muted">{energy.unit}</span>
            </div>
            {!isDefaultPrice && (
              <button
                type="button"
                onClick={() => setPriceInput(decimal(defaultPrice))}
                className="inline-flex min-h-11 items-center gap-1.5 text-2xs font-medium uppercase tracking-eyebrow text-muted transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-3.5" strokeWidth={1.5} aria-hidden />
                Varsayılan ({decimal(defaultPrice)})
              </button>
            )}
          </div>
          <p className="text-2xs leading-relaxed text-muted">
            Varsayılan: {kind === 'electric' ? 'Kasım 2026 kamusal AC şarj ortalaması' : 'Kasım 2026 İstanbul pompa fiyatı'}. Tahmini
            tüketim{' '}
            <span className="tabular-nums text-secondary">
              {decimal(result.consumption.value, 1)} {result.consumption.unit}/100 km
            </span>{' '}
            {result.consumption.reliable
              ? '(motor gücü, ağırlık ve motor hacminden hesaplanır).'
              : '(teknik değerler doğrulanmadığı için gövde tipi ortalamasından hesaplanır).'}
          </p>
        </div>
      </div>

      {/* ── Sonuç ── */}
      <div className="w-full flex-1">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-border-subtle pb-6">
          <div>
            <p className="stat-label mb-2">{TCO_YEARS} Yıllık Tahmini Toplam</p>
            <AnimatePresence mode="wait" initial={false}>
              <m.p
                key={Math.round(result.total)}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={TRANSITION.fast}
                className="font-sans text-4xl font-light tabular-nums tracking-tight text-foreground md:text-5xl"
                aria-live="polite"
              >
                {tl(result.total)}
              </m.p>
            </AnimatePresence>
          </div>
          <div className="text-left sm:text-right">
            <p className="stat-label mb-2">Aylık Ortalama</p>
            <p className="text-2xl font-light tabular-nums text-foreground">{tl(result.monthly)}</p>
          </div>
        </div>

        <ul className="mt-6 flex flex-col gap-5">
          {result.items.map((item) => (
            <li key={item.id}>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className="text-sm font-medium tabular-nums text-foreground">
                  {tl(item.amount)}
                  <span className="ml-2 inline-block w-10 text-right text-xs font-normal text-muted">
                    %{Math.round(item.share * 100)}
                  </span>
                </span>
              </div>
              <div className="mt-2 h-[2px] w-full bg-border-subtle" aria-hidden>
                <div
                  className="h-full bg-foreground transition-[width] duration-350"
                  style={{ width: `${Math.max(item.share * 100, item.amount > 0 ? 1 : 0)}%` }}
                />
              </div>
              <p className="mt-1.5 text-2xs tabular-nums text-muted">{item.note}</p>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-2xs leading-relaxed text-muted">
          Tutarlar girilen kilometre ve güncel ortalama birim maliyetlere dayalı temsili tahminlerdir. Bugünkü fiyatlarla
          hesaplanır; zam, enflasyon, il ve hasarsızlık indirimi dikkate alınmaz. MTV 2026 tarifesinin temsili dilimidir.
          {result.usedApproxFx && ' Döviz fiyatlı araçlarda kasko, araç değeri yaklaşık kurla TL’ye çevrilerek hesaplanır.'}
          {result.usedFallbackSpecs &&
            ' Bu araçta bazı teknik değerler henüz doğrulanmadığından tüketim ve vergi dilimi gövde tipi ortalamasıyla tahmin edilmiştir.'}
        </p>
      </div>
    </div>
  );
}
