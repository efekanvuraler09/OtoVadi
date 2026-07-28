import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FinanceCalculatorProps {
  price: number;
}

const INTEREST_RATE = 3.49; // Aylık %3.49
const TERMS = [12, 24, 36, 48];

export function FinanceCalculator({ price }: FinanceCalculatorProps) {
  const [downpaymentPercent, setDownpaymentPercent] = useState(30);
  const [term, setTerm] = useState(36);

  const formatCurrency = (val: number) => {
    const currency = price < 1000000 ? 'EUR' : 'TRY';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const downpaymentAmount = (price * downpaymentPercent) / 100;
  const loanAmount = price - downpaymentAmount;

  const monthlyPayment = useMemo(() => {
    if (loanAmount <= 0) return 0;
    const r = INTEREST_RATE / 100;
    const n = term;
    // Taksitli kredi formülü: A = P * [r(1+r)^n] / [(1+r)^n - 1]
    const numerator = r * Math.pow(1 + r, n);
    const denominator = Math.pow(1 + r, n) - 1;
    return loanAmount * (numerator / denominator);
  }, [loanAmount, term]);

  return (
    <section className="w-full border-t border-border-subtle pt-16 pb-8 mt-16">
      <div className="flex flex-col lg:flex-row gap-16 items-start">
        
        {/* Controls Column */}
        <div className="flex-1 w-full space-y-12">
          <div>
            <h3 className="font-display text-2xl font-light text-foreground mb-8">Akıllı Finansman</h3>
            
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
                  background: `linear-gradient(to right, var(--color-foreground) ${((downpaymentPercent - 10) / 70) * 100}%, var(--color-border-subtle) ${((downpaymentPercent - 10) / 70) * 100}%)`
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
          
          <div className="flex justify-between text-xs text-muted uppercase tracking-widest pt-4">
            <span>Araç Fiyatı: {formatCurrency(price)}</span>
            <span>Faiz Oranı: %{INTEREST_RATE}</span>
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
              <span className="font-display text-6xl md:text-7xl lg:text-8xl font-light text-foreground tracking-tighter">
                {formatCurrency(monthlyPayment)}
              </span>
            </motion.div>
          </AnimatePresence>
          <button className="mt-12 px-8 py-4 border border-foreground text-foreground hover:bg-foreground hover:text-void transition-colors font-sans text-sm font-medium uppercase tracking-widest">
            Hemen Başvur
          </button>
        </div>

      </div>
      
      {/* Required CSS for custom slider thumb (if tailwind custom is not enough) */}
      <style dangerouslySetInnerHTML={{__html: `
        .slider-thumb-minimalist::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-foreground, #fff);
          cursor: pointer;
          border: 2px solid var(--color-void, #000);
          box-shadow: 0 0 0 1px var(--color-border-subtle, #333);
        }
        .slider-thumb-minimalist::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--color-foreground, #fff);
          cursor: pointer;
          border: 2px solid var(--color-void, #000);
          box-shadow: 0 0 0 1px var(--color-border-subtle, #333);
        }
      `}} />
    </section>
  );
}
