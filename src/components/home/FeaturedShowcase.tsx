import { useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useI18n } from '../../i18n/useI18n';
import { PageContainer } from '../layout/PageContainer';
import { SectionHeader } from '../layout/PageHeader';
import { VehicleCard, VehicleCardSkeleton } from '../vehicle/VehicleCard';

const FALLBACK_COUNT = 8;
const itemClass = 'w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[calc((100%-2rem)/3)]';
const arrowClass =
  'flex size-10 items-center justify-center rounded-full border border-border-subtle text-foreground transition-colors hover:border-foreground disabled:pointer-events-none disabled:opacity-30';

/**
 * Ana sayfa vitrini (U1): hero'nun hemen altında öne çıkan araçlar. Mobilde parmakla kaydırılan, kenardan taşan şerit;
 * masaüstünde ok butonlu yatay şerit. Admin'de "öne çıkan" işaretli araç yoksa katalogdaki ilk araçlar gösterilir.
 */
export function FeaturedShowcase() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const featuredVehicles = useVehicleStore((s) => s.featuredVehicles);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  const scrollerRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const items = featuredVehicles.length > 0 ? featuredVehicles : vehicles.slice(0, FALLBACK_COUNT);

  if (!isLoading && items.length === 0) return null;

  const updateEdges = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  const scrollByPage = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  return (
    <section aria-labelledby="featured-title">
      <PageContainer spacing="section">
        <SectionHeader
          id="featured-title"
          eyebrow={t.home.featuredEyebrow}
          title={t.home.featuredTitle}
          description={t.home.featuredSubtitle}
          actions={
            <>
              <div className="hidden gap-2 md:flex">
                <button type="button" onClick={() => scrollByPage(-1)} disabled={edges.start} className={arrowClass} aria-label={t.home.prev}>
                  <ChevronLeft className="size-4" strokeWidth={1.5} aria-hidden />
                </button>
                <button type="button" onClick={() => scrollByPage(1)} disabled={edges.end} className={arrowClass} aria-label={t.home.next}>
                  <ChevronRight className="size-4" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
              <Link
                to="/modeller"
                className="group inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-eyebrow text-foreground"
              >
                {t.home.viewAll}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden />
              </Link>
            </>
          }
        />

        {/* Mobil/tablette kenara kadar taşar (bir sonraki kartın ucu görünür); lg'de kap içinde kalır */}
        <ul
          ref={scrollerRef}
          onScroll={updateEdges}
          className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 scrollbar-none md:-mx-8 md:scroll-px-8 md:px-8 lg:mx-0 lg:scroll-px-0 lg:px-0"
        >
          {items.length === 0
            ? Array.from({ length: 4 }, (_, i) => (
                <li key={i} className={itemClass}>
                  <VehicleCardSkeleton variant="featured" />
                </li>
              ))
            : items.map((vehicle, index) => (
                <li key={vehicle.id} className={itemClass}>
                  <VehicleCard vehicle={vehicle} variant="featured" index={index} priority={index < 2} />
                </li>
              ))}
        </ul>
      </PageContainer>
    </section>
  );
}
