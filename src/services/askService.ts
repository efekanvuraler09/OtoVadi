import type { Vehicle } from '../types/vehicle';
import type { AskErrorCode, AskEstimates, AskLocale, AskSuccessResponse } from '../types/ask';
import { calculateTco, DEFAULT_UNIT_PRICE } from '../lib/tco';
import { calculateFinance, type OwnershipPlan } from '../lib/finance';
import { energyKind } from '../lib/vehicleMetrics';
import { resolveCurrency } from '../utils/formatPrice';

/** Sunucudaki sınırla aynı (api/ask.ts) */
export const ASK_MAX_QUESTION_LENGTH = 300;
/** Oturum (sekme) başına soru hakkı — Vercel Hobby'de kalıcı hız sınırı olmadığı için asıl maliyet freni burası */
export const ASK_SESSION_LIMIT = 6;
const CLIENT_TIMEOUT_MS = 16_000;
const SESSION_KEY = 'otovadi-advisor-asked';

export type AskOutcome = { ok: true; data: AskSuccessResponse } | { ok: false; error: AskErrorCode | 'network' | 'timeout' };

/** Oturumda sorulmuş soru sayısı (sessionStorage erişilemezse bellek içi) */
let memoryCount = 0;

export function askedThisSession(): number {
  try {
    const stored = Number(sessionStorage.getItem(SESSION_KEY));
    return Number.isFinite(stored) && stored > 0 ? stored : memoryCount;
  } catch {
    return memoryCount;
  }
}

function incrementAsked(): number {
  const next = askedThisSession() + 1;
  memoryCount = next;
  try {
    sessionStorage.setItem(SESSION_KEY, String(next));
  } catch {
    // Gizli pencere vb.: bellek içi sayaç yeterli
  }
  return next;
}

/** Danışmana iletilen temsili maliyet tahminleri (yalnızca sayılar; detay sayfasındaki seçimle) */
export function buildAskEstimates(vehicle: Vehicle, plan: OwnershipPlan): AskEstimates {
  const kind = energyKind(vehicle);
  const tco = calculateTco(vehicle, { annualKm: plan.annualKm, unitPrice: DEFAULT_UNIT_PRICE[kind] });
  const estimates: AskEstimates = {
    annualKm: plan.annualKm,
    tcoTotalTry: Math.round(tco.total),
    tcoMonthlyTry: Math.round(tco.monthly),
  };
  // Doğrulanmamış teknik değerden türeyen tüketim gönderilmez (Cila 1)
  if (tco.consumption.reliable) {
    estimates.consumptionPer100Km = tco.consumption.value;
    estimates.consumptionUnit = tco.consumption.unit;
  }
  if (vehicle.pricing?.msrp > 0) {
    const finance = calculateFinance(vehicle.pricing.msrp, resolveCurrency(vehicle.pricing), plan.downPercent, plan.term);
    estimates.financeMonthly = Math.round(finance.monthly);
    estimates.financeTermMonths = plan.term;
    estimates.financeDownPercent = plan.downPercent;
  }
  return estimates;
}

/**
 * POST /api/ask. Araç kaydı sunucuda Firestore'dan okunur; burada yalnızca id, soru, dil ve sayısal tahminler gider.
 * Başarılı her yanıt oturum hakkından düşer (başarısız istek hak yemez).
 */
export async function askAdvisor(
  vehicle: Vehicle,
  question: string,
  locale: AskLocale,
  estimates: AskEstimates,
  signal?: AbortSignal,
): Promise<AskOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), CLIENT_TIMEOUT_MS);
  const onAbort = () => controller.abort('cancelled');
  signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicle.id,
        question: question.replace(/\s+/g, ' ').trim().slice(0, ASK_MAX_QUESTION_LENGTH),
        locale,
        estimates,
      }),
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const code = payload && typeof payload === 'object' && 'error' in payload ? (payload as { error: AskErrorCode }).error : undefined;
      return { ok: false, error: code ?? 'network' };
    }
    const data = payload as AskSuccessResponse | null;
    if (!data || typeof data.answer !== 'string' || !data.answer.trim()) return { ok: false, error: 'invalid_model_output' };
    incrementAsked();
    return {
      ok: true,
      data: {
        answer: data.answer,
        usedFields: Array.isArray(data.usedFields) ? data.usedFields.filter((f) => typeof f === 'string') : [],
        unknown: data.unknown === true,
        model: typeof data.model === 'string' ? data.model : '',
      },
    };
  } catch {
    return { ok: false, error: controller.signal.reason === 'timeout' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
}
