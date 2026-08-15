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
      className="flex min-h-dvh flex-col bg-black"
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
                  ? 'w-6 bg-white/70'
                  : i === currentStep
                    ? 'w-8 bg-white'
                    : 'w-4 bg-white/20'
              }`}
            />
          ))}
        </div>

        <p className="font-sans text-[10px] uppercase tracking-[0.35em] text-white/30">
          {currentStep + 1} / {totalSteps}
        </p>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: 'easeOut' }}
          className="max-w-xl text-center font-display text-2xl font-light leading-relaxed tracking-wide text-white/90 md:text-3xl lg:text-4xl"
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
          className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm transition-all duration-500 hover:border-white/15 hover:bg-white/[0.06] md:p-12"
        >
          {/* Subtle glow on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <span className="relative mb-4 font-sans text-[10px] uppercase tracking-[0.4em] text-white/25">
            A
          </span>
          <span className="relative font-display text-3xl font-light tracking-wide text-white/90 md:text-4xl lg:text-5xl">
            {question.optionA.label}
          </span>
          <span className="relative mt-4 max-w-xs text-center font-sans text-sm font-light leading-relaxed text-white/40 md:text-base">
            {question.optionA.description}
          </span>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-1/2 h-[1px] w-0 -translate-x-1/2 bg-white/30 transition-all duration-500 group-hover:w-2/3" />
        </motion.button>

        {/* Divider */}
        <div className="flex items-center justify-center md:flex-col">
          <div className="h-[1px] w-12 bg-white/10 md:h-12 md:w-[1px]" />
          <span className="mx-3 font-sans text-[9px] uppercase tracking-[0.3em] text-white/15 md:mx-0 md:my-3">
            veya
          </span>
          <div className="h-[1px] w-12 bg-white/10 md:h-12 md:w-[1px]" />
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
          className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm transition-all duration-500 hover:border-white/15 hover:bg-white/[0.06] md:p-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-white/[0.04] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          <span className="relative mb-4 font-sans text-[10px] uppercase tracking-[0.4em] text-white/25">
            B
          </span>
          <span className="relative font-display text-3xl font-light tracking-wide text-white/90 md:text-4xl lg:text-5xl">
            {question.optionB.label}
          </span>
          <span className="relative mt-4 max-w-xs text-center font-sans text-sm font-light leading-relaxed text-white/40 md:text-base">
            {question.optionB.description}
          </span>

          <div className="absolute bottom-0 left-1/2 h-[1px] w-0 -translate-x-1/2 bg-white/30 transition-all duration-500 group-hover:w-2/3" />
        </motion.button>
      </div>
    </motion.div>
  );
}
