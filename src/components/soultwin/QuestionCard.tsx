import { motion } from 'framer-motion';
import type { DNAQuestion } from '../../utils/dnaEngine';

interface QuestionCardProps {
  question: DNAQuestion;
  currentStep: number;
  totalSteps: number;
  onAnswer: (choice: 'a' | 'b') => void;
}

export function QuestionCard({ question, currentStep, totalSteps, onAnswer }: QuestionCardProps) {
  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="flex min-h-dvh flex-col bg-void"
    >
      {/* ── Progress & Question Prompt ── */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-6 pb-4 pt-24 md:pt-28">
        {/* Step Dots */}
        <div className="flex items-center gap-2.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-[3px] transition-all duration-500 ${
                i < currentStep
                  ? 'w-6 bg-foreground/70'
                  : i === currentStep
                    ? 'w-8 bg-foreground'
                    : 'w-4 bg-foreground/20'
              }`}
            />
          ))}
        </div>

        <p className="font-display text-[11px] uppercase tracking-[0.5em] text-muted">
          {currentStep + 1} / {totalSteps}
        </p>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
          className="max-w-xl text-center font-display text-2xl font-light leading-relaxed tracking-wide text-foreground md:text-3xl lg:text-4xl"
        >
          {question.prompt}
        </motion.h2>
      </div>

      {/* ── Split Screen Options ── */}
      <div className="relative z-10 flex flex-1 flex-col gap-3 px-4 pb-8 pt-4 md:flex-row md:gap-4 md:px-8 md:pb-12 md:pt-8">
        {/* Option A */}
        <motion.button
          type="button"
          onClick={() => onAnswer('a')}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden border border-foreground/10 bg-foreground/5 p-8 backdrop-blur-sm transition-all duration-500 hover:border-foreground/20 hover:bg-foreground/10 md:p-12"
        >
          {/* Subtle glow on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <span className="relative mb-4 font-display text-[10px] uppercase tracking-[0.5em] text-muted md:text-[11px]">
            A
          </span>
          <span className="relative font-display text-3xl font-light tracking-wide text-foreground md:text-4xl lg:text-5xl">
            {question.optionA.label}
          </span>
          <span className="relative mt-5 max-w-xs text-center font-display text-base font-light leading-relaxed text-muted md:text-lg">
            {question.optionA.description}
          </span>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-1/2 h-[1px] w-0 -translate-x-1/2 bg-foreground/30 transition-all duration-500 group-hover:w-2/3" />
        </motion.button>

        {/* Divider */}
        <div className="flex items-center justify-center md:flex-col">
          <div className="h-[1px] w-12 bg-border-subtle md:h-12 md:w-[1px]" />
          <span className="mx-3 font-display text-[9px] uppercase tracking-[0.5em] text-muted md:mx-0 md:my-3">
            veya
          </span>
          <div className="h-[1px] w-12 bg-border-subtle md:h-12 md:w-[1px]" />
        </div>

        {/* Option B */}
        <motion.button
          type="button"
          onClick={() => onAnswer('b')}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden border border-foreground/10 bg-foreground/5 p-8 backdrop-blur-sm transition-all duration-500 hover:border-foreground/20 hover:bg-foreground/10 md:p-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-foreground/5 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <span className="relative mb-4 font-display text-[10px] uppercase tracking-[0.5em] text-muted md:text-[11px]">
            B
          </span>
          <span className="relative font-display text-3xl font-light tracking-wide text-foreground md:text-4xl lg:text-5xl">
            {question.optionB.label}
          </span>
          <span className="relative mt-5 max-w-xs text-center font-display text-base font-light leading-relaxed text-muted md:text-lg">
            {question.optionB.description}
          </span>

          <div className="absolute bottom-0 left-1/2 h-[1px] w-0 -translate-x-1/2 bg-foreground/30 transition-all duration-500 group-hover:w-2/3" />
        </motion.button>
      </div>
    </motion.div>
  );
}
