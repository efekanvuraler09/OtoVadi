import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Library } from 'lucide-react';
import { subscribePublishedCollections } from '../services/collectionService';
import type { VehicleCollection } from '../types/collection';

export function CollectionsPage() {
  const [collections, setCollections] = useState<VehicleCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribePublishedCollections((cols) => {
      setCollections(cols);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-void">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted" />
          <p className="font-sans text-xs uppercase tracking-widest text-muted">
            Koleksiyonlar Yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="min-h-[60vh] bg-void"
    >
      {/* ── Header ── */}
      <div className="mx-auto max-w-7xl px-6 pb-6 pt-20 md:px-12 lg:px-24">
        <span className="font-display text-[10px] md:text-[11px] tracking-[0.5em] font-light text-muted uppercase mb-4 block">
          Küratörlü Sergiler
        </span>
        <h1 className="font-display text-5xl md:text-7xl font-normal text-foreground tracking-tight">
          Koleksiyonlar
        </h1>
        <p className="mt-6 text-lg md:text-xl font-light text-muted max-w-2xl leading-relaxed">
          Her araç bir hikâye anlatır. Bazı hikâyeler birlikte daha güçlüdür.
        </p>
      </div>

      {/* ── Collection Grid ── */}
      <div className="mx-auto max-w-7xl px-6 pb-20 md:px-12 lg:px-24">
        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Library className="size-10 text-muted/40" strokeWidth={1} />
            <p className="font-sans text-sm text-muted">
              Henüz yayınlanmış koleksiyon bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {collections.map((col, index) => (
              <motion.div
                key={col.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
              >
                <Link
                  to={`/koleksiyonlar/${col.slug}`}
                  className="group relative block overflow-hidden border border-border-subtle bg-surface/5 transition-all duration-500 hover:border-foreground/20 hover:bg-surface/10"
                >
                  {/* Cover Image */}
                  <div className="relative h-64 overflow-hidden md:h-72">
                    <img
                      src={col.coverImage}
                      alt={col.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>

                  {/* Info */}
                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                    <p className="font-sans text-[10px] uppercase tracking-[0.3em] text-white/40">
                      {col.entries.length} araç
                    </p>
                    <h2 className="mt-1.5 font-display text-2xl font-light tracking-wide text-white/90 md:text-3xl">
                      {col.title}
                    </h2>
                    <p className="mt-1.5 font-sans text-sm font-light text-white/45 line-clamp-2">
                      {col.subtitle}
                    </p>
                  </div>

                  {/* Bottom accent line on hover */}
                  <div className="absolute bottom-0 left-0 h-[1px] w-0 bg-white/30 transition-all duration-500 group-hover:w-full" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
