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

type Stage = 'intro' | 'quiz' | 'result';

export function SoulTwinPage() {
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
    <div className="min-h-dvh bg-black">
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
                className="flex size-16 items-center justify-center border border-white/[0.08] bg-white/[0.02]"
              >
                <Dna className="size-7 text-white/40" strokeWidth={1} />
              </motion.div>

              <h1 className="font-display text-4xl font-light tracking-wide text-white/90 md:text-5xl lg:text-6xl">
                Ruh İkizini Bul
              </h1>

              <p className="max-w-md font-sans text-base font-light leading-relaxed text-white/35 md:text-lg">
                Teknik özellikler bir aracı tanımlar.
                <br />
                Ama sizi tanımlayan ne?
              </p>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
                className="mt-2 font-sans text-xs font-light text-white/20"
              >
                5 soruyla otomotiv DNA'nızı keşfedin
              </motion.p>

              <motion.button
                type="button"
                onClick={handleStart}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="mt-6 border border-white/15 bg-white/[0.03] px-10 py-4 font-sans text-xs uppercase tracking-[0.25em] text-white/70 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
              >
                Başla
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
              animate={{ width: '6rem', opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.8, ease: 'easeOut' }}
              className="h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />

            {/* Vehicle Reveal */}
            <VehicleReveal match={match} />

            {/* Restart */}
            <motion.button
              type="button"
              onClick={handleRestart}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0, duration: 0.5 }}
              className="flex items-center gap-2.5 font-sans text-[10px] uppercase tracking-[0.3em] text-white/25 transition-colors duration-300 hover:text-white/50"
            >
              <RotateCcw className="size-3.5" strokeWidth={1.5} />
              <span>Testi Tekrarla</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
