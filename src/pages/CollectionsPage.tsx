import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Library } from 'lucide-react';
import { subscribePublishedCollections } from '../services/collectionService';
import { LoadErrorState, LoadingState } from '../components/ui/DataState';
import { PageContainer } from '../components/layout/PageContainer';
import { PageHeader } from '../components/layout/PageHeader';
import { SmartImage } from '../components/ui/SmartImage';
import { TRANSITION, fade, fadeUp, staggerDelay } from '../lib/motion';
import type { VehicleCollection } from '../types/collection';

export function CollectionsPage() {
  const [collections, setCollections] = useState<VehicleCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const unsub = subscribePublishedCollections(
      (cols) => {
        setCollections(cols);
        setLoadFailed(false);
        setIsLoading(false);
      },
      () => {
        setLoadFailed(true);
        setIsLoading(false);
      },
    );
    return () => unsub();
  }, [attempt]);

  if (isLoading) {
    return <LoadingState label="Koleksiyonlar Yükleniyor..." />;
  }

  if (loadFailed && collections.length === 0) {
    return (
      <LoadErrorState
        title="Koleksiyonlar yüklenemedi"
        onRetry={() => {
          setIsLoading(true);
          setAttempt((n) => n + 1);
        }}
      />
    );
  }

  return (
    <motion.div {...fade} transition={TRANSITION.base}>
      <PageContainer>
        <PageHeader
          eyebrow="Küratörlü Sergiler"
          title="Koleksiyonlar"
          description="Her araç bir hikâye anlatır. Bazı hikâyeler birlikte daha güçlüdür."
        />

        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <Library className="size-10 text-muted" strokeWidth={1} aria-hidden />
            <p className="text-sm text-muted">Henüz yayınlanmış koleksiyon bulunmuyor.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {collections.map((col, index) => (
              <motion.div key={col.id} {...fadeUp} transition={{ ...TRANSITION.base, delay: staggerDelay(index) }}>
                <Link to={`/koleksiyonlar/${col.slug}`} className="group relative block overflow-hidden border border-border-subtle">
                  {/* Kapak: sabit oran, kırık görselde stüdyo zemini; üzerindeki metin her temada koyu scrim üstünde */}
                  <SmartImage
                    src={col.coverImage}
                    alt={col.title}
                    aspectRatio="16 / 10"
                    tone="dark"
                    priority={index < 2}
                    imgClassName="duration-550 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                    <p className="stat-label text-white/60">
                      <span className="tabular-nums">{col.entries.length}</span> araç
                    </p>
                    <h2 className="mt-2 text-display-sm font-normal text-white">{col.title}</h2>
                    {col.subtitle && <p className="mt-2 line-clamp-2 text-sm text-white/70">{col.subtitle}</p>}
                  </div>

                  <div className="absolute bottom-0 left-0 h-px w-0 bg-white/50 transition-all duration-550 group-hover:w-full" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </PageContainer>
    </motion.div>
  );
}
