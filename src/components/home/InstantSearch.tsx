import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowRight, Search, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { filterVehicles, useVehicleStore } from '../../store/useVehicleStore';
import { useI18n } from '../../i18n/useI18n';
import { formatVehiclePrice } from '../../utils/formatPrice';
import { cleanText, vehicleName } from '../../utils/vehicleText';
import { SmartImage } from '../ui/SmartImage';
import { TRANSITION } from '../../lib/motion';

const MAX_RESULTS = 6;

interface InstantSearchProps {
  /** "Tüm sonuçları gör" / Enter: sorguyu katalog sonuç listesine uygular */
  onShowAll: (query: string) => void;
}

/**
 * Ana sayfa araması: yazarken küçük görsel + fiyatlı anlık sonuçlar (combobox).
 * Ok tuşları ile gezinilir, Enter seçili aracı açar (seçim yoksa tüm sonuçları listeler), Escape kapatır.
 */
export function InstantSearch({ onShowAll }: InstantSearchProps) {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const storeQuery = useVehicleStore((s) => s.searchQuery);
  const { t } = useI18n();
  const navigate = useNavigate();
  const listId = useId();

  const [query, setQuery] = useState(storeQuery);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const results = useMemo(() => (trimmed ? filterVehicles(vehicles, trimmed, null, null) : []), [vehicles, trimmed]);
  const visible = results.slice(0, MAX_RESULTS);
  const showPanel = open && trimmed.length > 0;
  // Son seçenek: "Tüm sonuçları gör"
  const optionCount = visible.length + (results.length > 0 ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const showAll = () => {
    if (!trimmed) return;
    setOpen(false);
    onShowAll(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' && optionCount > 0) {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => (i + 1) % optionCount);
    } else if (e.key === 'ArrowUp' && optionCount > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? optionCount - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const vehicle = activeIndex >= 0 ? visible[activeIndex] : undefined;
      if (vehicle) {
        navigate(`/arac/${vehicle.id}`);
      } else {
        showAll();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <div ref={rootRef} className="relative">
      <div className="flex min-h-14 items-center gap-4 border border-border-subtle bg-void px-5 transition-colors focus-within:border-foreground hover:border-border-strong">
        <Search className="size-5 shrink-0 text-muted" strokeWidth={1.5} aria-hidden />
        <input
          type="search"
          role="combobox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={t.catalog.searchPlaceholder}
          aria-label={t.catalog.searchPlaceholder}
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showPanel && activeIndex >= 0 ? optionId(activeIndex) : undefined}
          autoComplete="off"
          className="w-full bg-transparent text-base text-foreground outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setActiveIndex(-1);
            }}
            className="flex size-8 shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground"
            aria-label={t.home.clearSearch}
          >
            <X className="size-4" strokeWidth={1.5} aria-hidden />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showPanel && (
          <m.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={TRANSITION.fast}
            className="absolute inset-x-0 top-full z-30 mt-2 border border-border-subtle bg-void shadow-2xl"
          >
            {visible.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">{t.home.searchEmpty.replace('{query}', trimmed)}</p>
            ) : (
              <ul id={listId} role="listbox" aria-label={t.catalog.searchPlaceholder} className="max-h-[60svh] overflow-y-auto py-1">
                {visible.map((vehicle, i) => {
                  const active = i === activeIndex;
                  return (
                    <li key={vehicle.id} id={optionId(i)} role="option" aria-selected={active}>
                      <Link
                        to={`/arac/${vehicle.id}`}
                        tabIndex={-1}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`flex items-center gap-4 px-3 py-2.5 transition-colors sm:px-4 ${active ? 'bg-surface-elevated' : 'hover:bg-surface'}`}
                      >
                        <div className="relative w-20 shrink-0 sm:w-24">
                          <SmartImage
                            src={vehicle.media?.thumbnail || vehicle.media?.heroImage}
                            alt=""
                            aspectRatio="16 / 10"
                            colorHex={vehicle.media?.colorHex}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{vehicleName(vehicle)}</p>
                          <p className="truncate text-xs text-muted">
                            <span className="tabular-nums">{vehicle.year}</span>
                            {cleanText(vehicle.pricing?.trim) && ` · ${cleanText(vehicle.pricing.trim)}`}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-medium tabular-nums text-foreground">{formatVehiclePrice(vehicle.pricing)}</p>
                      </Link>
                    </li>
                  );
                })}
                <li id={optionId(visible.length)} role="option" aria-selected={activeIndex === visible.length}>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={showAll}
                    onMouseEnter={() => setActiveIndex(visible.length)}
                    className={`flex w-full items-center justify-between gap-3 border-t border-border-subtle px-4 py-3 text-left text-xs font-semibold uppercase tracking-eyebrow text-foreground transition-colors ${
                      activeIndex === visible.length ? 'bg-surface-elevated' : 'hover:bg-surface'
                    }`}
                  >
                    {t.home.searchAll.replace('{count}', String(results.length))}
                    <ArrowRight className="size-4" strokeWidth={1.5} aria-hidden />
                  </button>
                </li>
              </ul>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
