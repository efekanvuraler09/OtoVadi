import { useCallback, useEffect, useRef, useState } from 'react';
import { m } from 'framer-motion';
import { AlertCircle, Pause, Play } from 'lucide-react';
import type { AudioTrack } from '../../types/vehicle';
import { useAudioStore } from '../../store/useAudioStore';

interface AudioPlayerProps {
  track: AudioTrack;
  compact?: boolean;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Tek bir ses kaydı oynatıcısı. Detay sayfası yalnızca usePlayableTracks ile doğrulanmış kayıtları gönderir;
 * yine de oynatma sırasında hata olursa kullanıcıya sade bir mesaj gösterilir (geliştirici yolu/dosya adı gösterilmez).
 */
export function AudioPlayer({ track, compact = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.durationSeconds);
  const [unavailable, setUnavailable] = useState(false);

  const activeTrackId = useAudioStore((s) => s.activeTrackId);
  const setActiveTrack = useAudioStore((s) => s.setActiveTrack);

  const isActive = activeTrackId === track.id;

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
    <div className={`border-b border-border-subtle ${compact ? 'pb-4' : 'pb-6'}`}>
      <audio ref={audioRef} src={track.src} preload="metadata" />

      <div className="flex items-start gap-4">
        <m.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={togglePlay}
          disabled={unavailable}
          aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
          className={`flex shrink-0 items-center justify-center bg-foreground text-void transition-colors hover:bg-foreground/90 disabled:opacity-40 ${
            compact ? 'size-12' : 'size-14'
          }`}
        >
          {isPlaying ? (
            <Pause className={compact ? 'size-5' : 'size-6'} fill="currentColor" aria-hidden />
          ) : (
            <Play className={`${compact ? 'size-5' : 'size-6'} ml-0.5`} fill="currentColor" aria-hidden />
          )}
        </m.button>

        <div className="min-w-0 flex-1">
          <h4 className={`font-display font-normal text-foreground ${compact ? 'text-lg' : 'text-xl md:text-2xl'}`}>
            {track.label}
          </h4>
          {!compact && track.description && <p className="mt-1 text-sm text-secondary md:text-base">{track.description}</p>}

          {unavailable ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-warning">
              <AlertCircle className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
              Bu kayıt şu an oynatılamıyor.
            </p>
          ) : (
            <>
              <div
                role="slider"
                aria-label={`${track.label} ilerleme`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress)}
                tabIndex={0}
                onClick={handleSeek}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight' && audioRef.current) {
                    audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 2);
                  }
                }}
                className="mt-3 h-1.5 cursor-pointer overflow-hidden rounded-full bg-foreground/10"
              >
                <div className="h-full rounded-full bg-foreground transition-[width] duration-200" style={{ width: `${progress}%` }} />
              </div>
              <div className="mt-1.5 flex justify-between text-2xs tabular-nums text-muted">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {isPlaying && !unavailable && (
        <p className="mt-3 flex items-center gap-2 text-2xs font-medium uppercase tracking-eyebrow text-foreground">
          <span className="size-1.5 rounded-full bg-foreground motion-safe:animate-pulse" aria-hidden />
          Dinleniyor…
        </p>
      )}
    </div>
  );
}
