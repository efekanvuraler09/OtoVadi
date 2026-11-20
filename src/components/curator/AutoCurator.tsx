import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useVehicleStore } from '../../store/useVehicleStore';
import type { Vehicle } from '../../types/vehicle';
import { useI18n, type Locale, type Translations } from '../../i18n/useI18n';
import { DISCOVER_MAX_QUERY_LENGTH, requestDiscovery } from '../../services/discoveryService';
import { matchVehiclesLocally, type LocalMatch, type MatchCriterion } from '../../utils/localVehicleMatcher';
import { formatPrice, formatVehiclePrice } from '../../utils/formatPrice';
import { StatusScreen } from '../ui/DataState';
import { SmartImage } from '../ui/SmartImage';
import { primaryButtonClass, secondaryButtonClass } from '../ui/buttonStyles';
import { TRANSITION } from '../../lib/motion';
import { vehicleName } from '../../utils/vehicleText';

/**
 * idle     → sorgu formu
 * loading  → /api/discover bekleniyor
 * success  → yapay zeka önerisi ("Mükemmel Eşleşme")
 * degraded → API yanıt vermedi; yerel anahtar kelime puanlaması ("Hızlı Eşleştirme"), Tekrar Dene ile AI yeniden denenir
 * error    → öneri üretilemedi (ör. katalog boş/yüklenemedi)
 */
type CuratorStatus = 'idle' | 'loading' | 'success' | 'degraded' | 'error';
type CuratorCopy = Translations['smartDiscovery'];

interface CuratorResult {
  vehicle: Vehicle;
  alternatives: Vehicle[];
  reasoning: string;
  criteria: string[];
}

const LOADING_STEP_MS = 2200;
/** Karakter sayacı bu uzunluktan sonra görünür (sınır: DISCOVER_MAX_QUERY_LENGTH) */
const COUNTER_THRESHOLD = 240;

function formatList(items: string[], locale: Locale): string {
  return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(items);
}

function criterionLabel(criterion: MatchCriterion, copy: CuratorCopy): string {
  switch (criterion.kind) {
    case 'budget': {
      const template = criterion.direction === 'min' ? copy.criteria.budgetMin : copy.criteria.budgetMax;
      return template.replace('{amount}', formatPrice(criterion.amount, criterion.currency));
    }
    case 'brand':
    case 'model':
      return criterion.label;
    case 'body':
      return copy.criteria.body[criterion.value];
    case 'fuel':
      return copy.criteria.fuel[criterion.value];
    default:
      return copy.criteria[criterion.kind];
  }
}

/** Yerel eşleştirme sonucunu dürüst bir açıklamayla sonuca çevirir (AI'ın yazdığı izlenimi verilmez). */
function buildLocalResult(match: LocalMatch, copy: CuratorCopy, locale: Locale): CuratorResult {
  const name = vehicleName(match.vehicle);
  const criteria = match.criteria.map((c) => criterionLabel(c, copy));
  let reasoning = (criteria.length > 0 ? copy.quickMatchReason : copy.quickMatchNoCriteria).replace('{vehicle}', name);
  if (match.unmet.length > 0) {
    const unmet = formatList(match.unmet.map((c) => criterionLabel(c, copy)), locale);
    reasoning += ` ${copy.quickMatchUnmet.replace('{criteria}', unmet)}`;
  }
  return { vehicle: match.vehicle, alternatives: match.alternatives, reasoning, criteria };
}

function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const reduceMotion = useReducedMotion();
  const [charIndex, setCharIndex] = useState(0);

  // Metin değişince bileşen `key` ile yeniden oluşturulur; burada yalnızca harf harf ilerletilir
  useEffect(() => {
    if (reduceMotion || charIndex >= text.length) return;
    const timer = setTimeout(() => setCharIndex((prev) => prev + 1), speed);
    return () => clearTimeout(timer);
  }, [charIndex, text, speed, reduceMotion]);

  return (
    <>
      {/* Ekran okuyucular metnin tamamını tek seferde okur */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{reduceMotion ? text : text.substring(0, charIndex)}</span>
    </>
  );
}

export function AutoCurator() {
  const vehicles = useVehicleStore((s) => s.vehicles);
  const isCatalogLoading = useVehicleStore((s) => s.isLoading);
  const loadError = useVehicleStore((s) => s.loadError);
  const retryLoad = useVehicleStore((s) => s.retryLoad);
  const { t, locale } = useI18n();
  const copy = t.smartDiscovery;

  const [status, setStatus] = useState<CuratorStatus>('idle');
  const [inputValue, setInputValue] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [result, setResult] = useState<CuratorResult | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const requestRef = useRef<AbortController | null>(null);

  const isCatalogReady = vehicles.length > 0;
  const canSubmit = isCatalogReady && inputValue.trim().length > 0;
  const loadingMessages = [copy.loading1, copy.loading2, copy.loading3];

  // Sayfadan ayrılırken bekleyen isteği iptal et
  useEffect(() => {
    const pending = requestRef;
    return () => pending.current?.abort();
  }, []);

  // Yükleme mesajlarını sırayla döndür
  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setInterval(() => setLoadingStep((step) => step + 1), LOADING_STEP_MS);
    return () => clearInterval(timer);
  }, [status]);

  const runDiscovery = async (rawQuery: string) => {
    const query = rawQuery.replace(/\s+/g, ' ').trim().slice(0, DISCOVER_MAX_QUERY_LENGTH);
    if (!query) return;
    if (!isCatalogReady) {
      setStatus('error');
      return;
    }

    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const catalog = vehicles;

    setLastQuery(query);
    setLoadingStep(0);
    setStatus('loading');

    try {
      const response = await requestDiscovery(query, locale, catalog, controller.signal);
      if (controller.signal.aborted) return;

      // Sunucu slug'ı zaten doğruladı; istemci kendi kataloğunda da bulamazsa yerel eşleştirmeye düşülür
      const bySlug = new Map(catalog.map((v) => [v.slug, v] as const));
      const vehicle = bySlug.get(response.slug);
      if (!vehicle) throw new Error(`Önerilen araç katalogda yok: ${response.slug}`);

      setResult({
        vehicle,
        alternatives: response.alternatives
          .map((slug) => bySlug.get(slug))
          .filter((v): v is Vehicle => v !== undefined && v.id !== vehicle.id),
        reasoning: response.reasoning,
        criteria: response.criteria,
      });
      setStatus('success');
    } catch (error) {
      if (controller.signal.aborted) return;
      console.warn('Akıllı Keşif: yapay zeka yanıtı alınamadı, yerel eşleştirme kullanılıyor.', error);
      const match = matchVehiclesLocally(query, catalog);
      if (!match) {
        setStatus('error');
        return;
      }
      setResult(buildLocalResult(match, copy, locale));
      setStatus('degraded');
    } finally {
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (canSubmit) void runDiscovery(inputValue);
  };

  const resetCurator = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setInputValue('');
    setResult(null);
    setStatus('idle');
  };

  const handleErrorRetry = () => {
    if (isCatalogReady && lastQuery) {
      void runDiscovery(lastQuery);
      return;
    }
    // Katalog yoksa önce onu yeniden yükle; form, yükleme durumunu altında gösterir
    if (loadError) retryLoad();
    setStatus('idle');
  };

  const catalogHint = isCatalogReady ? null : isCatalogLoading ? (
    copy.catalogLoading
  ) : loadError ? (
    <>
      {copy.catalogError}{' '}
      <button type="button" onClick={retryLoad} className="underline underline-offset-4 hover:text-foreground">
        {copy.retry}
      </button>
    </>
  ) : (
    copy.catalogEmpty
  );

  return (
    <section className="relative w-full min-h-[calc(100svh-4rem)] bg-void flex items-center justify-center overflow-hidden">
      <AnimatePresence mode="wait">

        {/* 1. SORGU */}
        {status === 'idle' && (
          <motion.div
            key="prompt"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            // blur geçişi mobilde pahalıydı: yalnızca opacity + translate
            exit={{ opacity: 0, y: -24 }}
            transition={TRANSITION.slow}
            className="w-full max-w-4xl px-4 md:px-8 flex flex-col items-center"
          >
            <Sparkles className="size-8 text-muted mb-8" strokeWidth={1} />
            <h1 className="mb-12 text-balance text-center text-display-lg font-normal text-foreground">
              {copy.title}
            </h1>
            <form onSubmit={handleSearch} className="w-full relative group">
              <input
                type="text"
                autoFocus
                value={inputValue}
                maxLength={DISCOVER_MAX_QUERY_LENGTH}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={copy.placeholder}
                aria-label={copy.title}
                className="w-full bg-transparent border-b border-border-strong focus:border-foreground pb-4 px-10 text-center font-sans text-lg md:text-xl text-foreground placeholder:text-muted focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!canSubmit}
                aria-label={copy.submit}
                className="absolute right-0 bottom-4 text-muted hover:text-foreground disabled:opacity-0 transition-all"
              >
                <ArrowRight className="size-6" strokeWidth={1.5} />
              </button>
            </form>
            {(catalogHint || inputValue.length >= COUNTER_THRESHOLD) && (
              <div className="mt-4 flex w-full flex-col items-center gap-1 font-sans text-xs text-muted" aria-live="polite">
                {catalogHint && <p>{catalogHint}</p>}
                {inputValue.length >= COUNTER_THRESHOLD && (
                  <p className="tabular-nums">
                    {inputValue.length}/{DISCOVER_MAX_QUERY_LENGTH}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* 2. ANALİZ (YÜKLENİYOR) */}
        {status === 'loading' && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION.base}
            className="flex flex-col items-center justify-center gap-6 px-6 text-center"
            role="status"
            aria-live="polite"
          >
            {/* animate-ping yerine sakin dönen halka */}
            <div className="size-12 animate-spin rounded-full border border-border-subtle border-t-foreground motion-reduce:animate-none" aria-hidden />
            <motion.p
              key={loadingStep % loadingMessages.length}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="eyebrow text-sm"
            >
              {loadingMessages[loadingStep % loadingMessages.length]}
            </motion.p>
          </motion.div>
        )}

        {/* 3. SONUÇ: yapay zeka önerisi veya dürüst yerel eşleştirme */}
        {(status === 'success' || status === 'degraded') && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={TRANSITION.slow}
            className="w-full max-w-7xl px-4 md:px-8 lg:px-12 py-12 flex flex-col items-center"
          >
            <div className="max-w-2xl text-center mb-12">
              {status === 'success' ? (
                <p className="eyebrow mb-6 text-success">{copy.perfectMatch}</p>
              ) : (
                <p className="mb-6 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-eyebrow text-warning">
                  <Zap className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  {copy.quickMatchLabel}
                </p>
              )}
              <h2 className="mb-6 text-display-md font-normal text-foreground">
                {vehicleName(result.vehicle)}
              </h2>
              <p className="min-h-[80px] text-base leading-relaxed text-secondary md:text-lg">
                {status === 'success' ? (
                  <>"<TypewriterText key={result.reasoning} text={result.reasoning} />"</>
                ) : (
                  result.reasoning
                )}
              </p>
              {result.criteria.length > 0 && (
                <ul className="mt-6 flex flex-wrap justify-center gap-2" aria-label={copy.criteriaLabel}>
                  {result.criteria.map((label) => (
                    <li
                      key={label}
                      className="border border-border-subtle px-3 py-1 text-2xs font-medium uppercase tracking-eyebrow text-secondary"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Araç stüdyo görseli */}
            <div className="relative mb-16 w-full max-w-4xl">
              <SmartImage
                src={result.vehicle.interactiveGallery?.studioImage || result.vehicle.media.heroImage}
                alt={vehicleName(result.vehicle)}
                aspectRatio="16 / 9"
                fit="contain"
                colorHex={result.vehicle.media?.colorHex}
                priority
              />
            </div>

            {/* Aksiyonlar */}
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              <Link
                to={`/arac/${result.vehicle.id}`}
                className={primaryButtonClass}
              >
                {copy.inspectVehicle}
              </Link>
              {status === 'degraded' && (
                <button
                  type="button"
                  onClick={() => void runDiscovery(lastQuery)}
                  className="inline-flex items-center gap-2 border-b border-foreground/40 pb-1 text-xs font-semibold uppercase tracking-eyebrow text-foreground transition-colors hover:border-foreground"
                >
                  <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden="true" />
                  {copy.retry}
                </button>
              )}
              <button
                type="button"
                onClick={resetCurator}
                className="border-b border-transparent pb-1 text-xs font-semibold uppercase tracking-eyebrow text-muted transition-colors hover:border-foreground hover:text-foreground"
              >
                {copy.searchAgain}
              </button>
            </div>

            {/* Alternatifler */}
            {result.alternatives.length > 0 && (
              <div className="mt-16 w-full max-w-3xl">
                <p className="eyebrow mb-6 text-center">{copy.alternativesTitle}</p>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {result.alternatives.map((alt) => (
                    <li key={alt.id}>
                      <Link
                        to={`/arac/${alt.id}`}
                        className="group flex items-center gap-4 border border-border-subtle p-4 transition-colors hover:border-border-strong hover:bg-surface"
                      >
                        <div className="w-20 shrink-0">
                          <SmartImage
                            src={alt.media?.thumbnail || alt.media?.heroImage}
                            alt={vehicleName(alt)}
                            aspectRatio="16 / 10"
                            colorHex={alt.media?.colorHex}
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="truncate font-display text-lg font-normal text-foreground">{vehicleName(alt)}</p>
                          <p className="text-sm tabular-nums text-muted">{formatVehiclePrice(alt.pricing)}</p>
                        </div>
                        <ArrowRight
                          className="ml-auto size-4 shrink-0 text-muted transition-transform group-hover:translate-x-1"
                          strokeWidth={1.5}
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* 4. HATA: öneri üretilemedi */}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <StatusScreen
              compact
              eyebrow={copy.errorEyebrow}
              title={copy.errorTitle}
              description={copy.errorDescription}
              actions={
                <>
                  <button type="button" onClick={handleErrorRetry} className={primaryButtonClass}>
                    <RotateCcw className="size-4" strokeWidth={1.5} aria-hidden="true" />
                    {copy.retry}
                  </button>
                  <button type="button" onClick={resetCurator} className={secondaryButtonClass}>
                    {copy.searchAgain}
                  </button>
                </>
              }
            />
          </motion.div>
        )}

      </AnimatePresence>
    </section>
  );
}
