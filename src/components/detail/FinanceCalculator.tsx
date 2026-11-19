import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatPrice, type Currency } from '../../utils/formatPrice';

interface FinanceCalculatorProps {
  price: number;
  /** Aracın gerçek para birimi (resolveCurrency ile çözülmüş) */
  currency: Currency;
  /** Verilirse "Test Sürüşü Planla" butonu gösterilir */
  onApply?: () => void;
}

/**
 * Temsili AYLIK faiz oranları (%). Kesin oranlar finans kuruluşu, vade ve kampanyaya göre değişir.
 * TL kredileri ile döviz cinsinden fiyatlar aynı oranla hesaplanmamalı.
 */
const REPRESENTATIVE_MONTHLY_RATE: Record<Currency, number> = {
  TRY: 3.49,
  EUR: 0.49,
  USD: 0.55,
};
const TERMS = [12, 24, 36, 48];

export function FinanceCalculator({ price, currency, onApply }: FinanceCalculatorProps) {
  const [downpaymentPercent, setDownpaymentPercent] = useState(30);
  const [term, setTerm] = useState(36);

  const monthlyRate = REPRESENTATIVE_MONTHLY_RATE[currency];
  const formatCurrency = (val: number) => formatPrice(val, currency);
  const formattedRate = monthlyRate.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const downpaymentAmount = (price * downpaymentPercent) / 100;
  const loanAmount = price - downpaymentAmount;

  const monthlyPayment = useMemo(() => {
    if (loanAmount <= 0) return 0;
    const r = monthlyRate / 100;
    const n = term;
    if (r === 0) return loanAmount / n;
    // Taksitli kredi formülü: A = P * [r(1+r)^n] / [(1+r)^n - 1]
    const numerator = r * Math.pow(1 + r, n);
    const denominator = Math.pow(1 + r, n) - 1;
    return loanAmount * (numerator / denominator);
  }, [loanAmount, term, monthlyRate]);

  return (
    <section className="w-full border-t border-border-subtle pt-16 pb-8 mt-16">
      <div className="flex flex-col lg:flex-row gap-16 items-start">
        
        {/* Controls Column */}
        <div className="flex-1 w-full space-y-12">
          <div>
            <h3 className="font-serif text-2xl font-light text-foreground mb-8">Akıllı Finansman</h3>
            
            {/* Downpayment Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-xs uppercase tracking-widest text-muted">Peşinat</span>
                <span className="font-display text-xl text-foreground">{formatCurrency(downpaymentAmount)} <span className="text-sm text-muted">({downpaymentPercent}%)</span></span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="80" 
                step="5"
                value={downpaymentPercent}
                onChange={(e) => setDownpaymentPercent(Number(e.target.value))}
                className="w-full h-0.5 bg-border-subtle appearance-none cursor-pointer outline-none slider-thumb-minimalist"
                style={{
                  background: `linear-gradient(to right, rgb(var(--color-foreground)) ${((downpaymentPercent - 10) / 70) * 100}%, rgb(var(--color-border-subtle)) ${((downpaymentPercent - 10) / 70) * 100}%)`
                }}
              />
            </div>
          </div>

          {/* Terms */}
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-widest text-muted block mb-4">Vade Seçenekleri</span>
            <div className="flex gap-4">
              {TERMS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTerm(t)}
                  className={`flex-1 py-3 text-sm font-medium transition-all duration-300 border-b ${
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
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 text-xs text-muted uppercase tracking-widest">
              <span>Araç Fiyatı: {formatCurrency(price)}</span>
              <span>Aylık Faiz: %{formattedRate} (temsili)</span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted">
              Bu tablo temsili bir hesaplamadır. Faiz oranı, vade ve peşinat koşulları finans kuruluşuna ve
              kampanyalara göre değişir; kesin teklif için danışmanınızla görüşün.
            </p>
          </div>
        </div>

        {/* Result Column */}
        <div className="flex-1 w-full flex flex-col items-center lg:items-end justify-center py-8">
          <span className="text-xs uppercase tracking-widest text-muted mb-4">Aylık Ödeme</span>
          <AnimatePresence mode="wait">
            <motion.div
              key={monthlyPayment}
              initial={{ opacity: 0, filter: 'blur(4px)', y: -10 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(4px)', y: 10 }}
              transition={{ duration: 0.3 }}
              className="text-center lg:text-right"
            >
              <span className="font-serif text-6xl md:text-7xl lg:text-8xl font-light text-foreground tracking-tighter">
                {formatCurrency(monthlyPayment)}
              </span>
            </motion.div>
          </AnimatePresence>
          {onApply && (
            <div className="mt-12 flex flex-col items-center gap-3 lg:items-end">
              <button
                type="button"
                onClick={onApply}
                className="px-8 py-4 border border-foreground text-foreground hover:bg-foreground hover:text-void transition-colors font-sans text-sm font-medium uppercase tracking-widest"
              >
                Test Sürüşü Planla
              </button>
              <p className="max-w-xs text-center text-[11px] leading-relaxed text-muted lg:text-right">
                Finansman seçeneklerini test sürüşünde danışmanınızla netleştirebilirsiniz.
              </p>
            </div>
          )}
        </div>

      </div>
      
      {/* Required CSS for custom slider thumb (if tailwind custom is not enough) */}
      <style dangerouslySetInnerHTML={{__html: `
        .slider-thumb-minimalist::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(var(--color-foreground));
          cursor: pointer;
          border: 2px solid rgb(var(--color-void));
          box-shadow: 0 0 0 1px rgb(var(--color-border-subtle));
        }
        .slider-thumb-minimalist::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: rgb(var(--color-foreground));
          cursor: pointer;
          border: 2px solid rgb(var(--color-void));
          box-shadow: 0 0 0 1px rgb(var(--color-border-subtle));
        }
      `}} />
    </section>
  );
}
