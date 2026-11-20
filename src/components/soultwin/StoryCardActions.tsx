import { useMemo, useRef, useState } from 'react';
import { Download, Share2 } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import type { RadarProfile } from '../../lib/radarProfile';
import { useI18n } from '../../i18n/useI18n';
import { primaryButtonClass, secondaryButtonClass } from '../ui/buttonStyles';

interface StoryCardActionsProps {
  vehicle: Vehicle;
  affinityPercent: number;
  vehicleProfile: RadarProfile;
  userProfile: RadarProfile;
}

type Status = 'idle' | 'working' | 'downloaded' | 'shared' | 'ready' | 'error';

/** Paylaşım menüsü dosya kabul ediyor mu (mobil Safari/Chrome, Windows Edge vb.) */
function supportsFileShare(): boolean {
  try {
    if (typeof navigator.share !== 'function' || typeof navigator.canShare !== 'function') return false;
    return navigator.canShare({ files: [new File([new Uint8Array(1)], 'test.png', { type: 'image/png' })] });
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Y3 — "Story Kartı İndir" ve (destekleniyorsa) "Paylaş". Kart tuvali lib/storyCard.ts'te çizilir ve
 * yalnızca tıklanınca dinamik import edilir. Durum mesajları satır içi (aria-live), alert yok.
 */
export function StoryCardActions({ vehicle, affinityPercent, vehicleProfile, userProfile }: StoryCardActionsProps) {
  const { t, locale } = useI18n();
  const copy = t.soulTwin;
  const [status, setStatus] = useState<Status>('idle');
  const [photoSkipped, setPhotoSkipped] = useState(false);
  const canShare = useMemo(() => supportsFileShare(), []);
  const filename = `otovadi-ruh-ikizi-${vehicle.slug || vehicle.id}.png`;
  // Üretilen kart saklanır: ikinci tıklamada (ör. Safari'nin paylaşım için istediği taze dokunuş) anında kullanılır
  const cache = useRef<Promise<{ blob: Blob; withPhoto: boolean }> | null>(null);

  const generate = async () => {
    if (cache.current) return cache.current;
    const { createSoulTwinStory } = await import('../../lib/storyCard');
    cache.current = createSoulTwinStory({
      vehicle,
      affinityPercent,
      vehicleProfile,
      userProfile,
      axisLabels: copy.radarAxes,
      locale,
    });
    cache.current.catch(() => {
      cache.current = null;
    });
    return cache.current;
  };

  const run = async (mode: 'download' | 'share') => {
    if (status === 'working') return;
    setStatus('working');
    try {
      const { blob, withPhoto } = await generate();
      setPhotoSkipped(!withPhoto);

      if (mode === 'share') {
        const file = new File([blob], filename, { type: 'image/png' });
        try {
          await navigator.share({ files: [file], title: 'OtoVadi · Ruh İkizi', text: `Ruh ikizim: ${vehicle.brand} ${vehicle.model}`.replace(/\s+/g, ' ').trim() });
          setStatus('shared');
          return;
        } catch (error) {
          // Kullanıcı paylaşımı iptal ettiyse sessizce bekleme durumuna dön; diğer hatalarda indirmeye düş
          if (error instanceof DOMException && error.name === 'AbortError') {
            setStatus('idle');
            return;
          }
          // Kart üretimi uzun sürdüyse tarayıcı dokunuşu "eskimiş" sayar: kart hazır, ikinci dokunuş anında paylaşır
          if (error instanceof DOMException && error.name === 'NotAllowedError') {
            setStatus('ready');
            return;
          }
        }
      }

      downloadBlob(blob, filename);
      setStatus('downloaded');
    } catch {
      setStatus('error');
    }
  };

  const message =
    status === 'working'
      ? copy.storyWorking
      : status === 'error'
        ? copy.storyError
        : status === 'ready'
          ? copy.storyTapAgain
          : status === 'downloaded' || status === 'shared'
          ? `${status === 'shared' ? copy.storyShared : copy.storyDone}${photoSkipped ? ` ${copy.storyNoPhoto}` : ''}`
          : '';

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-3">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => run('download')}
          disabled={status === 'working'}
          className={primaryButtonClass}
          aria-busy={status === 'working'}
        >
          <Download className="size-4" strokeWidth={1.5} aria-hidden />
          {copy.storyDownload}
        </button>
        {canShare && (
          <button type="button" onClick={() => run('share')} disabled={status === 'working'} className={secondaryButtonClass}>
            <Share2 className="size-4" strokeWidth={1.5} aria-hidden />
            {copy.storyShare}
          </button>
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        className={`min-h-5 text-center text-xs leading-relaxed ${status === 'error' ? 'text-danger' : 'text-muted'}`}
      >
        {message}
      </p>
    </div>
  );
}
