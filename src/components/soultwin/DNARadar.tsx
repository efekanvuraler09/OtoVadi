import { motion } from 'framer-motion';
import type { DriverDNA, DNADimension } from '../../utils/dnaEngine';
import { DNA_LABELS } from '../../utils/dnaEngine';

interface DNARadarProps {
  dna: DriverDNA;
}

const DIMENSIONS: DNADimension[] = ['performance', 'elegance', 'adventure', 'comfort', 'technology'];

export function DNARadar({ dna }: DNARadarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
      className="flex w-full max-w-md flex-col gap-5"
    >
      <div className="mb-2 text-center">
        <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-muted">
          Sürücü DNA Profiliniz
        </p>
      </div>

      {DIMENSIONS.map((dim, index) => (
        <motion.div
          key={dim}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            delay: 0.5 + index * 0.15,
            duration: 0.6,
            ease: 'easeOut',
          }}
          className="flex flex-col gap-2"
        >
          {/* Label & Value */}
          <div className="flex items-baseline justify-between">
            <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-muted">
              {DNA_LABELS[dim]}
            </span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 + index * 0.15, duration: 0.5 }}
              className="font-display text-lg font-light text-foreground/80"
            >
              %{dna[dim]}
            </motion.span>
          </div>

          {/* Bar Track */}
          <div className="relative h-[2px] w-full overflow-hidden bg-border-subtle">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${dna[dim]}%` }}
              transition={{
                delay: 0.6 + index * 0.15,
                duration: 1.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-foreground/60 to-foreground/30"
            />
            {/* Glow tip */}
            <motion.div
              initial={{ left: '0%', opacity: 0 }}
              animate={{ left: `${dna[dim]}%`, opacity: 1 }}
              transition={{
                delay: 0.6 + index * 0.15,
                duration: 1.2,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground/50"
              style={{
                boxShadow: '0 0 8px rgba(255,255,255,0.3), 0 0 16px rgba(255,255,255,0.1)',
              }}
            />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
