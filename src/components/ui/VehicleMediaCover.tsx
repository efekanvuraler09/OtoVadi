import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface VehicleMediaCoverProps {
  src: string;
  alt: string;
  colorHex: string;
  className?: string;
}

/** Görsel yoksa veya yüklenemezse fallback gösterir */
export function VehicleMediaCover({
  src,
  alt,
  colorHex,
  className = 'absolute inset-0 h-full w-full object-cover',
}: VehicleMediaCoverProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  // Ensure local paths are absolute from root for Vercel
  const safeSrc = src?.startsWith('http') || src?.startsWith('/') ? src : `/${src}`;
  
  // Modern browsers handle CORS natively for basic <img> display.
  // We no longer use wsrv.nl proxy as it actively blocks/fails on many Wikipedia/Unsplash links.
  const currentSrc = safeSrc;

  return (
    <>
      <div
        className="absolute inset-0 flex items-center justify-center transition-colors"
        style={{ backgroundColor: failed ? 'var(--color-surface, #1f2937)' : colorHex }}
        aria-hidden
      >
        {failed && (
          <div className="flex flex-col items-center gap-2 text-muted opacity-50">
            <ImageIcon className="size-8" />
            <span className="text-[10px] uppercase tracking-widest font-sans">Görsel Bulunamadı</span>
          </div>
        )}
      </div>
      
      {!failed && currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          loading="lazy"
          decoding="async"
        />
      )}
    </>
  );
}
