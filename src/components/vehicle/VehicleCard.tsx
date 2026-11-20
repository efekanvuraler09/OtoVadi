import { useRef } from 'react';
import { m } from 'framer-motion';
import { ArrowRight, Bookmark, Check, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Vehicle } from '../../types/vehicle';
import { SmartImage } from '../ui/SmartImage';
import { formatVehiclePrice } from '../../utils/formatPrice';
import { cleanText, vehicleBrand, vehicleModel, vehicleName } from '../../utils/vehicleText';
import { useGarageToggle } from '../../hooks/useGarageToggle';
import { useCompareToggle } from '../../hooks/useCompareToggle';
import { useI18n } from '../../i18n/useI18n';
import { TRANSITION, fadeUp, staggerDelay } from '../../lib/motion';
import { trustedDrivetrain, trustedFuel, trustedSpec } from '../../lib/specTrust';
import { useVehicleTransitionLink } from '../../hooks/useVehicleTransitionLink';

interface VehicleCardProps {
  vehicle: Vehicle;
  /**
   * grid     → katalog ızgarası (Modeller, ana sayfa sonuçları, Garajım): çerçevesiz, sade
   * featured → ana sayfa vitrini: yüzeyli kart, daha büyük başlık
   */
  variant?: 'grid' | 'featured';
  /** Liste içindeki sıra (stagger yalnızca ilk 6 öğeye uygulanır) */
  index?: number;
  /** İlk ekranda görünen kartlarda görseli öncelikli yükler */
  priority?: boolean;
}

const actionButtonClass =
  'relative z-10 flex size-10 items-center justify-center rounded-full border border-border-subtle/70 bg-void/80 text-foreground backdrop-blur-sm transition-colors hover:bg-void disabled:cursor-not-allowed disabled:opacity-50';

/** Karşılaştırma tepsisindeki aracın düğmesi dolu görünür */
const actionButtonActiveClass =
  'relative z-10 flex size-10 items-center justify-center rounded-full border border-foreground bg-foreground text-void transition-colors hover:bg-foreground/90';

/**
 * Tek tip araç kartı (U6). Kartın tamamı tıklanabilir ama tek bir gerçek <Link> vardır (başlık; ::after ile kartı kaplar):
 * klavye, orta tık ve "yeni sekmede aç" doğal olarak çalışır. Garaj/karşılaştır aksiyonları linkin üstünde (z-10) durur.
 * 3'lü teknik veri satırı hover'a bağlı değildir; dokunmatik ekranda da her zaman görünür.
 * Faz 6: tıklamada görsel ve başlık View Transition ile detay hero'suna yerleşir (data-vt); hover/focus'ta detay parçası
 * ve hero görseli önceden iner. Doğrulanmamış (şablon) teknik değerler "—" görünür.
 */
export function VehicleCard({ vehicle, variant = 'grid', index = 0, priority = false }: VehicleCardProps) {
  const { t, locale } = useI18n();
  const copy = t.vehicleCard;
  const { isGaraged, isBusy, toggle } = useGarageToggle(vehicle);
  const compare = useCompareToggle(vehicle);
  const articleRef = useRef<HTMLElement>(null);
  const link = useVehicleTransitionLink(vehicle);

  const featured = variant === 'featured';
  const name = vehicleName(vehicle);
  const trim = cleanText(vehicle.pricing?.trim);
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const fuelType = trustedFuel(vehicle);
  const drivetrain = trustedDrivetrain(vehicle);
  const fuel = fuelType ? (copy.fuel[fuelType as keyof typeof copy.fuel] ?? fuelType) : '—';
  const drive = drivetrain ? (copy.drive[drivetrain as keyof typeof copy.drive] ?? drivetrain) : '';
  const power = trustedSpec(vehicle, 'powerHp');
  const accel = trustedSpec(vehicle, 'zeroTo100Kmh');

  const specs = [
    { label: copy.power, value: power === null ? '—' : number.format(power), unit: power === null ? undefined : 'HP' },
    { label: copy.acceleration, value: accel === null ? '—' : number.format(accel), unit: accel === null ? undefined : copy.seconds },
    // Dar kartta taşmasın: çekiş yalnızca dört çeker araçlarda yakıtın yanına eklenir
    { label: copy.fuelLabel, value: drivetrain && ['awd', '4wd'].includes(drivetrain) && fuelType ? `${fuel} · ${drive}` : fuel },
  ];

  return (
    <m.article
      ref={articleRef}
      onPointerEnter={link.prefetch}
      onFocus={link.prefetch}
      onTouchStart={link.prefetch}
      {...fadeUp}
      transition={{ ...TRANSITION.base, delay: staggerDelay(index) }}
      className={`group relative flex h-full flex-col ${
        featured ? 'border border-border-subtle bg-surface transition-colors hover:border-border-strong' : ''
      }`}
    >
      <div className="relative">
        {/* View Transition kaynağı: tıklamada detay hero'suna dönüşür */}
        <div data-vt="media">
          <SmartImage
            src={vehicle.media?.thumbnail || vehicle.media?.heroImage}
            alt={name}
            aspectRatio="16 / 10"
            colorHex={vehicle.media?.colorHex}
            priority={priority}
            imgClassName="group-hover:scale-[1.03]"
          />
        </div>

        <div className="absolute right-3 top-3 z-10 flex gap-2">
          {/* U7: sayfadan çıkarmaz; aracı global karşılaştırma tepsisine ekler/çıkarır */}
          <button
            type="button"
            onClick={compare.toggle}
            className={compare.isSelected ? actionButtonActiveClass : actionButtonClass}
            aria-pressed={compare.isSelected}
            aria-label={`${compare.isSelected ? copy.removeFromCompare : copy.addToCompare}: ${name}`}
            title={compare.isSelected ? copy.removeFromCompare : copy.addToCompare}
          >
            {compare.isSelected ? (
              <Check className="size-4" strokeWidth={1.75} />
            ) : (
              <Scale className="size-4" strokeWidth={1.5} />
            )}
          </button>
          <button
            type="button"
            onClick={toggle}
            disabled={isBusy}
            className={actionButtonClass}
            aria-pressed={isGaraged}
            aria-label={`${isGaraged ? copy.removeFromGarage : copy.addToGarage}: ${name}`}
            title={isGaraged ? copy.removeFromGarage : copy.addToGarage}
          >
            {isBusy ? (
              <span className="size-4 animate-spin rounded-full border-[1.5px] border-muted border-t-foreground" />
            ) : (
              <Bookmark className={`size-4 ${isGaraged ? 'fill-current' : ''}`} strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${featured ? 'p-5 md:p-6' : 'pt-5'}`}>
        {/* lang="en": marka adı özel isim; Türkçe büyük harf kuralı "AUDİ" üretmesin */}
        <p className="eyebrow truncate">
          <span lang="en">{vehicleBrand(vehicle)}</span> · <span className="tabular-nums">{vehicle.year}</span>
        </p>
        <h3 className={`mt-2 font-display font-normal text-foreground ${featured ? 'text-2xl' : 'text-xl md:text-2xl'}`}>
          <Link
            to={link.to}
            onClick={(event) => link.onClick(event, articleRef.current)}
            className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-foreground"
          >
            <span data-vt="title">{vehicleModel(vehicle)}</span>
          </Link>
        </h3>
        {trim && <p className="mt-1 truncate text-sm text-muted">{trim}</p>}

        <dl className="mt-5 grid grid-cols-3 border-y border-border-subtle py-3">
          {specs.map((spec, i) => (
            <div key={spec.label} className={`min-w-0 ${i > 0 ? 'border-l border-border-subtle pl-3' : 'pr-3'}`}>
              <dt className="stat-label truncate">{spec.label}</dt>
              <dd className="mt-1 truncate text-sm font-medium tabular-nums text-foreground">
                {spec.value}
                {spec.unit && <span className="ml-1 text-xs font-normal text-muted">{spec.unit}</span>}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex items-end justify-between gap-4 pt-4">
          <div className="min-w-0">
            <p className="stat-label">{copy.from}</p>
            <p className="mt-1 truncate text-lg font-medium tabular-nums text-foreground">{formatVehiclePrice(vehicle.pricing)}</p>
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium uppercase tracking-eyebrow text-muted transition-colors group-hover:text-foreground"
            aria-hidden
          >
            {copy.inspect}
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
          </span>
        </div>
      </div>
    </m.article>
  );
}

/** Kart yerleşimini koruyan yükleme iskeleti (katalog yüklenirken) */
export function VehicleCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'featured' }) {
  const featured = variant === 'featured';
  return (
    <div className={`flex h-full flex-col ${featured ? 'border border-border-subtle bg-surface' : ''}`} aria-hidden>
      <div className="shimmer w-full" style={{ aspectRatio: '16 / 10' }} />
      <div className={`flex flex-col gap-3 ${featured ? 'p-5 md:p-6' : 'pt-5'}`}>
        <div className="shimmer h-3 w-24" />
        <div className="shimmer h-6 w-2/3" />
        <div className="shimmer mt-3 h-12 w-full" />
        <div className="shimmer mt-1 h-6 w-1/3" />
      </div>
    </div>
  );
}
