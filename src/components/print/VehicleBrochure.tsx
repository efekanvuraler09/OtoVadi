import { useMemo } from 'react';
import type { Vehicle } from '../../types/vehicle';
import { SmartImage } from '../ui/SmartImage';
import { PrintFooter, PrintHeader, PrintPage, PrintSheet } from './PrintSheet';
import { formatPrice, formatVehiclePrice, resolveCurrency } from '../../utils/formatPrice';
import { cleanText, vehicleBrand, vehicleModel, vehicleName } from '../../utils/vehicleText';
import { buildSpecSheet, type SpecRow } from '../../lib/specSheet';
import { trustedHighlights, trustedText } from '../../lib/specTrust';
import { calculateFinance, type OwnershipPlan } from '../../lib/finance';
import { DEFAULT_UNIT_PRICE, ENERGY_LABEL, TCO_YEARS, calculateTco } from '../../lib/tco';
import { energyKind } from '../../lib/vehicleMetrics';
import { formatLongDate } from '../../lib/specLabels';

interface VehicleBrochureProps {
  vehicle: Vehicle;
  /** Detay sayfasındaki peşinat / vade / yıllık km seçimi aynen basılır */
  plan: OwnershipPlan;
}

const tl = (value: number) => formatPrice(Math.round(value), 'TRY');

function SpecList({ title, rows, empty }: { title: string; rows: SpecRow[]; empty: string }) {
  return (
    <div className="print-avoid-break min-w-0">
      <p className="stat-label border-b border-foreground pb-2">{title}</p>
      {rows.length > 0 ? (
        <dl>
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-border-subtle py-[1.3mm]">
              <dt className="text-xs text-muted">{row.label}</dt>
              <dd className="text-right text-xs font-medium tabular-nums text-foreground">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="pt-2 text-xs leading-relaxed text-muted">{empty}</p>
      )}
    </div>
  );
}

/**
 * 1.2 — "Teknik Künye" A4 broşürü. Yalnızca baskıda görünür (PrintSheet). Matbaa düzeni: üst bant, kapak görseli,
 * Playfair başlık, iki sütun DOĞRULANMIŞ teknik künye, finansman + 5 yıllık maliyet özeti ve serif imzalı altbilgi.
 * Şablon (doğrulanmamış) değerler basılmaz; sayısı dipnotta belirtilir.
 */
export function VehicleBrochure({ vehicle, plan }: VehicleBrochureProps) {
  const sheet = useMemo(() => buildSpecSheet(vehicle), [vehicle]);
  const currency = resolveCurrency(vehicle.pricing);
  const finance = calculateFinance(vehicle.pricing.msrp, currency, plan.downPercent, plan.term);
  const kind = energyKind(vehicle);
  const tco = useMemo(
    () => calculateTco(vehicle, { annualKm: plan.annualKm, unitPrice: DEFAULT_UNIT_PRICE[kind] }),
    [vehicle, plan.annualKm, kind],
  );
  const tagline = trustedText(vehicle.tagline);
  const highlights = trustedHighlights(vehicle).slice(0, 6);
  const trim = cleanText(vehicle.pricing.trim);
  const date = formatLongDate(new Date());

  return (
    <PrintSheet label={`${vehicleName(vehicle)} teknik künye`}>
      <PrintPage>
        <PrintHeader title="Teknik Künye" date={date} />

        <div className="mt-[6mm]">
          <SmartImage
            src={vehicle.media?.heroImage || vehicle.media?.thumbnail}
            alt={vehicleName(vehicle)}
            aspectRatio="16 / 6"
            colorHex={vehicle.media?.colorHex}
            priority
          />
        </div>

        <div className="mt-[6mm] flex items-end justify-between gap-8">
          <div className="min-w-0">
            <p className="eyebrow">
              <span lang="en">{vehicleBrand(vehicle)}</span> · <span className="tabular-nums">{vehicle.year}</span>
            </p>
            <h1 className="mt-2 font-display text-4xl font-normal leading-tight text-foreground">{vehicleModel(vehicle)}</h1>
            {tagline && <p className="mt-2 text-sm text-secondary">{tagline}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="stat-label">Liste Fiyatı</p>
            <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{formatVehiclePrice(vehicle.pricing)}</p>
            {trim && <p className="mt-1 text-xs text-muted">{trim}</p>}
          </div>
        </div>

        <div className="mt-[6mm] grid grid-cols-2 gap-x-[10mm]">
          <SpecList title="Motor ve Performans" rows={sheet.engine} empty="Motor değerleri doğrulama aşamasında." />
          <SpecList title="Boyutlar ve Ağırlık" rows={sheet.dimensions} empty="Boyut bilgileri doğrulama aşamasında." />
        </div>

        {highlights.length > 0 && (
          <p className="mt-[5mm] text-xs leading-relaxed text-secondary">
            <span className="stat-label mr-2">Öne Çıkanlar</span>
            {highlights.join(' · ')}
          </p>
        )}

        <div className="print-avoid-break mt-[6mm] grid grid-cols-2 gap-x-[10mm]">
          <div>
            <p className="stat-label border-b border-foreground pb-2">Finansman Örneği</p>
            <div className="flex items-end justify-between gap-4 pt-3">
              <div>
                <p className="text-xs text-muted">Aylık Ödeme</p>
                <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{formatPrice(finance.monthly, currency)}</p>
              </div>
              <p className="text-right text-xs leading-relaxed tabular-nums text-muted">
                %{finance.downPercent} peşinat · {formatPrice(finance.downAmount, currency)}
                <br />
                {finance.term} ay · aylık %{finance.monthlyRate.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (temsili)
              </p>
            </div>
          </div>

          <div>
            <p className="stat-label border-b border-foreground pb-2">{TCO_YEARS} Yıllık Sahip Olma Maliyeti</p>
            <div className="flex items-end justify-between gap-4 pt-3">
              <div>
                <p className="text-xs text-muted">Tahmini Toplam</p>
                <p className="mt-1 text-2xl font-light tabular-nums text-foreground">{tl(tco.total)}</p>
              </div>
              <p className="text-right text-xs tabular-nums text-muted">
                Aylık ort. {tl(tco.monthly)}
                <br />
                {plan.annualKm.toLocaleString('tr-TR')} km/yıl
                <br />
                {ENERGY_LABEL[kind].name} {DEFAULT_UNIT_PRICE[kind].toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{' '}
                {ENERGY_LABEL[kind].unit}
              </p>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-6">
              {tco.items.map((item) => (
                <div key={item.id} className="flex items-baseline justify-between gap-2 border-b border-border-subtle py-[1.2mm]">
                  <dt className="truncate text-2xs text-muted">{item.label.replace(/\s*\(5 yıl\)/, '')}</dt>
                  <dd className="text-2xs tabular-nums text-foreground">{tl(item.amount)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <PrintFooter
          note={[
            'Finansman ve maliyet tutarları temsili tahmindir; kesin teklif için danışmanınızla görüşün. Bugünkü fiyatlarla, enflasyonsuz hesaplanmıştır.',
            tco.usedApproxFx ? 'Döviz fiyatlı araçta kasko yaklaşık kurla hesaplanmıştır.' : '',
            sheet.omitted > 0
              ? `Doğrulanmamış ${sheet.omitted} teknik değer bu künyeye basılmamıştır.`
              : 'Teknik değerler katalog kaydından alınmıştır.',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </PrintPage>
    </PrintSheet>
  );
}
