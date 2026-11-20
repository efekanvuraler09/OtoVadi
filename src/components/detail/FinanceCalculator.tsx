import { m, AnimatePresence } from 'framer-motion';
import { formatPrice, type Currency } from '../../utils/formatPrice';
import { secondaryButtonClass } from '../ui/buttonStyles';
import { TRANSITION } from '../../lib/motion';
import { DOWN_PAYMENT, FINANCE_TERMS, calculateFinance } from '../../lib/finance';

interface FinanceCalculatorProps {
  price: number;
  /** Aracın gerçek para birimi (resolveCurrency ile çözülmüş) */
  currency: Currency;
  /** Peşinat oranı (%) ve vade (ay): VehicleDetailPage'de tutulur, A4 broşür de aynı seçimi basar (Faz 6) */
  downPercent: number;
  term: number;
  onDownPercentChange: (value: number) => void;
  onTermChange: (value: number) => void;
  /** Verilirse "Test Sürüşü Planla" butonu gösterilir */
  onApply?: () => void;
}

export function FinanceCalculator({
  price,
  currency,
  downPercent: downpaymentPercent,
  term,
  onDownPercentChange: setDownpaymentPercent,
  onTermChange: setTerm,
  onApply,
}: FinanceCalculatorProps) {
  // Hesap lib/finance.ts'te (broşür ve Özel Dosya ile ortak)
  const {
    monthlyRate,
    downAmount: downpaymentAmount,
    monthly: monthlyPayment,
  } = calculateFinance(price, currency, downpaymentPercent, term);
  const formatCurrency = (val: number) => formatPrice(val, currency);
  const formattedRate = monthlyRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const downRange = DOWN_PAYMENT.max - DOWN_PAYMENT.min;

  return (
    // Dış kap ve başlık OwnershipCostPanel'de (Finansman / 5 Yıllık Maliyet sekmeleri)
    <div className="flex flex-col items-start gap-16 lg:flex-row">
        
        {/* Controls Column */}
        <div className="flex-1 w-full space-y-12">
          <div>
            {/* Downpayment Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="stat-label">Peşinat</span>
                <span className="text-xl font-medium tabular-nums text-foreground">{formatCurrency(downpaymentAmount)} <span className="text-sm font-normal text-muted">(%{downpaymentPercent})</span></span>
              </div>
              <input 
                type="range"
                aria-label="Peşinat oranı"
                min={DOWN_PAYMENT.min}
                max={DOWN_PAYMENT.max}
                step={DOWN_PAYMENT.step}
                value={downpaymentPercent}
                onChange={(e) => setDownpaymentPercent(Number(e.target.value))}
                className="w-full h-0.5 bg-border-subtle appearance-none cursor-pointer outline-none range-thumb"
                style={{
                  background: `linear-gradient(to right, rgb(var(--color-foreground)) ${((downpaymentPercent - DOWN_PAYMENT.min) / downRange) * 100}%, rgb(var(--color-border-subtle)) ${((downpaymentPercent - DOWN_PAYMENT.min) / downRange) * 100}%)`
                }}
              />
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-4">
            <span className="stat-label mb-4 block">Vade Seçenekleri</span>
            <div className="flex gap-4">
              {FINANCE_TERMS.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={term === t}
                  onClick={() => setTerm(t)}
                  className={`flex-1 border-b py-3 text-sm font-medium tabular-nums transition-colors ${
                    term === t 
                      ? 'border-foreground text-foreground' 
                      : 'border-border-subtle text-muted hover:border-muted'
                  }`}
                >
                  {t} Ay
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-3 pt-4">
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 text-xs tabular-nums text-muted">
              <span>Araç Fiyatı: {formatCurrency(price)}</span>
              <span>Aylık Faiz: %{formattedRate} (temsili)</span>
            </div>
            <p className="text-2xs leading-relaxed text-muted">
              Bu tablo temsili bir hesaplamadır. Faiz oranı, vade ve peşinat koşulları finans kuruluşuna ve
              kampanyalara göre değişir; kesin teklif için danışmanınızla görüşün.
            </p>
          </div>
        </div>

        {/* Result Column */}
        <div className="flex-1 w-full flex flex-col items-center lg:items-end justify-center py-8">
          <span className="stat-label mb-4">Aylık Ödeme</span>
          <AnimatePresence mode="wait">
            <m.div
              key={monthlyPayment}
              // blur yerine opacity + translate (mobilde ucuz)
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={TRANSITION.fast}
              className="text-center lg:text-right"
            >
              <span className="font-sans text-5xl font-light tabular-nums tracking-tight text-foreground md:text-6xl">
                {formatCurrency(monthlyPayment)}
              </span>
            </m.div>
          </AnimatePresence>
          {onApply && (
            <div className="mt-12 flex flex-col items-center gap-3 lg:items-end">
              <button
                type="button"
                onClick={onApply}
                className={secondaryButtonClass}
              >
                Test Sürüşü Planla
              </button>
              <p className="max-w-xs text-center text-2xs leading-relaxed text-muted lg:text-right">
                Finansman seçeneklerini test sürüşünde danışmanınızla netleştirebilirsiniz.
              </p>
            </div>
          )}
        </div>

    </div>
  );
}
