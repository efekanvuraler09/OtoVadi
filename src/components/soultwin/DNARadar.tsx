import { m } from 'framer-motion';
import type { DriverDNA, DNADimension } from '../../utils/dnaEngine';
import { DNA_LABELS } from '../../utils/dnaEngine';
import { TRANSITION, staggerDelay } from '../../lib/motion';

interface DNARadarProps {
  dna: DriverDNA;
}

const DIMENSIONS: DNADimension[] = ['performance', 'elegance', 'adventure', 'comfort', 'technology'];

export function DNARadar({ dna }: DNARadarProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION.slow}
      className="flex w-full max-w-md flex-col gap-5"
    >
      <div className="mb-2 text-center">
        <p className="eyebrow">
          Sürücü DNA Profiliniz
        </p>
      </div>

      {DIMENSIONS.map((dim, index) => (
        <m.div
          key={dim}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...TRANSITION.base, delay: 0.1 + staggerDelay(index, 0.06) }}
          className="flex flex-col gap-2"
        >
          {/* Label & Value */}
          <div className="flex items-baseline justify-between">
            <span className="stat-label">
              {DNA_LABELS[dim]}
            </span>
            <m.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...TRANSITION.base, delay: 0.2 + staggerDelay(index, 0.06) }}
              className="stat-value text-lg"
            >
              %{dna[dim]}
            </m.span>
          </div>

          {/* Bar Track */}
          <div className="relative h-[2px] w-full overflow-hidden bg-border-subtle">
            <m.div
              initial={{ width: 0 }}
              animate={{ width: `${dna[dim]}%` }}
              transition={{ ...TRANSITION.slow, delay: 0.15 + staggerDelay(index, 0.06) }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-foreground/70 to-foreground/40"
            />
            {/* Glow tip */}
            <m.div
              initial={{ left: '0%', opacity: 0 }}
              animate={{ left: `${dna[dim]}%`, opacity: 1 }}
              transition={{ ...TRANSITION.slow, delay: 0.15 + staggerDelay(index, 0.06) }}
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
              style={{ boxShadow: '0 0 8px rgb(var(--color-foreground) / 0.3)' }}
            />
          </div>
        </m.div>
      ))}
    </m.div>
  );
}
