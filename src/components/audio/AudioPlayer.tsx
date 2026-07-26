import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, Pause, Play } from 'lucide-react';
import type { AudioTrack } from '../../types/vehicle';
import { useAudioStore } from '../../store/useAudioStore';

interface AudioPlayerProps {
  track: AudioTrack;
  accentColor: 'blue' | 'red';
  compact?: boolean;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ track, accentColor, compact = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.durationSeconds);
  const [unavailable, setUnavailable] = useState(false);

  const activeTrackId = useAudioStore((s) => s.activeTrackId);
  const setActiveTrack = useAudioStore((s) => s.setActiveTrack);

  const isActive = activeTrackId === track.id;
  const accentBg = accentColor === 'red' ? 'bg-accent-red' : 'bg-accent';
  const accentText = accentColor === 'red' ? 'text-accent-red' : 'text-accent';
  const accentRing = accentColor === 'red' ? 'ring-accent-red/50' : 'ring-accent/50';

  const stopPlayback = useCallback(() => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    if (!isActive && isPlaying) {
      stopPlayback();
    }
  }, [isActive, isPlaying, stopPlayback]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime);
      setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
    };
    const onLoadedMetadata = () => {
      if (el.duration && !Number.isNaN(el.duration)) {
        setDuration(el.duration);
      }
    };
    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setActiveTrack(null);
    };
    const onError = () => {
      setUnavailable(true);
      setIsPlaying(false);
    };

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [setActiveTrack]);

  const togglePlay = async () => {
    if (unavailable) return;

    const el = audioRef.current;
    if (!el) return;

    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
      setActiveTrack(null);
      return;
    }

    setActiveTrack(track.id);
    try {
      await el.play();
      setIsPlaying(true);
    } catch {
      setUnavailable(true);
      setIsPlaying(false);
      setActiveTrack(null);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el || unavailable || !el.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * el.duration;
    setProgress(ratio * 100);
    setCurrentTime(el.currentTime);
  };

  return (
    <div
      className={`glass-panel rounded-2xl ${compact ? 'p-3' : 'p-4 md:p-5'}`}
    >
      <audio ref={audioRef} src={track.src} preload="metadata" />

      <div className="flex items-start gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={togglePlay}
          disabled={unavailable}
          aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
          className={`flex shrink-0 items-center justify-center rounded-2xl text-white ring-2 ring-offset-2 ring-offset-transparent ${accentBg} ${accentRing} ${
            compact ? 'size-12' : 'size-14 min-h-[56px] min-w-[56px]'
          } disabled:opacity-50`}
        >
          {isPlaying ? (
            <Pause className={compact ? 'size-5' : 'size-6'} fill="currentColor" />
          ) : (
            <Play className={`${compact ? 'size-5' : 'size-6'} ml-0.5`} fill="currentColor" />
          )}
        </motion.button>

        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-foreground ${compact ? 'text-sm' : 'text-base'}`}>
            {track.label}
          </p>
          {!compact && (
            <p className="mt-0.5 text-xs leading-relaxed text-muted line-clamp-2">
              {track.description}
            </p>
          )}

          {unavailable ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400/90">
              <AlertCircle className="size-3.5 shrink-0" />
              <span>
                Ses dosyası henüz yüklenmedi — <code className="text-[10px]">public/audio</code>
              </span>
            </div>
          ) : (
            <>
              <div
                role="slider"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                tabIndex={0}
                onClick={handleSeek}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' && audioRef.current) {
                    audioRef.current.currentTime = Math.min(
                      audioRef.current.duration,
                      audioRef.current.currentTime + 2,
                    );
                  }
                }}
                className="mt-3 h-2 cursor-pointer overflow-hidden rounded-full bg-white/10"
              >
                <motion.div
                  className={`h-full rounded-full ${accentBg}`}
                  style={{ width: `${progress}%` }}
                  layout
                />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-muted">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {isPlaying && !unavailable && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-3 flex items-center gap-2 text-[10px] font-medium ${accentText}`}
        >
          <span className="relative flex size-2">
            <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${accentBg}`} />
            <span className={`relative inline-flex size-2 rounded-full ${accentBg}`} />
          </span>
          Dinleniyor…
        </motion.div>
      )}
    </div>
  );
}
