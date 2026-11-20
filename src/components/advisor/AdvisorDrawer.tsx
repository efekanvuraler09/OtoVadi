import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { ArrowUp, X } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import type { AskErrorCode } from '../../types/ask';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useI18n } from '../../i18n/useI18n';
import { TRANSITION } from '../../lib/motion';
import type { OwnershipPlan } from '../../lib/finance';
import {
  ASK_MAX_QUESTION_LENGTH,
  ASK_SESSION_LIMIT,
  askAdvisor,
  askedThisSession,
  buildAskEstimates,
} from '../../services/askService';
import { vehicleName } from '../../utils/vehicleText';

interface AdvisorDrawerProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  /** Detay sayfasındaki finansman / km seçimi: maliyet sorularında aynı tahminler kullanılır */
  plan: OwnershipPlan;
}

interface Exchange {
  id: number;
  question: string;
  status: 'loading' | 'done' | 'error';
  answer?: string;
  usedFields?: string[];
  unknown?: boolean;
  error?: string;
}

const SUGGESTIONS = ['Uzun yolda konforu nasıl?', '5 yıllık maliyeti ve yakıtı makul mü?', 'Kimler için uygun?'];

/** Yanıtın dayandığı kayıt alanlarının okunur adları ("Dayanak: Güç · Bagaj") */
const FIELD_LABELS: Record<string, string> = {
  name: 'Model',
  year: 'Model yılı',
  bodyType: 'Gövde',
  segment: 'Segment',
  trim: 'Donanım',
  tagline: 'Tanıtım',
  description: 'Açıklama',
  listPrice: 'Liste fiyatı',
  engineCode: 'Motor',
  displacementCc: 'Motor hacmi',
  powerHp: 'Güç',
  powerKw: 'Güç',
  torqueNm: 'Tork',
  zeroTo100Kmh: '0–100',
  topSpeedKmh: 'Maks. hız',
  fuelType: 'Yakıt',
  transmission: 'Şanzıman',
  drivetrain: 'Çekiş',
  cylinders: 'Silindir',
  configuration: 'Motor dizilimi',
  aspiration: 'Besleme',
  gears: 'Vites',
  lengthMm: 'Uzunluk',
  widthMm: 'Genişlik',
  heightMm: 'Yükseklik',
  wheelbaseMm: 'Aks mesafesi',
  bootCapacityL: 'Bagaj',
  curbWeightKg: 'Ağırlık',
  highlights: 'Donanım listesi',
  multimedia: 'Multimedya',
  interiorMaterials: 'İç mekân',
  technicalSections: 'Teknik bilgiler',
  driverNotes: 'Sürücü notları',
  'estimates.annualKm': 'Yıllık km',
  'estimates.tcoTotalTry': '5 yıllık maliyet',
  'estimates.tcoMonthlyTry': 'Aylık maliyet',
  'estimates.consumptionPer100Km': 'Tahmini tüketim',
  'estimates.financeMonthly': 'Finansman',
  'estimates.financeTermMonths': 'Vade',
  'estimates.financeDownPercent': 'Peşinat',
};

const ERROR_MESSAGES: Partial<Record<AskErrorCode | 'network' | 'timeout', string>> = {
  question_too_long: `Sorunuz ${ASK_MAX_QUESTION_LENGTH} karakteri aşıyor; biraz kısaltabilir misiniz?`,
  invalid_question: 'Lütfen bir soru yazın.',
  rate_limited: 'Kısa sürede çok sayıda soru geldi. Bir dakika sonra yeniden deneyebilirsiniz.',
  vehicle_not_found: 'Bu araç kaydına danışman şu an ulaşamıyor.',
  timeout: 'Yanıt beklenenden uzun sürdü. Yeniden deneyebilirsiniz.',
  network: 'Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip yeniden deneyin.',
};
const DEFAULT_ERROR = 'Danışman şu an yanıt veremiyor. Birazdan yeniden deneyebilirsiniz.';

const isDesktop = () => typeof window !== 'undefined' && window.matchMedia?.('(min-width: 768px)').matches === true;

/**
 * 2.1 — "Bu Araca Sorun" kişisel ürün danışmanı. Masaüstünde sağdan yan çekmece, mobilde alt sheet. Portal + merkezi
 * z-index (z-drawer) + useBodyScrollLock; ESC kapatır, odak içeride döner. Yanıtlar yalnızca aracın doğrulanmış
 * kaydına dayanır (api/ask.ts); oturum başına ASK_SESSION_LIMIT soru hakkı vardır.
 */
export function AdvisorDrawer({ vehicle, isOpen, onClose, plan }: AdvisorDrawerProps) {
  const { locale } = useI18n();
  const reduceMotion = useReducedMotion();
  const titleId = useId();
  const inputId = useId();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [draft, setDraft] = useState('');
  const [asked, setAsked] = useState(askedThisSession);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inflight = useRef<AbortController | null>(null);
  const nextId = useRef(1);

  useBodyScrollLock(isOpen);

  const remaining = Math.max(0, ASK_SESSION_LIMIT - asked);
  const busy = exchanges.some((e) => e.status === 'loading');
  const exhausted = remaining === 0;
  const desktop = isDesktop();

  // ESC, odak tuzağı ve kapanınca tetikleyen öğeye dönüş (GalleryLightbox deseni)
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => (isDesktop() ? inputRef.current : panelRef.current)?.focus(), 60);

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeRef.current();
      } else if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), textarea:not([disabled]), [href]',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  // Yeni soru/yanıt geldiğinde konuşmanın sonuna kaydır
  useEffect(() => {
    if (exchanges.length > 0) endRef.current?.scrollIntoView({ block: 'end', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [exchanges, reduceMotion]);

  // Sayfadan çıkılırsa bekleyen istek iptal edilir
  useEffect(() => () => inflight.current?.abort(), []);

  const submit = async (raw: string) => {
    const question = raw.replace(/\s+/g, ' ').trim();
    if (!question || busy || exhausted) return;
    if (question.length > ASK_MAX_QUESTION_LENGTH) return;

    const id = nextId.current++;
    setExchanges((list) => [...list, { id, question, status: 'loading' }]);
    setDraft('');

    const controller = new AbortController();
    inflight.current = controller;
    const outcome = await askAdvisor(vehicle, question, locale, buildAskEstimates(vehicle, plan), controller.signal);
    if (controller.signal.aborted) return;
    inflight.current = null;

    setExchanges((list) =>
      list.map((item) =>
        item.id !== id
          ? item
          : outcome.ok
            ? { ...item, status: 'done', answer: outcome.data.answer, usedFields: outcome.data.usedFields, unknown: outcome.data.unknown }
            : { ...item, status: 'error', error: ERROR_MESSAGES[outcome.error] ?? DEFAULT_ERROR },
      ),
    );
    if (outcome.ok) setAsked(askedThisSession());
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit(draft);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit(draft);
    }
  };

  const retry = (item: Exchange) => {
    setExchanges((list) => list.filter((e) => e.id !== item.id));
    void submit(item.question);
  };

  const tooLong = draft.length > ASK_MAX_QUESTION_LENGTH;
  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : desktop
      ? { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } }
      : { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div key="advisor" className="fixed inset-0 z-drawer-backdrop">
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION.base}
            onClick={onClose}
            className="absolute inset-0 bg-void/70 backdrop-blur-sm"
            aria-hidden
          />

          <m.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            {...panelMotion}
            transition={TRANSITION.slow}
            className="absolute inset-x-0 bottom-0 z-drawer flex max-h-[88svh] flex-col border-t border-border-subtle bg-void text-foreground shadow-2xl outline-none md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-full md:max-w-md md:border-l md:border-t-0"
          >
            {/* Başlık */}
            <div className="shrink-0 border-b border-border-subtle px-6 pb-5 pt-4 md:px-8 md:pt-8">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-foreground/20 md:hidden" aria-hidden />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow mb-2">Ürün Danışmanı</p>
                  <h2 id={titleId} className="text-display-sm font-normal text-foreground">
                    Bu Araca Sorun
                  </h2>
                  <p className="mt-1 truncate text-sm text-muted" lang="en">
                    {vehicleName(vehicle)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="-mr-2 flex size-11 shrink-0 items-center justify-center text-muted transition-colors hover:text-foreground"
                  aria-label="Danışmanı kapat"
                >
                  <X className="size-5" strokeWidth={1.5} aria-hidden />
                </button>
              </div>
            </div>

            {/* Konuşma */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-6 md:px-8" aria-live="polite">
              <p className="text-sm leading-relaxed text-secondary">
                Yanıtlarım yalnızca bu aracın doğrulanmış kayıt bilgilerine dayanır. Kayıtta yer almayan bir detayı
                tahmin etmem; açıkça belirtirim.
              </p>

              {exchanges.length > 0 && (
                <ol className="mt-8 flex flex-col gap-8">
                  {exchanges.map((item) => (
                    <li key={item.id} className="flex flex-col gap-4">
                      <p className="ml-8 self-end border border-border-subtle px-4 py-3 text-sm leading-relaxed text-secondary">
                        {item.question}
                      </p>

                      {item.status === 'loading' && (
                        <p className="flex items-center gap-3 border-l border-border-strong pl-4 text-sm text-muted">
                          <span className="size-1.5 rounded-full bg-foreground motion-safe:animate-pulse" aria-hidden />
                          Danışman araç kaydını inceliyor…
                        </p>
                      )}

                      {item.status === 'done' && (
                        <m.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={TRANSITION.base}
                          className="border-l border-foreground pl-4"
                        >
                          {item.unknown && <p className="stat-label mb-2">Kayıtta sınırlı bilgi</p>}
                          <p className="text-sm leading-relaxed text-foreground md:text-base">{item.answer}</p>
                          {item.usedFields && item.usedFields.length > 0 && (
                            <p className="mt-3 text-2xs text-muted">
                              Dayanak:{' '}
                              {[...new Set(item.usedFields.map((f) => FIELD_LABELS[f] ?? f))].join(' · ')}
                            </p>
                          )}
                        </m.div>
                      )}

                      {item.status === 'error' && (
                        <div role="alert" className="border-l border-danger pl-4">
                          <p className="text-sm leading-relaxed text-danger">{item.error}</p>
                          {!exhausted && (
                            <button
                              type="button"
                              onClick={() => retry(item)}
                              disabled={busy}
                              className="mt-2 min-h-10 text-xs font-medium uppercase tracking-eyebrow text-foreground underline-offset-4 hover:underline disabled:opacity-50"
                            >
                              Yeniden dene
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              )}
              <div ref={endRef} />
            </div>

            {/* Soru alanı */}
            <div className="shrink-0 border-t border-border-subtle px-6 pb-sheet pt-4 md:px-8 md:pb-8">
              {!exhausted && exchanges.length === 0 && (
                <ul className="-mx-1 mb-4 flex flex-wrap gap-2" aria-label="Örnek sorular">
                  {SUGGESTIONS.map((suggestion) => (
                    <li key={suggestion}>
                      <button
                        type="button"
                        onClick={() => void submit(suggestion)}
                        disabled={busy}
                        className="min-h-10 border border-border-subtle px-3 text-left text-xs text-secondary transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                      >
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {exhausted ? (
                <p className="text-sm leading-relaxed text-muted">
                  Bu oturumdaki soru hakkınız doldu. Ayrıntıları test sürüşünde danışmanımızla birlikte netleştirebilirsiniz.
                </p>
              ) : (
                <form onSubmit={onSubmit}>
                  <label htmlFor={inputId} className="sr-only">
                    Sorunuz
                  </label>
                  <div className="flex items-end gap-3 border-b border-border-strong focus-within:border-foreground">
                    <textarea
                      ref={inputRef}
                      id={inputId}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onInputKeyDown}
                      rows={2}
                      maxLength={ASK_MAX_QUESTION_LENGTH + 50}
                      placeholder="Bu araç hakkında merak ettiğinizi sorun"
                      className="min-h-12 flex-1 resize-none bg-transparent py-2 text-sm text-foreground caret-foreground outline-none placeholder:text-muted"
                      aria-describedby={`${inputId}-meta`}
                    />
                    <button
                      type="submit"
                      disabled={busy || !draft.trim() || tooLong}
                      className="mb-2 flex size-10 shrink-0 items-center justify-center bg-foreground text-void transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label="Soruyu gönder"
                    >
                      <ArrowUp className="size-4" strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                  <p id={`${inputId}-meta`} className="mt-2 flex justify-between gap-4 text-2xs tabular-nums text-muted">
                    <span>
                      Bu oturumda <span className="text-secondary">{remaining}</span> soru hakkınız var
                    </span>
                    <span className={tooLong ? 'text-danger' : undefined}>
                      {draft.length}/{ASK_MAX_QUESTION_LENGTH}
                    </span>
                  </p>
                </form>
              )}
              <p className="mt-3 text-2xs leading-relaxed text-muted">
                Yapay zekâ destekli yanıttır; satın alma kararı öncesi bilgileri danışmanınızla doğrulayın.
              </p>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
