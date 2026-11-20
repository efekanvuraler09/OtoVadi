import { motion } from 'framer-motion';
import type { DNAQuestion } from '../../utils/dnaEngine';
import { useI18n } from '../../i18n/useI18n';
import { TRANSITION } from '../../lib/motion';

interface QuestionCardProps {
  question: DNAQuestion;
  currentStep: number;
  totalSteps: number;
  onAnswer: (choice: 'a' | 'b') => void;
}

export function QuestionCard({ question, currentStep, totalSteps, onAnswer }: QuestionCardProps) {
  const { t } = useI18n();
  const qData = t.soulTwin.questions[currentStep];

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={TRANSITION.base}
      className="flex min-h-[calc(100svh-4rem)] flex-col bg-void"
    >
      {/* ── Progress & Question Prompt ── */}
      <div className="relative z-10 flex flex-col items-center gap-4 px-4 pb-4 pt-10 md:px-8 md:pt-14">
        {/* Step Dots */}
        <div className="flex items-center gap-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-[3px] transition-all duration-500 rounded-full ${
                i < currentStep
                  ? 'w-8 bg-foreground'
                  : i === currentStep
                    ? 'w-12 bg-foreground'
                    : 'w-4 bg-foreground/30 dark:bg-foreground/20'
              }`}
            />
          ))}
        </div>

        <p className="eyebrow tabular-nums">
          {currentStep + 1} / {totalSteps}
        </p>

        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...TRANSITION.base, delay: 0.05 }}
          className="max-w-2xl text-balance text-center text-display-sm font-light text-foreground"
        >
          {qData.prompt}
        </motion.h2>
      </div>

      {/* ── Split Screen Options ── */}
      <div className="relative z-10 flex flex-1 flex-col gap-3 px-4 pb-8 pt-4 md:flex-row md:gap-4 md:px-8 md:pb-12 md:pt-8">
        {/* Option A */}
        <motion.button
          type="button"
          onClick={() => onAnswer('a')}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...TRANSITION.base, delay: 0.1 }}
          whileTap={{ scale: 0.985 }}
          className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden border border-border-subtle bg-surface p-8 transition-colors duration-350 hover:border-foreground md:p-12"
        >
          {/* Subtle glow on hover */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-foreground/5 via-transparent to-transparent opacity-0 transition-opacity duration-350 group-hover:opacity-100" />

          <span className="eyebrow relative mb-4">
            A
          </span>
          <span className="relative text-display-md font-light text-foreground">
            {qData.optionA.label}
          </span>
          <span className="relative mt-4 max-w-xs text-center text-base leading-relaxed text-secondary">
            {qData.optionA.desc}
          </span>

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-1/2 h-[1px] w-0 -translate-x-1/2 bg-foreground/30 transition-all duration-350 group-hover:w-2/3" />
        </motion.button>

        {/* Divider */}
        <div className="flex items-center justify-center md:flex-col">
          <div className="h-[1px] w-12 bg-border-subtle md:h-12 md:w-[1px]" />
          <span className="eyebrow mx-3 md:mx-0 md:my-3">
            {t.soulTwin.or}
          </span>
          <div className="h-[1px] w-12 bg-border-subtle md:h-12 md:w-[1px]" />
        </div>

        {/* Option B */}
        <motion.button
          type="button"
          onClick={() => onAnswer('b')}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...TRANSITION.base, delay: 0.1 }}
          whileTap={{ scale: 0.985 }}
          className="group relative flex flex-1 flex-col items-center justify-center overflow-hidden border border-border-subtle bg-surface p-8 transition-colors duration-350 hover:border-foreground md:p-12"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-foreground/5 via-transparent to-transparent opacity-0 transition-opacity duration-350 group-hover:opacity-100" />

          <span className="eyebrow relative mb-4">
            B
          </span>
          <span className="relative text-display-md font-light text-foreground">
            {qData.optionB.label}
          </span>
          <span className="relative mt-4 max-w-xs text-center text-base leading-relaxed text-secondary">
            {qData.optionB.desc}
          </span>

          <div className="absolute bottom-0 left-1/2 h-[1px] w-0 -translate-x-1/2 bg-foreground/30 transition-all duration-350 group-hover:w-2/3" />
        </motion.button>
      </div>
    </motion.div>
  );
}
