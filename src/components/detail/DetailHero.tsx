import { useRef, useState, type PointerEvent } from 'react';
import { m } from 'framer-motion';
import { ArrowLeft, Bookmark, FileText, Images } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { SmartImage } from '../ui/SmartImage';
import { formatVehiclePrice } from '../../utils/formatPrice';
import { cleanText, vehicleBrand, vehicleModel, vehicleName } from '../../utils/vehicleText';
import { useBackNavigation } from '../../hooks/useBackNavigation';
import { useGarageToggle } from '../../hooks/useGarageToggle';
import { isImageLoaded } from '../../lib/imageCache';
import { VT_MEDIA, VT_TITLE } from '../../lib/viewTransition';

interface DetailHeroProps {
  vehicle: Vehicle;
  /** Giriş kontrolü dahil test sürüşü akışını başlatır (VehicleDetailPage sağlar) */
  onOpenTestDrive?: () => void;
  /** Tam ekran galeriyi açar (U4); verilmezse görsel tıklanamaz */
  onOpenGallery?: () => void;
  /** Galerideki görsel sayısı (butonda gösterilir) */
  imageCount?: number;
  /** A4 "Teknik Künye" broşürünü yazdırır (1.2) */
  onPrintBrochure?: () => void;
  /**
   * 1.4 — Perde açılışı. Kart → detay View Transition'ıyla gelindiyse false: görsel zaten kartan büyüyerek yerine
   * oturduğu için ikinci bir açılış oynatılmaz (yavaş kamera yakınlaşması yine çalışır).
   */
  curtain?: boolean;
}

const overlayButtonClass =
  'flex size-11 items-center justify-center border border-border-subtle bg-void/70 text-foreground backdrop-blur-sm transition-colors hover:bg-void';

export function DetailHero({
  vehicle,
  onOpenTestDrive,
  onOpenGallery,
  imageCount = 0,
  onPrintBrochure,
  curtain = true,
}: DetailHeroProps) {
  const goBack = useBackNavigation('/');
  const { isGaraged, isBusy, toggle } = useGarageToggle(vehicle);
  const trim = cleanText(vehicle.pricing.trim);
  const heroSrc = vehicle.media.heroImage;

  // Görsel çizildi mi (ya da hiç yok / kırık): View Transition yeni anlık görüntüyü bunu bekleyerek alır (data-vt-ready)
  const [mediaReady, setMediaReady] = useState(() => !heroSrc?.trim() || isImageLoaded(heroSrc));
  const markReady = () => setMediaReady(true);

  // 1.4 — İmleci izleyen stüdyo spot ışığı: React state yerine CSS değişkeni (her harekette render yok), kare başına bir güncelleme
  const spotRef = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const moveSpot = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' || !spotRef.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      spotRef.current?.style.setProperty('--spot-x', `${x.toFixed(1)}%`);
      spotRef.current?.style.setProperty('--spot-y', `${y.toFixed(1)}%`);
      spotRef.current?.setAttribute('data-active', 'true');
    });
  };
  const hideSpot = () => {
    cancelAnimationFrame(frame.current);
    spotRef.current?.removeAttribute('data-active');
  };

  return (
    <header className="relative" data-vt-ready={mediaReady ? 'true' : undefined}>
      <div
        className="relative h-[22rem] w-full overflow-hidden bg-black md:h-[30rem]"
        onPointerMove={moveSpot}
        onPointerLeave={hideSpot}
      >
        {/* View Transition hedefi (kart görseli buraya yerleşir) + perde açılışı + ~20 sn yavaş kamera */}
        <div
          className={`absolute inset-0 overflow-hidden ${curtain && mediaReady ? 'hero-curtain' : ''}`}
          style={{ viewTransitionName: VT_MEDIA }}
        >
          <div className={`absolute inset-0 ${mediaReady ? 'hero-drift' : ''}`}>
            <SmartImage
              src={heroSrc}
              alt={vehicleName(vehicle)}
              colorHex={vehicle.media.colorHex}
              tone="dark"
              priority
              onLoad={markReady}
              onError={markReady}
            />
          </div>
        </div>
        {/* Metin okunabilirliği için alttan ve (masaüstünde) soldan scrim; görsel her temada koyu zemin üzerinde */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/10" />
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/50 via-black/10 to-transparent md:block" />
        {/* Stüdyo spot ışığı: yalnızca md+, fare ile ve hareket azaltma kapalıyken (CSS), en fazla %7 beyaz */}
        <div ref={spotRef} className="hero-spotlight pointer-events-none absolute inset-0 hidden md:block" aria-hidden />

        {/* Görselin tamamı galeriyi açar (metin katmanı pointer-events-none; üst bar butonları z-10) */}
        {onOpenGallery && (
          <button
            type="button"
            onClick={onOpenGallery}
            className="absolute inset-0 cursor-zoom-in"
            aria-label={`${vehicleName(vehicle)} galerisini tam ekran aç`}
            tabIndex={-1}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-3 md:px-8 [&_button]:pointer-events-auto">
          <button type="button" onClick={goBack} className={overlayButtonClass} aria-label="Geri dön">
            <ArrowLeft className="size-5" strokeWidth={1.5} aria-hidden />
          </button>

          <div className="flex gap-2">
            {onOpenGallery && (
              <button
                type="button"
                onClick={onOpenGallery}
                className="flex h-11 items-center justify-center gap-2 border border-border-subtle bg-void/70 px-3 text-foreground backdrop-blur-sm transition-colors hover:bg-void md:px-4"
                aria-label={`Galeriyi aç (${imageCount} görsel)`}
              >
                <Images className="size-5" strokeWidth={1.5} aria-hidden />
                <span className="text-xs font-medium tabular-nums">{imageCount}</span>
              </button>
            )}
            {onPrintBrochure && (
              <button
                type="button"
                onClick={onPrintBrochure}
                className={overlayButtonClass}
                aria-label="Broşürü indir (A4 teknik künye, PDF olarak kaydedilebilir)"
                title="Broşürü İndir"
              >
                <FileText className="size-5" strokeWidth={1.5} aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenTestDrive}
              className="hidden h-11 items-center justify-center border border-border-subtle bg-void/70 px-6 text-xs font-semibold uppercase tracking-eyebrow text-foreground backdrop-blur-sm transition-colors hover:bg-foreground hover:text-void md:flex"
            >
              Test Sürüşü
            </button>
            <m.button
              type="button"
              disabled={isBusy}
              whileTap={isBusy ? {} : { scale: 0.94 }}
              onClick={toggle}
              className={`${overlayButtonClass} ${isBusy ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-label={isGaraged ? 'Garajdan çıkar' : 'Garaja ekle'}
              aria-pressed={isGaraged}
            >
              {isBusy ? (
                <span className="size-5 animate-spin rounded-full border-[1.5px] border-muted border-t-foreground" />
              ) : (
                <Bookmark className={`size-5 ${isGaraged ? 'fill-current' : ''}`} strokeWidth={1.5} aria-hidden />
              )}
            </m.button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 mx-auto max-w-7xl px-4 pb-8 md:px-8 lg:px-12">
          <p className="eyebrow text-white/70">
            <span lang="en">{vehicleBrand(vehicle)}</span> · <span className="tabular-nums">{vehicle.year}</span>
          </p>
          <h1 className="mt-3 text-display-lg font-normal text-white">
            {/* Kart başlığı bu metne dönüşür (inline-block: anlık görüntü yalnızca metni kapsar) */}
            <span className="inline-block" style={{ viewTransitionName: VT_TITLE }}>
              {vehicleModel(vehicle)}
            </span>
          </h1>
          {vehicle.tagline && <p className="mt-2 max-w-2xl text-base text-white/75">{cleanText(vehicle.tagline)}</p>}
          <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-xl font-medium tabular-nums text-white">{formatVehiclePrice(vehicle.pricing)}</span>
            {trim && <span className="text-sm text-white/70">{trim}</span>}
          </div>
        </div>
      </div>
    </header>
  );
}
