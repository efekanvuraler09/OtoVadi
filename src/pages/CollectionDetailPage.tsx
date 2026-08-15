import { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, ArrowRight } from 'lucide-react';
import { subscribeCollectionBySlug } from '../services/collectionService';
import { useVehicleStore } from '../store/useVehicleStore';
import { formatPrice } from '../utils/formatPrice';
import type { VehicleCollection } from '../types/collection';
import type { Vehicle } from '../types/vehicle';

export function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [col, setCol] = useState<VehicleCollection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const vehicles = useVehicleStore((s) => s.vehicles);

  useEffect(() => {
    if (!slug) return;
    const unsub = subscribeCollectionBySlug(slug, (data) => {
      if (!data) {
        setNotFound(true);
      } else {
        setCol(data);
      }
      setIsLoading(false);
    });
    return () => unsub();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-void">
        <Loader2 className="size-8 animate-spin text-muted" />
      </div>
    );
  }

  if (notFound || !col) {
    return <Navigate to="/koleksiyonlar" replace />;
  }

  // Match entries to actual vehicle data from Zustand store
  const resolvedEntries = col.entries
    .sort((a, b) => a.position - b.position)
    .map((entry) => ({
      ...entry,
      vehicle: vehicles.find((v) => v.id === entry.vehicleId),
    }))
    .filter((e) => e.vehicle) as (typeof col.entries[0] & { vehicle: Vehicle })[];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-void"
    >
      {/* ══════════════ HERO COVER ══════════════ */}
      <div className="relative h-[50vh] w-full overflow-hidden md:h-[60vh]">
        <img
          src={col.coverImage}
          alt={col.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Back Button */}
        <Link
          to="/koleksiyonlar"
          className="absolute left-4 top-4 z-10 flex size-11 items-center justify-center border border-white/10 bg-black/40 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-black/60 md:left-8 md:top-8"
          aria-label="Koleksiyonlara dön"
        >
          <ArrowLeft className="size-5 text-white/70" />
        </Link>

        {/* Title Block */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-10 md:px-12 lg:px-24">
          <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-white/35">
            Koleksiyon · {resolvedEntries.length} Araç
          </p>
          <h1 className="mt-2 font-display text-4xl font-light tracking-wide text-white/95 md:text-5xl lg:text-6xl">
            {col.title}
          </h1>
          <p className="mt-2 max-w-xl font-sans text-base font-light text-white/50">
            {col.subtitle}
          </p>
        </div>
      </div>

      {/* ══════════════ CURATOR NOTE ══════════════ */}
      <div className="mx-auto max-w-3xl px-6 py-16 md:px-12 md:py-20">
        <div className="border-l border-foreground/15 pl-6 md:pl-10">
          <span className="font-display text-[10px] md:text-[11px] tracking-[0.5em] font-light text-muted uppercase mb-6 block">
            Küratör Notu
          </span>
          <p className="font-display text-2xl md:text-3xl lg:text-4xl leading-[1.6] text-foreground/90">
            {col.curatorNote}
          </p>
        </div>
      </div>

      {/* ══════════════ VEHICLE ENTRIES ══════════════ */}
      <div className="mx-auto max-w-5xl px-6 pb-20 md:px-12 lg:px-16">
        {resolvedEntries.map((entry, index) => {
          const v = entry.vehicle;
          const heroSrc =
            v.media.heroImage?.startsWith('http') || v.media.heroImage?.startsWith('/')
              ? v.media.heroImage
              : `/${v.media.heroImage}`;

          return (
            <motion.div
              key={entry.vehicleId}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            >
              {/* Entry Number */}
              <div className="mb-6 flex items-center gap-4">
                <span className="font-display text-5xl font-light text-foreground/10 md:text-6xl">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="h-[1px] flex-1 bg-border-subtle" />
              </div>

              {/* Vehicle Image */}
              <div className="relative mb-6 overflow-hidden">
                <img
                  src={heroSrc}
                  alt={`${v.brand} ${v.model}`}
                  className="h-56 w-full object-cover md:h-72 lg:h-80"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              {/* Vehicle Info */}
              <div className="mb-4">
                <p className="font-display text-[10px] md:text-[11px] tracking-[0.5em] font-light text-muted uppercase">
                  {v.brand} · {v.year}
                </p>
                <h2 className="mt-2 font-display text-4xl font-light tracking-wide text-foreground md:text-5xl">
                  {v.model}
                </h2>
                <p className="mt-3 font-display text-lg md:text-xl font-light text-muted">
                  {v.tagline}
                </p>
              </div>

              {/* Quick Specs */}
              <div className="mb-8 flex flex-wrap gap-8 border-y border-foreground/5 py-4 mt-6">
                <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-widest text-muted">
                  <span className="font-display text-foreground/90 font-light text-xl mr-2">{v.engine.powerHp}</span> HP
                </span>
                <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-widest text-muted">
                  <span className="font-display text-foreground/90 font-light text-xl mr-2">{v.performance.zeroTo100Kmh}s</span> 0-100
                </span>
                <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-widest text-muted">
                  <span className="font-display text-foreground/90 font-light text-xl">{formatPrice(v.pricing.msrp)}</span>
                </span>
              </div>

              {/* Editorial Note */}
              {entry.editorialNote && (
                <div className="mb-8 border-l border-border-subtle pl-6 md:pl-8 py-2">
                  <p className="font-display text-xl md:text-2xl leading-[1.6] text-foreground/80 italic">
                    "{entry.editorialNote}"
                  </p>
                </div>
              )}

              {/* CTA */}
              <Link
                to={`/arac/${v.id}`}
                className="group inline-flex items-center gap-3 font-sans text-[10px] md:text-[11px] uppercase tracking-[0.4em] font-medium text-muted transition-colors duration-300 hover:text-foreground"
              >
                <span>İncele</span>
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
              </Link>

              {/* Spacer between entries */}
              {index < resolvedEntries.length - 1 && (
                <div className="my-14 flex justify-center md:my-20">
                  <div className="flex items-center gap-3">
                    <div className="h-[1px] w-6 bg-border-subtle" />
                    <div className="size-1.5 rotate-45 border border-border-subtle" />
                    <div className="h-[1px] w-6 bg-border-subtle" />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ══════════════ CLOSING NOTE ══════════════ */}
      {col.closingNote && (
        <div className="mx-auto max-w-3xl px-6 pb-20 md:px-12">
          <div className="border-t border-border-subtle pt-12 text-center">
            <span className="font-display text-[10px] md:text-[11px] tracking-[0.5em] font-light text-muted uppercase mb-6 block">
              Kapanış
            </span>
            <p className="font-display text-2xl md:text-3xl lg:text-4xl leading-[1.6] text-foreground/90">
              {col.closingNote}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
