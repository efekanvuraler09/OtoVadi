import { useState, type CSSProperties } from 'react';
import { BodyTypeIcon } from '../icons/BodyTypeIcons';

interface SmartImageProps {
  src?: string | null;
  alt: string;
  /**
   * CSS aspect-ratio değeri (ör. "16 / 10"). Kutu, görsel gelmeden önce yerini ayırır (CLS olmaz).
   * Verilmezse kutu ebeveynini doldurur (absolute inset-0); ebeveynin `relative` ve boyutlu olması gerekir.
   */
  aspectRatio?: string;
  fit?: 'cover' | 'contain';
  /** Görsel yoksa/kırıksa gösterilecek siluet (Vehicle['bodyType']) */
  bodyType?: string;
  /** Stüdyo gradyanına hafif renk tonu verir (Vehicle['media']['colorHex']) */
  colorHex?: string;
  /** Ekranın ilk görünen alanındaki görseller için: lazy yerine eager + yüksek öncelik */
  priority?: boolean;
  /** 'theme' temaya uyar; 'dark' her zaman koyu sahne (ör. AtmosphereStage) */
  tone?: 'theme' | 'dark';
  className?: string;
  imgClassName?: string;
  imgStyle?: CSSProperties;
  draggable?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

type Status = 'loading' | 'loaded' | 'error';

/** Göreli yolları köke bağlar; boş/geçersiz değerde null döner. */
function normalizeSrc(src?: string | null): string | null {
  const value = src?.trim();
  if (!value) return null;
  if (/^(https?:|data:|blob:)/i.test(value) || value.startsWith('/')) return value;
  return `/${value}`;
}

function hexToRgb(hex?: string): string | null {
  const match = hex?.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return null;
  const full = match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1];
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** Aracın rengiyle tonlanmış, temaya uyumlu stüdyo zemini (yükleme ve hata durumlarında görünür). */
function studioBackground(tone: 'theme' | 'dark', colorHex?: string): CSSProperties {
  const tint = hexToRgb(colorHex);
  const floor = tint ? `radial-gradient(ellipse 85% 45% at 50% 100%, rgb(${tint} / 0.22), transparent 70%),` : '';
  const base =
    tone === 'dark'
      ? 'radial-gradient(ellipse 70% 55% at 50% 40%, rgb(255 255 255 / 0.06), transparent 70%), linear-gradient(180deg, #161616 0%, #050505 100%)'
      : 'radial-gradient(ellipse 70% 55% at 50% 40%, rgb(var(--color-void)), transparent 70%), linear-gradient(180deg, rgb(var(--color-surface)) 0%, rgb(var(--color-surface-elevated)) 100%)';
  return { backgroundImage: `${floor}${base}` };
}

/**
 * Tüm araç/editoryal görselleri için tek bileşen (K11):
 * sabit oranlı kutu → yüklenirken shimmer → yumuşak belirme; görsel yok/kırıksa gövde tipine uygun siluet + stüdyo gradyanı.
 * Asla sonsuz boş alan veya tarayıcının kırık görsel ikonu görünmez.
 */
export function SmartImage({
  src,
  alt,
  aspectRatio,
  fit = 'cover',
  bodyType,
  colorHex,
  priority = false,
  tone = 'theme',
  className = '',
  imgClassName = '',
  imgStyle,
  draggable,
  onLoad,
  onError,
}: SmartImageProps) {
  const resolved = normalizeSrc(src);
  // Durum src'ye bağlı tutulur: src değişince ek effect gerekmeden "loading"e döner
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const status: Status =
    !resolved || failedSrc === resolved ? 'error' : loadedSrc === resolved ? 'loaded' : 'loading';

  const boxClass = aspectRatio ? 'relative w-full' : 'absolute inset-0 h-full w-full';
  const silhouetteColor = tone === 'dark' ? 'text-white/20' : 'text-foreground/20';

  return (
    <div
      className={`${boxClass} overflow-hidden ${className}`}
      style={{ ...(aspectRatio ? { aspectRatio } : null), ...studioBackground(tone, colorHex) }}
      {...(status === 'error' ? { role: 'img', 'aria-label': alt } : null)}
    >
      {status === 'loading' && (
        <div
          className="shimmer absolute inset-0"
          // Koyu sahnede açık temanın gri zemini görünmesin
          style={tone === 'dark' ? { backgroundColor: 'rgb(255 255 255 / 0.04)' } : undefined}
          aria-hidden
        />
      )}

      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
          <BodyTypeIcon bodyType={bodyType} className={`w-[42%] max-w-[16rem] ${silhouetteColor}`} />
        </div>
      )}

      {resolved && status !== 'error' && (
        <img
          key={resolved}
          src={resolved}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          draggable={draggable}
          onLoad={() => {
            setLoadedSrc(resolved);
            onLoad?.();
          }}
          onError={() => {
            setFailedSrc(resolved);
            onError?.();
          }}
          className={`absolute inset-0 h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition-[opacity,transform] duration-350 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
          style={imgStyle}
        />
      )}
    </div>
  );
}
