import { useState } from 'react';

interface VehicleMediaCoverProps {
  src: string;
  alt: string;
  colorHex: string;
  className?: string;
}

/** Görsel yoksa veya yüklenemezse colorHex gradient'e düşer */
export function VehicleMediaCover({
  src,
  alt,
  colorHex,
  className = 'absolute inset-0 h-full w-full object-cover',
}: VehicleMediaCoverProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const showImage = !failed;

  return (
    <>
      <div
        className="absolute inset-0"
        style={{ backgroundColor: colorHex }}
        aria-hidden
      />
      {showImage && (
        <img
          src={src}
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
