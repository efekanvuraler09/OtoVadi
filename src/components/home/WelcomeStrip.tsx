import { useMemo, useState } from 'react';
import { m } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../i18n/useI18n';
import { useVehicleStore } from '../../store/useVehicleStore';
import { resolveRecentVehicles, useRecentStore } from '../../store/useRecentStore';
import { PageContainer } from '../layout/PageContainer';
import { SmartImage } from '../ui/SmartImage';
import { VehicleLink } from '../vehicle/VehicleLink';
import { vehicleBrand, vehicleModel, vehicleName } from '../../utils/vehicleText';
import { TRANSITION, fadeUp, staggerDelay } from '../../lib/motion';

type GreetingKey = 'greetingMorning' | 'greetingDay' | 'greetingEvening';

/** 05–11 günaydın, 12–17 iyi günler, diğer saatler iyi akşamlar */
function greetingFor(hour: number): GreetingKey {
  if (hour >= 5 && hour < 12) return 'greetingMorning';
  if (hour >= 12 && hour < 18) return 'greetingDay';
  return 'greetingEvening';
}

/**
 * 1.3 — Kişisel karşılama ve "Kaldığınız Yerden". Hero'nun hemen altında ince bir şerit: günün saatine göre serif
 * selamlama (+ giriş yaptıysa ilk ad) ve son incelenen en fazla 3 aracın küçük görselli kısayolu.
 * Yalnızca en az bir son incelenen araç varsa veya ziyaretçi giriş yaptıysa görünür. Satış dili, rozet ve öneri yok.
 */
export function WelcomeStrip() {
  const { t } = useI18n();
  const { user, isLoading: isAuthLoading } = useAuth();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const isVehiclesLoading = useVehicleStore((s) => s.isLoading);
  const recentIds = useRecentStore((s) => s.ids);
  // Saat sayfa açılışında bir kez okunur (render saf kalır)
  const [greetingKey] = useState(() => greetingFor(new Date().getHours()));

  const recent = useMemo(() => resolveRecentVehicles(recentIds, vehicles), [recentIds, vehicles]);
  const firstName = user?.displayName?.trim().split(/\s+/)[0];

  // Katalog/oturum gelmeden karar verilmez (şerit bir an görünüp kaybolmasın)
  if (isAuthLoading || (recentIds.length > 0 && isVehiclesLoading)) return null;
  if (recent.length === 0 && !user) return null;

  const greeting = `${t.home[greetingKey]}${firstName ? `, ${firstName}` : ''}.`;

  return (
    <section aria-label={t.home.welcomeEyebrow} className="border-b border-border-subtle">
      <PageContainer spacing="none" className="py-8 md:py-10">
        <m.div
          {...fadeUp}
          transition={TRANSITION.slow}
          className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12"
        >
          <div className="min-w-0 shrink-0">
            <p className="eyebrow mb-2">{t.home.welcomeEyebrow}</p>
            <p className="font-display text-display-sm font-normal text-foreground">{greeting}</p>
          </div>

          {recent.length > 0 ? (
            <div className="min-w-0 flex-1 lg:max-w-3xl">
              <p className="stat-label mb-3 lg:sr-only">{t.home.welcomeRecent}</p>
              <ul className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 scrollbar-none md:mx-0 md:grid md:grid-cols-3 md:px-0">
                {recent.map((vehicle, index) => (
                  <m.li
                    key={vehicle.id}
                    data-vt-root
                    {...fadeUp}
                    transition={{ ...TRANSITION.base, delay: 0.1 + staggerDelay(index) }}
                    className="w-[70%] shrink-0 snap-start sm:w-[45%] md:w-auto"
                  >
                    <VehicleLink
                      vehicle={vehicle}
                      className="group flex items-center gap-3 border border-border-subtle p-2 pr-4 transition-colors hover:border-border-strong"
                    >
                      <div data-vt="media" className="w-20 shrink-0">
                        <SmartImage
                          src={vehicle.media?.thumbnail || vehicle.media?.heroImage}
                          alt={vehicleName(vehicle)}
                          aspectRatio="16 / 10"
                          colorHex={vehicle.media?.colorHex}
                        />
                      </div>
                      <span className="min-w-0">
                        <span className="eyebrow block truncate" lang="en">
                          {vehicleBrand(vehicle)}
                        </span>
                        <span className="mt-0.5 block truncate font-display text-base text-foreground">
                          <span data-vt="title">{vehicleModel(vehicle)}</span>
                        </span>
                      </span>
                    </VehicleLink>
                  </m.li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <p className="text-sm text-muted">{t.home.welcomeEmpty}</p>
              <Link
                to="/garajim"
                className="group inline-flex min-h-10 shrink-0 items-center gap-2 text-xs font-medium uppercase tracking-eyebrow text-foreground"
              >
                {t.home.welcomeGarage}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} aria-hidden />
              </Link>
            </div>
          )}
        </m.div>
      </PageContainer>
    </section>
  );
}
