import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dna, RotateCcw } from 'lucide-react';
import { QuestionCard } from '../components/soultwin/QuestionCard';
import { DNARadar } from '../components/soultwin/DNARadar';
import { VehicleReveal } from '../components/soultwin/VehicleReveal';
import {
  DNA_QUESTIONS,
  calculateDNA,
  findSoulTwin,
  type DriverDNA,
  type MatchResult,
} from '../utils/dnaEngine';
import { useVehicleStore } from '../store/useVehicleStore';
import { useI18n } from '../i18n/useI18n';

type Stage = 'intro' | 'quiz' | 'result';

export function SoulTwinPage() {
  const { t } = useI18n();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const [stage, setStage] = useState<Stage>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<('a' | 'b')[]>([]);
  const [dna, setDna] = useState<DriverDNA | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);

  const handleStart = useCallback(() => {
    setStage('quiz');
    setCurrentQuestion(0);
    setAnswers([]);
    setDna(null);
    setMatch(null);
  }, []);

  const handleAnswer = useCallback(
    (choice: 'a' | 'b') => {
      const newAnswers = [...answers, choice];
      setAnswers(newAnswers);

      if (newAnswers.length >= DNA_QUESTIONS.length) {
        // Calculate DNA and find match
        const userDNA = calculateDNA(newAnswers);
        const result = findSoulTwin(userDNA, vehicles);
        setDna(userDNA);
        setMatch(result);
        setStage('result');
      } else {
        setCurrentQuestion((prev) => prev + 1);
      }
    },
    [answers, vehicles],
  );

  const handleRestart = useCallback(() => {
    handleStart();
  }, [handleStart]);

  return (
    <div className="min-h-dvh bg-void">
      <AnimatePresence mode="wait">
        {/* ════════════════ INTRO SCREEN ════════════════ */}
        {stage === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-dvh flex-col items-center justify-center px-6"
          >
            {/* Ambient background glow */}
            <div
              className="pointer-events-none fixed inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 50% 40% at 50% 50%, rgba(255,255,255,0.02), transparent 70%)',
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
              className="relative flex flex-col items-center gap-6 text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
                className="flex size-16 items-center justify-center border border-foreground/10 bg-foreground/5"
              >
                <Dna className="size-7 text-muted" strokeWidth={1} />
              </motion.div>

              <h1 className="font-display text-4xl font-light tracking-wide text-foreground md:text-5xl lg:text-6xl">
                {t.soulTwin.findSoulTwin}
              </h1>

              <p className="max-w-md font-display text-xl font-light leading-[1.6] text-muted md:text-2xl">
                {t.soulTwin.introDesc1}
                <br />
                {t.soulTwin.introDesc2}
              </p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-4 font-display text-[10px] md:text-[11px] uppercase tracking-[0.5em] font-light text-muted"
              >
                {t.soulTwin.introDesc3}
              </motion.p>

              <motion.button
                type="button"
                onClick={handleStart}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="mt-8 border border-border-subtle/50 dark:border-foreground/15 bg-foreground/5 px-10 py-4 font-display text-[10px] md:text-[11px] uppercase tracking-[0.4em] text-foreground/70 dark:text-foreground/70 transition-all duration-300 hover:border-foreground/30 hover:bg-foreground/10 hover:text-foreground"
              >
                {t.soulTwin.startTest}
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* ════════════════ QUIZ SCREEN ════════════════ */}
        {stage === 'quiz' && DNA_QUESTIONS[currentQuestion] && (
          <QuestionCard
            key={`q-${currentQuestion}`}
            question={DNA_QUESTIONS[currentQuestion]}
            currentStep={currentQuestion}
            totalSteps={DNA_QUESTIONS.length}
            onAnswer={handleAnswer}
          />
        )}

        {/* ════════════════ RESULT SCREEN ════════════════ */}
        {stage === 'result' && dna && match && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="flex min-h-dvh flex-col items-center justify-center gap-12 px-6 py-20 md:gap-16"
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none fixed inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,255,255,0.02), transparent 70%)',
              }}
            />

            {/* DNA Profile */}
            <DNARadar dna={dna} />

            {/* Divider */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 100, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="h-px bg-border-subtle"
            />

            {/* Soul Twin Reveal */}
            <VehicleReveal match={match} />

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              className="flex items-center gap-6"
            >
              <button
                type="button"
                onClick={handleRestart}
                className="group flex items-center gap-2 font-display text-[10px] uppercase tracking-[0.4em] text-muted transition-colors hover:text-foreground md:text-[11px]"
              >
                <RotateCcw className="size-4 transition-transform group-hover:-rotate-90" />
                <span>{t.soulTwin.retakeTest}</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
