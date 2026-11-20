import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { subscribeCollectionBySlug } from '../services/collectionService';
import { useVehicleStore } from '../store/useVehicleStore';
import { formatVehiclePrice } from '../utils/formatPrice';
import { vehicleBrand, vehicleModel, vehicleName } from '../utils/vehicleText';
import { LoadErrorState, LoadingState } from '../components/ui/DataState';
import { SmartImage } from '../components/ui/SmartImage';
import { PageContainer } from '../components/layout/PageContainer';
import { useBackNavigation } from '../hooks/useBackNavigation';
import { NotFoundPage } from './NotFoundPage';
import { TRANSITION, fade, fadeUp } from '../lib/motion';
import type { VehicleCollection } from '../types/collection';
import type { Vehicle } from '../types/vehicle';
import { trustedSpec } from '../lib/specTrust';
import { VehicleLink } from '../components/vehicle/VehicleLink';

import { usePageMeta } from '../hooks/usePageMeta';
export function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [col, setCol] = useState<VehicleCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const vehicles = useVehicleStore((s) => s.vehicles);
  const goBack = useBackNavigation('/koleksiyonlar');

  useEffect(() => {
    if (!slug) return;
    const unsub = subscribeCollectionBySlug(
      slug,
      (data) => {
        if (!data) {
          setNotFound(true);
        } else {
          setCol(data);
          setNotFound(false);
        }
        setLoadFailed(false);
        setIsLoading(false);
      },
      () => {
        setLoadFailed(true);
        setIsLoading(false);
      },
    );
    return () => unsub();
  }, [slug, attempt]);

  // Bulunamadıysa null: içeride render edilen NotFoundPage kendi başlığını yazar
  usePageMeta(
    col
      ? { title: col.title, description: col.subtitle || col.curatorNote, image: col.coverImage }
      : notFound
        ? null
        : { title: 'Koleksiyonlar' },
  );

  if (isLoading) {
    return <LoadingState label="Koleksiyon yükleniyor..." />;
  }

  if (loadFailed && !col) {
    return (
      <LoadErrorState
        title="Koleksiyon yüklenemedi"
        onRetry={() => {
          setIsLoading(true);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  if (notFound || !col) {
    return (
      <NotFoundPage
        title="Koleksiyon bulunamadı"
        description="Bu koleksiyon yayından kaldırılmış ya da bağlantı hatalı olabilir."
        backTo="/koleksiyonlar"
        backLabel="Koleksiyonlara Dön"
      />
    );
  }

  // Match entries to actual vehicle data from Zustand store
  const resolvedEntries = [...col.entries]
    .sort((a, b) => a.position - b.position)
    .map((entry) => ({
      ...entry,
      vehicle: vehicles.find((v) => v.id === entry.vehicleId),
    }))
    .filter((e) => e.vehicle) as ((typeof col.entries)[0] & { vehicle: Vehicle })[];

  return (
    <m.div {...fade} transition={TRANSITION.base}>
      {/* ══════════════ HERO COVER ══════════════ */}
      <div className="relative h-[50svh] w-full overflow-hidden bg-black md:h-[60svh]">
        <SmartImage src={col.coverImage} alt={col.title} tone="dark" priority />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

        <button
          type="button"
          onClick={goBack}
          className="absolute left-4 top-4 z-10 flex size-11 items-center justify-center border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-black/60 md:left-8 md:top-8"
          aria-label="Geri dön"
        >
          <ArrowLeft className="size-5" strokeWidth={1.5} aria-hidden />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-7xl px-4 pb-10 md:px-8 lg:px-12">
          <p className="stat-label text-white/60">
            Koleksiyon · <span className="tabular-nums">{resolvedEntries.length}</span> Araç
          </p>
          <h1 className="mt-3 text-display-lg font-normal text-white">{col.title}</h1>
          {col.subtitle && <p className="mt-3 max-w-xl text-base text-white/75">{col.subtitle}</p>}
        </div>
      </div>

      <PageContainer width="narrow">
        {/* ══════════════ CURATOR NOTE ══════════════ */}
        <div className="mb-16 border-l border-border-strong pl-6 md:mb-20 md:pl-10">
          <p className="eyebrow mb-4">Küratör Notu</p>
          <p className="text-display-sm font-normal leading-snug text-foreground">{col.curatorNote}</p>
        </div>

        {/* ══════════════ VEHICLE ENTRIES ══════════════ */}
        {resolvedEntries.map((entry, index) => {
          const v = entry.vehicle;
          return (
            <m.article
              key={entry.vehicleId}
              data-vt-root
              {...fadeUp}
              whileInView={fadeUp.animate}
              animate={undefined}
              viewport={{ once: true, margin: '-60px' }}
              transition={TRANSITION.slow}
            >
              <div className="mb-6 flex items-center gap-4">
                <span className="font-display text-4xl font-normal tabular-nums text-foreground/15 md:text-5xl">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="h-px flex-1 bg-border-subtle" />
              </div>

              <div data-vt="media" className="mb-6">
                <SmartImage src={v.media.heroImage} alt={vehicleName(v)} aspectRatio="16 / 9" colorHex={v.media.colorHex} />
              </div>

              <p className="eyebrow">
                <span lang="en">{vehicleBrand(v)}</span> · <span className="tabular-nums">{v.year}</span>
              </p>
              <h2 className="mt-2 text-display-md font-normal text-foreground">
                <span data-vt="title">{vehicleModel(v)}</span>
              </h2>
              {v.tagline && <p className="mt-3 text-lg text-secondary">{v.tagline}</p>}

              <dl className="my-6 grid grid-cols-3 border-y border-border-subtle py-4">
                <div>
                  <dt className="stat-label">Güç</dt>
                  <dd className="stat-value mt-1 text-xl">
                    {trustedSpec(v, 'powerHp') ?? '—'} <span className="text-sm text-muted">HP</span>
                  </dd>
                </div>
                <div className="border-l border-border-subtle pl-4">
                  <dt className="stat-label">0–100</dt>
                  <dd className="stat-value mt-1 text-xl">
                    {trustedSpec(v, 'zeroTo100Kmh')?.toLocaleString('tr-TR') ?? '—'} <span className="text-sm text-muted">sn</span>
                  </dd>
                </div>
                <div className="border-l border-border-subtle pl-4">
                  <dt className="stat-label">Fiyat</dt>
                  <dd className="stat-value mt-1 truncate text-xl">{formatVehiclePrice(v.pricing)}</dd>
                </div>
              </dl>

              {entry.editorialNote && (
                <blockquote className="mb-8 border-l border-border-strong py-1 pl-6 md:pl-8">
                  <p className="text-xl font-light italic leading-relaxed text-secondary md:text-2xl">“{entry.editorialNote}”</p>
                </blockquote>
              )}

              <VehicleLink
                vehicle={v}
                className="group inline-flex min-h-10 items-center gap-3 text-xs font-semibold uppercase tracking-eyebrow text-foreground"
              >
                İncele
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} aria-hidden />
              </VehicleLink>

              {index < resolvedEntries.length - 1 && (
                <div className="my-14 flex justify-center md:my-20" aria-hidden>
                  <div className="flex items-center gap-3">
                    <div className="h-px w-6 bg-border-subtle" />
                    <div className="size-1.5 rotate-45 border border-border-strong" />
                    <div className="h-px w-6 bg-border-subtle" />
                  </div>
                </div>
              )}
            </m.article>
          );
        })}

        {/* ══════════════ CLOSING NOTE ══════════════ */}
        {col.closingNote && (
          <div className="mt-20 border-t border-border-subtle pt-12 text-center">
            <p className="eyebrow mb-4">Kapanış</p>
            <p className="text-display-sm font-normal leading-snug text-foreground">{col.closingNote}</p>
          </div>
        )}
      </PageContainer>
    </m.div>
  );
}
