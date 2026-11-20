import { useId, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, Link2, Printer, X } from 'lucide-react';
import type { Vehicle } from '../types/vehicle';
import { usePageMeta } from '../hooks/usePageMeta';
import { useAuth } from '../context/AuthContext';
import { useVehicleStore } from '../store/useVehicleStore';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { LoadingState, StatusScreen, VehicleLoadError } from '../components/ui/DataState';
import { SmartImage } from '../components/ui/SmartImage';
import { VehicleLink } from '../components/vehicle/VehicleLink';
import { UnverifiedNote } from '../components/detail/UnverifiedNote';
import { PrintFooter, PrintHeader, PrintPage, PrintSheet } from '../components/print/PrintSheet';
import { primaryButtonClass, secondaryButtonClass } from '../components/ui/buttonStyles';
import { formatPrice, formatVehiclePrice } from '../utils/formatPrice';
import { cleanText, vehicleBrand, vehicleModel, vehicleName } from '../utils/vehicleText';
import {
  MAX_DOSSIER,
  buildDossierEntries,
  buildDossierSummary,
  dossierSearch,
  parseDossierParams,
  resolveDossierVehicles,
  type DossierEntry,
} from '../lib/dossier';
import { DOWN_PAYMENT, FINANCE_TERMS, type OwnershipPlan } from '../lib/finance';
import { ANNUAL_KM, TCO_YEARS } from '../lib/tco';
import { hasUnverifiedSpecs, trustedSpec, type SpecKey } from '../lib/specTrust';
import { buildSpecSheet } from '../lib/specSheet';
import { formatLongDate } from '../lib/specLabels';
import { duelHref } from '../store/useCompareStore';
import { printDocument } from '../lib/print';
import { TRANSITION, fadeUp, staggerDelay } from '../lib/motion';

const tl = (value: number) => formatPrice(Math.round(value), 'TRY');

const KEY_SPECS: { key: SpecKey; label: string; unit: string; digits?: number }[] = [
  { key: 'powerHp', label: 'Güç', unit: 'HP' },
  { key: 'torqueNm', label: 'Tork', unit: 'Nm' },
  { key: 'zeroTo100Kmh', label: '0–100', unit: 'sn', digits: 1 },
  { key: 'bootCapacityL', label: 'Bagaj', unit: 'L' },
];

const sliderBackground = (percent: number) =>
  `linear-gradient(to right, rgb(var(--color-foreground)) ${percent}%, rgb(var(--color-border-subtle)) ${percent}%)`;

type CopyStatus = 'idle' | 'copied' | 'failed';

/**
 * 2.3 — Özel Müşteri Dosyası ("Private Office"). Garajdan seçilen 1–3 aracı, seçilen peşinat / vade / yıllık km ile
 * tek bir editoryal sayfada toplar: özet kartlar, finansman (lib/finance) + 5 yıllık maliyet (lib/tco), kısa fark özeti
 * (lib/duel). Tüm durum URL'dedir; "Bağlantıyı Kopyala" ve "PDF / Yazdır" (A4, 1.2 baskı altyapısı). Kişisel sayfa → noindex.
 */
export function DossierPage() {
  usePageMeta({ title: 'Özel Dosya', description: 'Seçtiğiniz modeller için hazırlanmış kişisel finansman ve sahip olma maliyeti dosyası.', noindex: true });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const loadError = useVehicleStore((s) => s.loadError);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const [today] = useState(() => formatLongDate(new Date()));
  const addId = useId();
  const kmId = useId();
  const downId = useId();

  const { keys, plan } = useMemo(() => parseDossierParams(searchParams), [searchParams]);
  const selected = useMemo(() => resolveDossierVehicles(keys, vehicles), [keys, vehicles]);
  const entries = useMemo(() => buildDossierEntries(selected, plan), [selected, plan]);
  const summary = useMemo(() => buildDossierSummary(entries), [entries]);
  const firstName = user?.displayName?.trim().split(/\s+/)[0];

  /** URL tek doğru kaynak: her değişiklik geçmişi şişirmeden (replace) yazılır */
  const update = (nextVehicles: Vehicle[], nextPlan: OwnershipPlan = plan) => {
    // Virgüller okunur kalsın (paylaşılan bağlantı: ?ids=a,b,c)
    const search = dossierSearch(nextVehicles, nextPlan).toString().replace(/%2C/gi, ',');
    navigate({ search: `?${search}` }, { replace: true, state: { preserveScroll: true } });
    setCopyStatus('idle');
  };
  const updatePlan = (patch: Partial<OwnershipPlan>) => update(selected, { ...plan, ...patch });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const print = () => void printDocument(`OtoVadi Özel Dosya — ${selected.map(vehicleName).join(', ')}`);

  if (isLoading) return <LoadingState label="Dosyanız hazırlanıyor..." />;
  if (loadError && vehicles.length === 0) return <VehicleLoadError />;

  const available = vehicles.filter((v) => !selected.some((s) => s.id === v.id));
  const addPicker = (
    <div className="flex flex-col gap-2">
      <label htmlFor={addId} className="stat-label">
        Araç ekle
      </label>
      <select
        id={addId}
        value=""
        disabled={selected.length >= MAX_DOSSIER}
        onChange={(e) => {
          const vehicle = vehicles.find((v) => v.id === e.target.value);
          if (vehicle) update([...selected, vehicle]);
        }}
        className="min-h-11 w-full cursor-pointer appearance-none border-b border-border-subtle bg-transparent py-2 font-sans text-sm text-foreground outline-none transition-colors focus:border-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-72"
      >
        <option value="" className="bg-void text-foreground">
          {selected.length >= MAX_DOSSIER ? `En fazla ${MAX_DOSSIER} araç` : 'Katalogdan seçin…'}
        </option>
        {available.map((v) => (
          <option key={v.id} value={v.id} className="bg-void text-foreground">
            {vehicleName(v)} ({v.year})
          </option>
        ))}
      </select>
    </div>
  );

  if (selected.length === 0) {
    return (
      <PageContainer width="narrow">
        <StatusScreen
          compact
          eyebrow="Özel Müşteri Dosyası"
          title="Dosyanız için bir model seçin"
          description="Garajınızdan dosya hazırlayabilir ya da katalogdan en fazla üç model ekleyebilirsiniz. Finansman ve 5 yıllık sahip olma maliyeti tek sayfada toplanır."
          actions={
            <Link to="/garajim" className={primaryButtonClass}>
              Garajıma Git
              <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
            </Link>
          }
        />
        <div className="mt-10 flex justify-center">{addPicker}</div>
      </PageContainer>
    );
  }

  const columns = selected.length === 1 ? 'md:grid-cols-1 md:max-w-xl' : selected.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';
  const planText = `%${plan.downPercent} peşinat · ${plan.term} ay vade · yılda ${plan.annualKm.toLocaleString('tr-TR')} km`;
  const anyUnverified = selected.some(hasUnverifiedSpecs);

  return (
    <>
      <PageContainer width="wide">
        <PageHeader
          eyebrow={
            <>
              <span lang="en">Private Office</span> · Özel Müşteri Dosyası
            </>
          }
          title="Kişisel Dosyanız"
          description={
            <>
              {firstName ? `${firstName} için, ` : ''}
              <span className="tabular-nums">{today}</span> tarihinde {selected.length} model için hazırlandı.
            </>
          }
          actions={
            <>
              <button type="button" onClick={copyLink} className={secondaryButtonClass}>
                <Link2 className="size-4" strokeWidth={1.5} aria-hidden />
                Bağlantıyı Kopyala
              </button>
              <button type="button" onClick={print} className={primaryButtonClass}>
                <Printer className="size-4" strokeWidth={1.5} aria-hidden />
                PDF / Yazdır
              </button>
            </>
          }
        />
        <p role="status" aria-live="polite" className="-mt-6 mb-8 min-h-5 text-sm text-muted md:-mt-10 md:mb-10">
          {copyStatus === 'copied' && 'Bağlantı kopyalandı. Dosyanız bu adresle aynı ayarlarla açılır.'}
          {copyStatus === 'failed' && 'Bağlantı kopyalanamadı; adres çubuğundaki bağlantıyı paylaşabilirsiniz.'}
        </p>

        {/* ── Ayarlar: araçlar + finansman + km (URL'ye yazılır) ── */}
        <section aria-label="Dosya ayarları" className="grid gap-10 border-y border-border-subtle py-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:gap-12">
          <div className="flex flex-col gap-4">
            <p className="stat-label">Modeller</p>
            <ul className="flex flex-wrap gap-2">
              {selected.map((v) => (
                <li key={v.id} className="inline-flex items-center gap-1 border border-border-subtle pl-3 text-sm text-foreground">
                  <span lang="en" className="truncate">
                    {vehicleName(v)}
                  </span>
                  <button
                    type="button"
                    onClick={() => update(selected.filter((s) => s.id !== v.id))}
                    disabled={selected.length === 1}
                    className="flex size-9 items-center justify-center text-muted transition-colors hover:text-foreground disabled:opacity-30"
                    aria-label={`${vehicleName(v)} dosyadan çıkar`}
                  >
                    <X className="size-3.5" strokeWidth={1.5} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
            {addPicker}
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <label htmlFor={downId} className="stat-label">
                Peşinat
              </label>
              <span className="text-lg font-medium tabular-nums text-foreground">%{plan.downPercent}</span>
            </div>
            <input
              id={downId}
              type="range"
              min={DOWN_PAYMENT.min}
              max={DOWN_PAYMENT.max}
              step={DOWN_PAYMENT.step}
              value={plan.downPercent}
              onChange={(e) => updatePlan({ downPercent: Number(e.target.value) })}
              aria-valuetext={`Yüzde ${plan.downPercent}`}
              className="range-thumb h-0.5 w-full cursor-pointer appearance-none bg-border-subtle outline-none"
              style={{ background: sliderBackground(((plan.downPercent - DOWN_PAYMENT.min) / (DOWN_PAYMENT.max - DOWN_PAYMENT.min)) * 100) }}
            />
          </div>

          <div className="space-y-4">
            <p className="stat-label">Vade</p>
            <div className="flex gap-3" role="group" aria-label="Vade">
              {FINANCE_TERMS.map((term) => (
                <button
                  key={term}
                  type="button"
                  aria-pressed={plan.term === term}
                  onClick={() => updatePlan({ term })}
                  className={`flex-1 border-b py-2 text-sm font-medium tabular-nums transition-colors ${
                    plan.term === term ? 'border-foreground text-foreground' : 'border-border-subtle text-muted hover:border-muted'
                  }`}
                >
                  {term} ay
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <label htmlFor={kmId} className="stat-label">
                Yıllık Kilometre
              </label>
              <span className="text-lg font-medium tabular-nums text-foreground">{plan.annualKm.toLocaleString('tr-TR')} km</span>
            </div>
            <input
              id={kmId}
              type="range"
              min={ANNUAL_KM.min}
              max={ANNUAL_KM.max}
              step={ANNUAL_KM.step}
              value={plan.annualKm}
              onChange={(e) => updatePlan({ annualKm: Number(e.target.value) })}
              aria-valuetext={`${plan.annualKm.toLocaleString('tr-TR')} km`}
              className="range-thumb h-0.5 w-full cursor-pointer appearance-none bg-border-subtle outline-none"
              style={{ background: sliderBackground(((plan.annualKm - ANNUAL_KM.min) / (ANNUAL_KM.max - ANNUAL_KM.min)) * 100) }}
            />
          </div>
        </section>

        {/* ── Araç sütunları ── */}
        <ul className={`mt-12 grid gap-x-10 gap-y-14 ${columns}`}>
          {entries.map((entry, index) => (
            <DossierColumn key={entry.vehicle.id} entry={entry} plan={plan} index={index} />
          ))}
        </ul>

        {/* ── Kısa fark özeti ── */}
        {summary.lines.length > 0 && (
          <section aria-labelledby="dossier-summary" className="mt-16 border-t border-border-subtle pt-10">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow mb-3">Danışman Notu</p>
                <h2 id="dossier-summary" className="text-display-sm font-normal text-foreground">
                  Kısa Fark Özeti
                </h2>
              </div>
              <Link
                to={duelHref(selected)}
                className="group inline-flex min-h-10 items-center gap-2 text-xs font-medium uppercase tracking-eyebrow text-foreground"
              >
                Kafa kafaya düelloda aç
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden />
              </Link>
            </div>
            <dl className="mt-8 grid gap-x-12 md:grid-cols-2">
              {summary.lines.map((line) => (
                <div key={line.label} className="flex flex-col gap-1 border-b border-border-subtle py-4 sm:flex-row sm:gap-6">
                  <dt className="stat-label shrink-0 sm:w-36 sm:pt-0.5">{line.label}</dt>
                  <dd className="text-sm leading-relaxed text-secondary">{line.text}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <div className="mt-12 flex flex-col gap-3">
          {(anyUnverified || summary.hasUnverified) && <UnverifiedNote />}
          <p className="max-w-3xl text-2xs leading-relaxed text-muted">
            Finansman ve maliyet tutarları temsili tahmindir; faiz oranı, kampanya, il ve hasarsızlık indirimi gibi koşullara
            göre değişir. Bugünkü fiyatlarla, enflasyonsuz hesaplanmıştır. Döviz fiyatlı araçlarda kasko yaklaşık kurla
            hesaplanır. Kesin teklif için danışmanınızla görüşün.
          </p>
        </div>
      </PageContainer>

      {/* ── A4 baskı (PDF olarak kaydet) ── */}
      <PrintSheet label="OtoVadi özel müşteri dosyası">
        <PrintPage fit="flow">
          <PrintHeader title="Özel Müşteri Dosyası" date={today} />
          <div className="mt-[6mm]">
            <p className="eyebrow" lang="en">
              Private Office
            </p>
            <h1 className="mt-2 font-display text-3xl font-normal text-foreground">
              Kişisel Dosyanız{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-2 text-xs tabular-nums text-muted">{planText}</p>
          </div>

          <div className="mt-[6mm] grid gap-x-[7mm]" style={{ gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))` }}>
            {entries.map((entry) => (
              <PrintColumn key={entry.vehicle.id} entry={entry} />
            ))}
          </div>

          {summary.lines.length > 0 && (
            <div className="print-avoid-break mt-[6mm]">
              <p className="stat-label border-b border-foreground pb-2">Kısa Fark Özeti</p>
              <dl className="grid grid-cols-2 gap-x-[8mm]">
                {summary.lines.map((line) => (
                  <div key={line.label} className="border-b border-border-subtle py-[1.6mm]">
                    <dt className="text-2xs uppercase tracking-eyebrow text-muted">{line.label}</dt>
                    <dd className="mt-0.5 text-xs leading-snug text-foreground">{line.text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <PrintFooter
            note={`Temsili hesaplamadır: ${planText}. Bugünkü fiyatlarla, enflasyonsuz. Doğrulanmamış teknik değerler basılmamış ve kıyasa alınmamıştır. Bu dosyanın güncel hali: otovadi.vercel.app/dosya`}
          />
        </PrintPage>
      </PrintSheet>
    </>
  );
}

/* ── Ekran: araç sütunu ─────────────────────────────────────────── */

function DossierColumn({ entry, plan, index }: { entry: DossierEntry; plan: OwnershipPlan; index: number }) {
  const { vehicle, finance, currency, tco } = entry;
  const trim = cleanText(vehicle.pricing?.trim);

  return (
    <m.li {...fadeUp} transition={{ ...TRANSITION.base, delay: staggerDelay(index) }} data-vt-root className="flex min-w-0 flex-col">
      <div data-vt="media">
        <SmartImage
          src={vehicle.media?.heroImage || vehicle.media?.thumbnail}
          alt={vehicleName(vehicle)}
          aspectRatio="16 / 10"
          colorHex={vehicle.media?.colorHex}
          priority={index < 3}
        />
      </div>

      <p className="eyebrow mt-6">
        <span lang="en">{vehicleBrand(vehicle)}</span> · <span className="tabular-nums">{vehicle.year}</span>
      </p>
      <h2 className="mt-2 text-display-sm font-normal text-foreground">
        <span data-vt="title">{vehicleModel(vehicle)}</span>
      </h2>
      {trim && <p className="mt-1 truncate text-sm text-muted">{trim}</p>}
      <p className="mt-3 text-xl font-medium tabular-nums text-foreground">{formatVehiclePrice(vehicle.pricing)}</p>

      <dl className="mt-6 grid grid-cols-4 border-y border-border-subtle py-3">
        {KEY_SPECS.map(({ key, label, unit, digits = 0 }, i) => {
          const value = trustedSpec(vehicle, key);
          return (
            <div key={key} className={`min-w-0 ${i > 0 ? 'border-l border-border-subtle pl-3' : 'pr-3'}`}>
              <dt className="stat-label truncate">{label}</dt>
              <dd className="mt-1 truncate text-sm font-medium tabular-nums text-foreground">
                {value === null ? (
                  <span className="text-muted">—</span>
                ) : (
                  <>
                    {value.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}
                    <span className="ml-1 text-xs font-normal text-muted">{unit}</span>
                  </>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="mt-8">
        <p className="stat-label">Aylık Ödeme</p>
        <p className="mt-2 font-sans text-4xl font-light tabular-nums tracking-tight text-foreground">
          {formatPrice(finance.monthly, currency)}
        </p>
        <p className="mt-2 text-xs tabular-nums text-muted">
          %{plan.downPercent} peşinat {formatPrice(finance.downAmount, currency)} · {plan.term} ay · aylık %
          {finance.monthlyRate.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (temsili)
        </p>
      </div>

      <div className="mt-8">
        <div className="flex items-end justify-between gap-4 border-b border-border-subtle pb-3">
          <div>
            <p className="stat-label">{TCO_YEARS} Yıllık Tahmini Maliyet</p>
            <p className="mt-2 text-2xl font-light tabular-nums text-foreground">{tl(tco.total)}</p>
          </div>
          <p className="text-right text-xs tabular-nums text-muted">
            Aylık ort.
            <br />
            <span className="text-secondary">{tl(tco.monthly)}</span>
          </p>
        </div>
        <ul className="mt-3 flex flex-col">
          {tco.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4 py-1.5 text-sm">
              <span className="text-secondary">{item.label}</span>
              <span className="tabular-nums text-foreground">{tl(item.amount)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-2xs tabular-nums text-muted">
          Tahmini tüketim {tco.consumption.value.toLocaleString('tr-TR')} {tco.consumption.unit}/100 km
          {tco.usedFallbackSpecs ? ' · gövde tipi ortalamasıyla' : ''}
        </p>
      </div>

      <VehicleLink
        vehicle={vehicle}
        className="group mt-8 inline-flex min-h-10 items-center gap-2 self-start text-xs font-medium uppercase tracking-eyebrow text-foreground"
      >
        Detayı İncele
        <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden />
      </VehicleLink>
    </m.li>
  );
}

/* ── Baskı: araç sütunu ─────────────────────────────────────────── */

function PrintColumn({ entry }: { entry: DossierEntry }) {
  const { vehicle, finance, currency, tco } = entry;
  const sheet = buildSpecSheet(vehicle);
  const rows = [...sheet.engine.slice(0, 5), ...sheet.dimensions.filter((r) => r.label === 'Bagaj' || r.label === 'Ağırlık')];

  return (
    <div className="print-avoid-break min-w-0">
      <SmartImage
        src={vehicle.media?.heroImage || vehicle.media?.thumbnail}
        alt={vehicleName(vehicle)}
        aspectRatio="2 / 1"
        colorHex={vehicle.media?.colorHex}
        priority
      />
      <p className="eyebrow mt-[3mm]">
        <span lang="en">{vehicleBrand(vehicle)}</span> · <span className="tabular-nums">{vehicle.year}</span>
      </p>
      <p className="mt-1 font-display text-xl leading-tight text-foreground">{vehicleModel(vehicle)}</p>
      <p className="mt-1 text-sm font-medium tabular-nums text-foreground">{formatVehiclePrice(vehicle.pricing)}</p>

      <dl className="mt-[3mm] border-t border-foreground">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-2 border-b border-border-subtle py-[1mm]">
            <dt className="text-2xs text-muted">{row.label}</dt>
            <dd className="truncate text-right text-2xs tabular-nums text-foreground">{row.value}</dd>
          </div>
        ))}
        {rows.length === 0 && <p className="py-[1.2mm] text-2xs text-muted">Teknik değerler doğrulama aşamasında.</p>}
      </dl>

      <div className="mt-[4mm]">
        <p className="text-2xs uppercase tracking-eyebrow text-muted">Aylık Ödeme</p>
        <p className="text-lg font-light tabular-nums text-foreground">{formatPrice(finance.monthly, currency)}</p>
        <p className="text-2xs tabular-nums text-muted">Peşinat {formatPrice(finance.downAmount, currency)}</p>
      </div>
      <div className="mt-[3mm]">
        <p className="text-2xs uppercase tracking-eyebrow text-muted">{TCO_YEARS} Yıllık Maliyet</p>
        <p className="text-lg font-light tabular-nums text-foreground">{tl(tco.total)}</p>
        <dl>
          {tco.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-2 py-[0.4mm]">
              <dt className="truncate text-2xs text-muted">{item.label}</dt>
              <dd className="text-2xs tabular-nums text-foreground">{tl(item.amount)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
