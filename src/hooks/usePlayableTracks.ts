import { useEffect, useState } from 'react';
import type { AudioTrack } from '../types/vehicle';

/** Oturum boyunca aynı dosyayı tekrar yoklamamak için */
const probeCache = new Map<string, Promise<boolean>>();
const PROBE_TIMEOUT_MS = 8000;

/**
 * Dosyanın tarayıcıda gerçekten çalınabilir bir ses olup olmadığını yalnızca metadata indirerek kontrol eder.
 * Not: Vercel'deki SPA rewrite olmayan dosyalar için index.html (200) döndürür; bu yüzden HTTP durum kodu yetmez,
 * <audio> elemanının dosyayı çözebilmesi gerekir.
 */
function probeAudio(src: string): Promise<boolean> {
  const cached = probeCache.get(src);
  if (cached) return cached;

  const result = new Promise<boolean>((resolve) => {
    const audio = new Audio();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      audio.removeAttribute('src');
      audio.load();
      resolve(ok);
    };
    const timer = window.setTimeout(() => finish(false), PROBE_TIMEOUT_MS);
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', () => finish(true), { once: true });
    audio.addEventListener('error', () => finish(false), { once: true });
    audio.src = src;
  });

  probeCache.set(src, result);
  return result;
}

/**
 * Aracın ses kayıtlarından gerçekten çalınabilenleri döndürür (K11).
 * Kontrol sürerken `checking: true`; hiç geçerli kayıt yoksa `playable` boştur → Ses sekmesi hiç gösterilmez.
 */
export function usePlayableTracks(tracks: (AudioTrack | null | undefined)[]) {
  const candidates = tracks.filter((track): track is AudioTrack => Boolean(track?.src?.trim()));
  const key = candidates.map((track) => track.src.trim()).join('|');
  const [result, setResult] = useState<{ key: string; srcs: string[] } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const srcs = key.split('|');
    void Promise.all(srcs.map(probeAudio)).then((oks) => {
      if (!cancelled) setResult({ key, srcs: srcs.filter((_, i) => oks[i]) });
    });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!key) return { checking: false, playable: [] as AudioTrack[] };
  if (result?.key !== key) return { checking: true, playable: [] as AudioTrack[] };
  return { checking: false, playable: candidates.filter((track) => result.srcs.includes(track.src.trim())) };
}
