import type { Currency } from '../utils/formatPrice';
import { ANNUAL_KM } from './tco';

/**
 * Faz 6 — Finansman hesabı tek yerde: detaydaki FinanceCalculator, A4 broşür ve Özel Dosya (/dosya) aynı formülü kullanır.
 *
 * Temsili AYLIK faiz oranları (%). Kesin oranlar finans kuruluşu, vade ve kampanyaya göre değişir.
 * TL kredileri ile döviz cinsinden fiyatlar aynı oranla hesaplanmamalı.
 */
export const REPRESENTATIVE_MONTHLY_RATE: Record<Currency, number> = {
  TRY: 3.49,
  EUR: 0.49,
  USD: 0.55,
};

export const FINANCE_TERMS = [12, 24, 36, 48] as const;
export const DOWN_PAYMENT = { min: 10, max: 80, step: 5, default: 30 } as const;
export const DEFAULT_TERM = 36;

export interface FinanceResult {
  downPercent: number;
  term: number;
  downAmount: number;
  loanAmount: number;
  /** Aylık faiz oranı (%) */
  monthlyRate: number;
  monthly: number;
}

/** Taksitli kredi: A = P · r(1+r)^n / ((1+r)^n − 1) */
export function calculateFinance(price: number, currency: Currency, downPercent: number, term: number): FinanceResult {
  const monthlyRate = REPRESENTATIVE_MONTHLY_RATE[currency];
  const safePrice = Number.isFinite(price) && price > 0 ? price : 0;
  const downAmount = (safePrice * downPercent) / 100;
  const loanAmount = safePrice - downAmount;
  let monthly = 0;
  if (loanAmount > 0 && term > 0) {
    const r = monthlyRate / 100;
    const growth = Math.pow(1 + r, term);
    monthly = r === 0 ? loanAmount / term : loanAmount * ((r * growth) / (growth - 1));
  }
  return { downPercent, term, downAmount, loanAmount, monthlyRate, monthly };
}

/** Finansman + TCO seçimleri (detay sayfası panelinden broşüre, garajdan /dosya URL'sine taşınır) */
export interface OwnershipPlan {
  downPercent: number;
  term: number;
  annualKm: number;
}

export const DEFAULT_PLAN: OwnershipPlan = {
  downPercent: DOWN_PAYMENT.default,
  term: DEFAULT_TERM,
  annualKm: ANNUAL_KM.default,
};

const snap = (value: number, min: number, max: number, step: number) =>
  Math.min(max, Math.max(min, Math.round((value - min) / step) * step + min));

/** URL'den gelen (güvenilmez) değerleri geçerli aralığa ve adımlara oturtur; bozuk değer varsayılana döner. */
export function sanitizePlan(raw: { downPercent?: unknown; term?: unknown; annualKm?: unknown }): OwnershipPlan {
  const num = (value: unknown) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : Number.NaN);
  const down = num(raw.downPercent);
  const term = num(raw.term);
  const km = num(raw.annualKm);
  return {
    downPercent: Number.isFinite(down)
      ? snap(down, DOWN_PAYMENT.min, DOWN_PAYMENT.max, DOWN_PAYMENT.step)
      : DEFAULT_PLAN.downPercent,
    term: (FINANCE_TERMS as readonly number[]).includes(term) ? term : DEFAULT_PLAN.term,
    annualKm: Number.isFinite(km) ? snap(km, ANNUAL_KM.min, ANNUAL_KM.max, ANNUAL_KM.step) : DEFAULT_PLAN.annualKm,
  };
}
