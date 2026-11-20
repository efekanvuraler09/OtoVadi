import { useState, useCallback, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { Dna, RotateCcw } from 'lucide-react';
import { QuestionCard } from '../components/soultwin/QuestionCard';
import { SoulRadar } from '../components/soultwin/SoulRadar';
import { StoryCardActions } from '../components/soultwin/StoryCardActions';
import { buildRadarContext, userRadar, vehicleRadar } from '../lib/radarProfile';
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
import { TRANSITION, fadeUp } from '../lib/motion';

import { usePageMeta } from '../hooks/usePageMeta';
/** Temaya uyumlu çok hafif ortam ışığı (eskiden sabit beyaz rgba: açık temada görünmüyordu) */
const ambientGlow = (y: number) =>
  `radial-gradient(ellipse 55% 45% at 50% ${y}%, rgb(var(--color-foreground) / 0.035), transparent 70%)`;

type Stage = 'intro' | 'quiz' | 'result';

export function SoulTwinPage() {
  usePageMeta({
    title: 'Ruh İkizi',
    description: 'Birkaç kısa soruyla sürüş karakterinizi çıkarın, size en çok benzeyen aracı bulun.',
  });
  const { t } = useI18n();
  const vehicles = useVehicleStore((s) => s.vehicles);
  const isLoading = useVehicleStore((s) => s.isLoading);
  const loadError = useVehicleStore((s) => s.loadError);
  const retryLoad = useVehicleStore((s) => s.retryLoad);
  // Eşleştirme için en az bir araç gerekir (findSoulTwin boş listede hata fırlatır)
  const isReady = vehicles.length > 0;
  const [stage, setStage] = useState<Stage>('intro');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<('a' | 'b')[]>([]);
  const [dna, setDna] = useState<DriverDNA | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);

  // U11: radar eksenleri (araç = teknik veri / katalog, kullanıcı = cevaplar); deterministik
  const radar = useMemo(() => {
    if (!dna || !match) return null;
    return { vehicle: vehicleRadar(match.vehicle, buildRadarContext(vehicles)), user: userRadar(dna) };
  }, [dna, match, vehicles]);

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
        // Savunma: test sırasında araç listesi boşalmışsa çökmeden girişe dön
        if (vehicles.length === 0) {
          setStage('intro');
          return;
        }
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
          <m.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION.base}
            className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center px-4 py-16 md:px-8"
          >
            {/* Ambient background glow */}
            <div
              className="pointer-events-none fixed inset-0"
              style={{ background: ambientGlow(50) }}
            />

            <m.div
              {...fadeUp}
              transition={{ ...TRANSITION.slow, delay: 0.05 }}
              className="relative flex flex-col items-center gap-6 text-center"
            >
              {/* Icon */}
              <m.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...TRANSITION.base, delay: 0.1 }}
                className="flex size-16 items-center justify-center border border-border-subtle bg-surface"
              >
                <Dna className="size-7 text-muted" strokeWidth={1} />
              </m.div>

              <h1 className="text-display-lg font-normal text-foreground">
                {t.soulTwin.findSoulTwin}
              </h1>

              <p className="max-w-md text-xl font-light leading-relaxed text-secondary md:text-2xl">
                {t.soulTwin.introDesc1}
                <br />
                {t.soulTwin.introDesc2}
              </p>

              <m.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...TRANSITION.base, delay: 0.2 }}
                className="eyebrow mt-4"
              >
                {t.soulTwin.introDesc3}
              </m.p>

              <m.button
                type="button"
                onClick={handleStart}
                disabled={!isReady}
                {...fadeUp}
                transition={{ ...TRANSITION.base, delay: 0.25 }}
                whileTap={isReady ? { scale: 0.98 } : undefined}
                className="mt-8 inline-flex min-h-12 items-center justify-center bg-foreground px-10 text-xs font-semibold uppercase tracking-eyebrow text-void transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isReady ? t.soulTwin.startTest : isLoading ? 'Araçlar yükleniyor...' : 'Araç bulunamadı'}
              </m.button>

              {!isReady && loadError && (
                <p className="text-xs text-muted">
                  Araç verileri yüklenemedi.{' '}
                  <button type="button" onClick={retryLoad} className="underline underline-offset-4 hover:text-foreground">
                    Tekrar dene
                  </button>
                </p>
              )}
            </m.div>
          </m.div>
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
        {stage === 'result' && dna && match && radar && (
          <m.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={TRANSITION.slow}
            className="flex min-h-[calc(100svh-4rem)] flex-col items-center justify-center gap-12 px-4 py-16 md:gap-16 md:px-8"
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none fixed inset-0"
              style={{ background: ambientGlow(40) }}
            />

            {/* Soul Twin Reveal */}
            <VehicleReveal match={match} />

            {/* Divider */}
            <m.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 100, opacity: 1 }}
              transition={{ ...TRANSITION.slow, delay: 0.3 }}
              className="h-px bg-border-subtle"
            />

            {/* U11: 5 eksenli uyum radarı */}
            <SoulRadar vehicle={radar.vehicle} user={radar.user} />

            {/* Y3: 9:16 Story kartı */}
            <StoryCardActions
              vehicle={match.vehicle}
              affinityPercent={Math.round(match.affinity * 100)}
              vehicleProfile={radar.vehicle}
              userProfile={radar.user}
            />

            {/* Actions */}
            <m.div
              {...fadeUp}
              transition={{ ...TRANSITION.base, delay: 0.6 }}
              className="flex items-center gap-6"
            >
              <button
                type="button"
                onClick={handleRestart}
                className="group inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-eyebrow text-muted transition-colors hover:text-foreground"
              >
                <RotateCcw className="size-4 transition-transform group-hover:-rotate-90" />
                <span>{t.soulTwin.retakeTest}</span>
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
