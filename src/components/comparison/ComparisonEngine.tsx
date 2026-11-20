import { useMemo, useState, type CSSProperties } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ChevronDown, Link2, Minus, Plus, X } from 'lucide-react';
import { useVehicleStore } from '../../store/useVehicleStore';
import { MAX_COMPARE, duelHref, useCompareStore } from '../../store/useCompareStore';
import type { Vehicle } from '../../types/vehicle';
import { LoadingState, StatusScreen, VehicleLoadError } from '../ui/DataState';
import { primaryButtonClass } from '../ui/buttonStyles';
import { SmartImage } from '../ui/SmartImage';
import { PageContainer } from '../layout/PageContainer';
import { PageHeader } from '../layout/PageHeader';
import { cleanText, vehicleBrand, vehicleModel, vehicleName } from '../../utils/vehicleText';
import {
  DUEL_PARAM_KEYS,
  buildDuelRows,
  duelFeatures,
  duelScore,
  resolveDuelSelection,
  type DuelRow,
} from '../../lib/duel';

const toolButtonClass =
  'inline-flex min-h-11 items-center gap-2 border border-border-subtle px-4 text-xs font-medium uppercase tracking-eyebrow text-foreground transition-colors hover:border-foreground disabled:cursor-not-allowed disabled:opacity-40';

/**
 * Y1 — Kafa Kafaya Düello (/karsilastir). Sütunlar paylaşılabilir URL'den (?a=&b=&c=), yoksa karşılaştırma tepsisinden gelir.
 * Seçim değişince URL güncellenir (replace). Sayısal satırlarda kazanan vurgulanır, fark rozeti ve Düello Skoru üretilir.
 */
export function ComparisonEngine() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const loadError = useVehicleStore((s) => s.loadError);
  const trayIds = useCompareStore((s) => s.ids);
  const [searchParams, setSearchParams] = useSearchParams();
  const [onlyDiff, setOnlyDiff] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const urlKeys = DUEL_PARAM_KEYS.map((key) => searchParams.get(key)).filter((v): v is string => Boolean(v));
  const urlKey = urlKeys.join('|');
  const selected = useMemo(
    () => resolveDuelSelection(urlKey ? urlKey.split('|') : [], trayIds, vehicles),
    [urlKey, trayIds, vehicles],
  );
  const rows = useMemo(() => buildDuelRows(selected), [selected]);
  const features = useMemo(() => duelFeatures(selected), [selected]);
  const score = useMemo(() => duelScore(rows.numeric, selected.length), [rows, selected.length]);
  const sortedOptions = useMemo(
    () => [...vehicles].sort((a, b) => vehicleName(a).localeCompare(vehicleName(b), 'tr')),
    [vehicles],
  );

  if (isLoading) {
    return <LoadingState label="Düello hazırlanıyor..." />;
  }

  if (selected.length < 2) {
    if (loadError) return <VehicleLoadError />;
    return (
      <StatusScreen
        eyebrow="Düello"
        title="Karşılaştırma için yeterli araç yok"
        description="Düello için katalogda en az iki araç bulunmalı."
        actions={
          <Link to="/modeller" className={primaryButtonClass}>
            Modelleri Keşfet
          </Link>
        }
      />
    );
  }

  /** Seçimi URL'ye yazar (paylaşılabilir bağlantı); geçmişi şişirmemek için replace */
  const commit = (next: Vehicle[]) => {
    const params = new URLSearchParams();
    next.slice(0, MAX_COMPARE).forEach((v, i) => params.set(DUEL_PARAM_KEYS[i], v.slug || v.id));
    setSearchParams(params, { replace: true });
    setShareStatus('idle');
  };

  const changeAt = (index: number, vehicleId: string) => {
    const chosen = vehicles.find((v) => v.id === vehicleId);
    if (!chosen) return;
    const next = [...selected];
    const existing = next.findIndex((v) => v.id === chosen.id);
    // Aynı araç başka sütundaysa yer değiştirir
    if (existing >= 0) next[existing] = next[index];
    next[index] = chosen;
    commit(next);
  };

  const removeAt = (index: number) => commit(selected.filter((_, i) => i !== index));

  const addColumn = () => {
    const candidate = vehicles.find((v) => !selected.some((s) => s.id === v.id));
    if (candidate) commit([...selected, candidate]);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${duelHref(selected)}`);
      setShareStatus('copied');
    } catch {
      setShareStatus('error');
    }
  };

  const columns = selected.length;
  const gridStyle: CSSProperties = { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` };
  const visibleNumeric = onlyDiff ? rows.numeric.filter((r) => !r.allEqual) : rows.numeric;
  const visibleSpecs = onlyDiff ? rows.specs.filter((r) => !r.allEqual) : rows.specs;
  const visibleFeatures = onlyDiff ? features.filter((f) => !f.has.every(Boolean)) : features;
  const leader = Math.max(...score.wins);
  const leaders = score.wins.filter((w) => w === leader).length;

  return (
    <PageContainer width="wide">
      <PageHeader
        eyebrow="Kafa Kafaya"
        title="Düello"
        description="Araçları yan yana koyun: her teknik satırda öne geçen otomatik işaretlenir, farklar rozetle gösterilir."
        actions={
          <div className="flex flex-col items-start gap-2 md:items-end">
            <button type="button" onClick={copyLink} className={toolButtonClass}>
              {shareStatus === 'copied' ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" strokeWidth={1.5} aria-hidden />}
              {shareStatus === 'copied' ? 'Bağlantı Kopyalandı' : 'Bağlantıyı Kopyala'}
            </button>
            <p role="status" className="min-h-4 text-2xs text-muted">
              {shareStatus === 'error' && 'Pano erişimi yok; adres çubuğundaki bağlantıyı paylaşabilirsiniz.'}
            </p>
          </div>
        }
      />

      {/* ── Düello Skoru ── */}
      <section aria-labelledby="duel-score" className="mb-10 border border-border-subtle bg-surface p-5 md:mb-14 md:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="duel-score" className="eyebrow">
            Düello Skoru
          </h2>
          <p className="text-xs tabular-nums text-muted">
            {score.categories} kategori{score.ties > 0 ? ` · ${score.ties} berabere` : ''}
          </p>
        </div>
        <div className="mt-6 grid gap-3 md:gap-8" style={gridStyle}>
          {selected.map((vehicle, i) => {
            const isLeader = leader > 0 && score.wins[i] === leader && leaders === 1;
            return (
              <div key={vehicle.id} className="min-w-0">
                <p className="truncate font-display text-sm text-foreground md:text-lg">{vehicleModel(vehicle)}</p>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="stat-value text-4xl md:text-6xl">{score.wins[i]}</span>
                  {isLeader && (
                    <span className="border border-success/40 px-1.5 py-0.5 text-2xs font-medium uppercase tracking-eyebrow text-success">
                      Önde
                    </span>
                  )}
                </p>
                <p className="mt-1 truncate text-2xs text-muted">kategoride önde</p>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex h-1 gap-1" aria-hidden>
          {selected.map((vehicle, i) => (
            <div
              key={vehicle.id}
              className={`transition-[flex-grow] duration-550 ${
                leader > 0 && score.wins[i] === leader ? 'bg-foreground' : 'bg-foreground/35'
              }`}
              style={{ flexGrow: score.wins[i] || 0.001 }}
            />
          ))}
          {score.ties > 0 && <div className="bg-border-strong" style={{ flexGrow: score.ties }} />}
        </div>
      </section>

      {/* ── Araç seçicileri (yapışkan) ── */}
      <div className="sticky top-16 z-20 -mx-4 border-b border-border-subtle bg-void/90 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8 lg:-mx-12 lg:px-12">
        <div className="grid gap-3 md:gap-8" style={gridStyle}>
          {selected.map((vehicle, i) => (
            <div key={vehicle.id} className="flex min-w-0 items-center gap-1">
              <div className="relative min-w-0 flex-1">
                <select
                  value={vehicle.id}
                  onChange={(e) => changeAt(i, e.target.value)}
                  aria-label={`${i + 1}. aracı seçin`}
                  className="w-full cursor-pointer appearance-none truncate border-b border-border-subtle bg-transparent py-2 pr-6 font-display text-sm text-foreground transition-colors hover:border-border-strong focus:outline-none focus-visible:border-foreground sm:text-lg"
                >
                  {sortedOptions.map((v) => (
                    <option key={v.id} value={v.id} className="bg-void font-sans text-base text-foreground">
                      {vehicleName(v)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              </div>
              {columns > 2 && (
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label={`${vehicleName(vehicle)} sütununu kaldır`}
                  className="flex size-9 shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground"
                >
                  <X className="size-4" strokeWidth={1.5} aria-hidden />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Stüdyo görselleri ── */}
      <div className="grid gap-3 py-8 md:gap-8 md:py-12" style={gridStyle}>
        {selected.map((vehicle) => (
          <div key={vehicle.id} className="flex min-w-0 flex-col">
            <SmartImage
              src={vehicle.interactiveGallery?.studioImage || vehicle.media?.heroImage}
              alt={vehicleName(vehicle)}
              aspectRatio="16 / 10"
              fit="contain"
              colorHex={vehicle.media?.colorHex}
            />
            <p className="eyebrow mt-4 truncate" lang="en">
              {vehicleBrand(vehicle)} · <span className="tabular-nums">{vehicle.year}</span>
            </p>
            <p className="mt-1 truncate text-xs text-muted">{cleanText(vehicle.pricing?.trim)}</p>
            <Link
              to={`/arac/${vehicle.id}`}
              className="mt-3 self-start text-2xs font-medium uppercase tracking-eyebrow text-secondary underline-offset-4 hover:text-foreground hover:underline"
            >
              Detayı incele
            </Link>
          </div>
        ))}
      </div>

      {/* ── Araç çubuğu ── */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-y border-border-subtle py-4">
        <button
          type="button"
          role="switch"
          aria-checked={onlyDiff}
          onClick={() => setOnlyDiff((v) => !v)}
          className="inline-flex min-h-11 items-center gap-3 text-sm text-foreground"
        >
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
              onlyDiff ? 'border-foreground bg-foreground' : 'border-border-strong bg-transparent'
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 size-3.5 rounded-full transition-transform ${
                onlyDiff ? 'translate-x-[1.125rem] bg-void' : 'translate-x-0.5 bg-foreground'
              }`}
            />
          </span>
          Sadece farkları göster
        </button>
        {columns < MAX_COMPARE && (
          <button type="button" onClick={addColumn} className={toolButtonClass}>
            <Plus className="size-4" strokeWidth={1.5} aria-hidden />
            Üçüncü aracı ekle
          </button>
        )}
      </div>

      <DuelSection title="Performans ve Değer" rows={visibleNumeric} gridStyle={gridStyle} />
      <DuelSection title="Teknik Özellikler" rows={visibleSpecs} gridStyle={gridStyle} />

      {/* ── Donanımlar ── */}
      <section className="mt-12">
        <h2 className="eyebrow border-b border-border-subtle pb-4">Öne Çıkan Donanımlar</h2>
        {visibleFeatures.length === 0 ? (
          <p className="py-6 text-sm text-muted">{onlyDiff ? 'Donanımlarda fark yok.' : 'Donanım bilgisi bulunmuyor.'}</p>
        ) : (
          visibleFeatures.map((feature) => (
            <div key={feature.name} className="border-b border-border-subtle py-4">
              <p className="text-center text-xs font-medium text-secondary sm:text-sm">{feature.name}</p>
              <div className="mt-2 grid gap-3 md:gap-8" style={gridStyle}>
                {feature.has.map((has, i) => (
                  <div key={selected[i].id} className="flex justify-center">
                    {has ? (
                      <Check className="size-5 stroke-[1.5] text-success" aria-label="Var" />
                    ) : (
                      <Minus className="size-5 stroke-[1] text-muted" aria-label="Yok" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      <p className="mt-10 max-w-3xl text-2xs leading-relaxed text-muted">
        Değerler katalog verisinden alınır. Tahmini tüketim temsili bir hesaplamadır; farklı para birimli fiyatlar yalnızca
        sıralama için yaklaşık kurla karşılaştırılır. Admin panelinden eklenen bazı araçlarda boyut ve ağırlık varsayılan değerdir.
      </p>
    </PageContainer>
  );
}

interface DuelSectionProps {
  title: string;
  rows: DuelRow[];
  gridStyle: CSSProperties;
}

function DuelSection({ title, rows, gridStyle }: DuelSectionProps) {
  return (
    <section className="mt-10">
      <h2 className="eyebrow border-b border-border-subtle pb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-6 text-sm text-muted">Bu bölümde fark yok.</p>
      ) : (
        rows.map((row) => (
          <div key={row.id} className="border-b border-border-subtle py-5">
            <p className="stat-label text-center">{row.label}</p>
            <div className="mt-3 grid gap-3 md:gap-8" style={gridStyle}>
              {row.cells.map((cell, i) => {
                const isWinner = row.winner === i;
                const dimmed = row.winner !== null && !isWinner;
                return (
                  <div key={i} className="flex min-w-0 flex-col items-center text-center">
                    <span
                      className={`stat-value max-w-full ${row.text ? 'text-sm leading-snug [overflow-wrap:anywhere] sm:text-lg md:text-xl' : 'truncate text-base sm:text-2xl md:text-3xl'} ${dimmed ? 'text-secondary' : ''}`}
                      title={`${cell.display}${cell.unit ? ` ${cell.unit}` : ''}`}
                    >
                      {cell.display}
                      {cell.unit && <span className="ml-1 text-2xs text-muted sm:text-xs">{cell.unit}</span>}
                    </span>
                    {isWinner && row.badge && (
                      <span className="mt-2 inline-flex max-w-full items-center truncate border border-success/40 bg-success/10 px-2 py-0.5 text-2xs font-medium tabular-nums text-success">
                        {row.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            {row.scored && row.winner === null && (
              <p className="mt-2 text-center text-2xs text-muted">Berabere</p>
            )}
            {row.note && <p className="mt-2 text-center text-2xs text-muted">{row.note}</p>}
          </div>
        ))
      )}
    </section>
  );
}
