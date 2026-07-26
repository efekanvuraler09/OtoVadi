import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CircleDot, MoveHorizontal, Palette, Rotate3d, Sofa } from 'lucide-react';
import type { Vehicle } from '../../types/vehicle';
import { resolveConfigurator } from '../../lib/vehicleConfigurator';
import { useAccent } from '../../hooks/useAccent';
import { ConfiguratorCarSvg } from './ConfiguratorCarSvg';

type ViewMode = 'spin' | 'exterior' | 'interior';

interface VehicleConfiguratorProps {
  vehicle: Vehicle;
}

function framePath(basePath: string, index: number, extension = 'webp') {
  const pad = String(index).padStart(2, '0');
  return `${basePath}/${pad}.${extension}`;
}

export function VehicleConfigurator({ vehicle }: VehicleConfiguratorProps) {
  const accent = useAccent(vehicle);
  const config = useMemo(() => resolveConfigurator(vehicle), [vehicle]);

  const [viewMode, setViewMode] = useState<ViewMode>('spin');
  const [colorId, setColorId] = useState(
    config.defaultColorId ?? config.colors[0]?.id ?? 'default',
  );
  const [wheelId, setWheelId] = useState(
    config.defaultWheelId ?? config.wheels[1]?.id ?? config.wheels[0]?.id ?? 'w18',
  );
  const [rotation, setRotation] = useState(0);
  const [panOffset, setPanOffset] = useState(0);
  const [spinImageFailed, setSpinImageFailed] = useState(false);
  const dragRef = useRef<{ startX: number; startRotation: number; startPan: number } | null>(
    null,
  );
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSpinImageFailed(false);
    setRotation(0);
    setPanOffset(0);
    setColorId(config.defaultColorId ?? config.colors[0]?.id ?? 'default');
    setWheelId(config.defaultWheelId ?? config.wheels[1]?.id ?? config.wheels[0]?.id ?? 'w18');
  }, [vehicle.id, config]);

  const selectedColor = config.colors.find((c) => c.id === colorId) ?? config.colors[0];
  const selectedWheel = config.wheels.find((w) => w.id === wheelId) ?? config.wheels[0];
  const wheelScale = selectedWheel.sizeInch / 18;

  const spinFrameIndex = useMemo(() => {
    const count = config.spinFrames?.frameCount ?? 36;
    const normalized = ((rotation % 360) + 360) % 360;
    return Math.round((normalized / 360) * (count - 1));
  }, [rotation, config.spinFrames?.frameCount]);

  const spinImageSrc = config.spinFrames
    ? framePath(
        config.spinFrames.basePath,
        spinFrameIndex + 1,
        config.spinFrames.extension,
      )
    : vehicle.media.heroImage;

  const pseudo3d = useMemo(() => {
    const rad = (rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    return {
      rotateY: rotation,
      scaleX: 0.55 + Math.abs(cos) * 0.45,
      skewY: Math.sin(rad) * 4,
      opacity: 0.85 + Math.abs(cos) * 0.15,
    };
  }, [rotation]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startRotation: rotation,
        startPan: panOffset,
      };
    },
    [rotation, panOffset],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const delta = e.clientX - dragRef.current.startX;
      if (viewMode === 'interior') {
        setPanOffset(Math.max(-120, Math.min(120, dragRef.current.startPan + delta * 0.4)));
      } else {
        setRotation(dragRef.current.startRotation + delta * 0.6);
      }
    },
    [viewMode],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const viewTabs: { id: ViewMode; label: string; icon: typeof Rotate3d }[] = [
    { id: 'spin', label: '360°', icon: Rotate3d },
    { id: 'exterior', label: 'Dış', icon: MoveHorizontal },
    { id: 'interior', label: 'İç Mekan', icon: Sofa },
  ];

  return (
    <section className="px-4 md:px-8 lg:mx-auto lg:max-w-4xl lg:px-12">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Konfigüratör</h2>
        <p className="mt-1 text-sm text-muted">
          Rengi değiştirin, jant boyutunu seçin, 360° döndürün veya iç mekana bakın
        </p>
      </div>

      <div className="glass-panel overflow-hidden rounded-3xl">
        {/* Görünüm sekmeleri */}
        <div className="flex border-b border-glass-border">
          {viewTabs.map(({ id, label, icon: Icon }) => {
            const active = viewMode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setViewMode(id)}
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-medium transition-colors ${
                  active
                    ? `${accent.text} border-b-2 ${accent.isRed ? 'border-accent-red' : 'border-accent'}`
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Görsel alan */}
        <div
          ref={viewerRef}
          className="relative aspect-[16/10] cursor-grab touch-none select-none bg-gradient-to-b from-white/5 to-void/80 active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          role="img"
          aria-label={`${vehicle.brand} ${vehicle.model} konfigüratör görünümü`}
        >
          {viewMode === 'interior' ? (
            <div className="absolute inset-0 overflow-hidden">
              {config.interiorImage ? (
                <img
                  src={config.interiorImage}
                  alt="İç mekan"
                  className="h-full w-[140%] max-w-none object-cover transition-transform duration-75"
                  style={{ transform: `translateX(${panOffset}px)` }}
                  draggable={false}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              <InteriorCockpit
                accentHex={selectedColor.hex}
                panOffset={panOffset}
                brand={vehicle.brand}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-void/90 to-transparent px-4 py-3">
                <p className="text-center text-[11px] text-muted">
                  Sürükleyerek iç mekanda etrafa bakın
                </p>
              </div>
            </div>
          ) : viewMode === 'spin' ? (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ perspective: '1200px' }}
            >
              <div
                className="relative h-[72%] w-[88%] transition-transform duration-75"
                style={{
                  transform: `rotateY(${pseudo3d.rotateY}deg) scaleX(${pseudo3d.scaleX}) skewY(${pseudo3d.skewY}deg) scale(${0.92 + (wheelScale - 1) * 0.35})`,
                  transformStyle: 'preserve-3d',
                  opacity: spinImageFailed ? 1 : pseudo3d.opacity,
                }}
              >
                {spinImageFailed ? (
                  <ConfiguratorCarSvg
                    bodyType={vehicle.bodyType}
                    color={selectedColor.hex}
                    wheelScale={wheelScale}
                    rotation={rotation}
                    className="h-full w-full drop-shadow-2xl"
                  />
                ) : (
                  <>
                    <img
                      src={spinImageSrc}
                      alt={`${vehicle.brand} ${vehicle.model}`}
                      className="h-full w-full object-contain drop-shadow-2xl"
                      draggable={false}
                      onError={() => setSpinImageFailed(true)}
                    />
                    <div
                      className="pointer-events-none absolute inset-0 mix-blend-multiply"
                      style={{
                        backgroundColor: selectedColor.hex,
                        opacity: selectedColor.metallic ? 0.42 : 0.55,
                      }}
                    />
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: selectedColor.metallic
                          ? 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 45%, rgba(0,0,0,0.15) 100%)'
                          : 'linear-gradient(180deg, transparent 60%, rgba(0,0,0,0.2) 100%)',
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex items-end justify-center pb-6 pt-8">
              <ConfiguratorCarSvg
                bodyType={vehicle.bodyType}
                color={selectedColor.hex}
                wheelScale={wheelScale}
                rotation={0}
                className="h-[70%] w-[85%] drop-shadow-2xl"
              />
            </div>
          )}

          {/* Açı göstergesi */}
          {viewMode === 'spin' && (
            <div className="pointer-events-none absolute right-4 top-4 rounded-xl bg-void/70 px-3 py-1.5 text-[11px] font-medium text-foreground backdrop-blur-sm">
              {Math.round(((rotation % 360) + 360) % 360)}°
            </div>
          )}

          {viewMode !== 'interior' && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-void/60 px-3 py-1 text-[10px] text-muted backdrop-blur-sm">
                <MoveHorizontal className="size-3" />
                Sürükleyerek döndürün
              </span>
            </div>
          )}
        </div>

        {/* Renk seçimi */}
        <div className="border-t border-glass-border px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <Palette className={`size-4 ${accent.text}`} />
            <span className="text-sm font-medium text-foreground">Renk</span>
            <span className="text-xs text-muted">· {selectedColor.name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.colors.map((color) => {
              const active = color.id === colorId;
              return (
                <motion.button
                  key={color.id}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setColorId(color.id)}
                  title={color.name}
                  className={`relative size-10 rounded-full border-2 transition-shadow ${
                    active
                      ? `${accent.isRed ? 'border-accent-red' : 'border-accent'} ring-2 ${accent.isRed ? 'ring-accent-red/40' : 'ring-accent/40'}`
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  aria-label={color.name}
                  aria-pressed={active}
                >
                  {color.metallic && (
                    <span
                      className="pointer-events-none absolute inset-1 rounded-full"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%)',
                      }}
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Jant seçimi */}
        <div className="border-t border-glass-border px-4 py-4">
          <div className="mb-3 flex items-center gap-2">
            <CircleDot className={`size-4 ${accent.text}`} />
            <span className="text-sm font-medium text-foreground">Jant</span>
            <span className="text-xs text-muted">· {selectedWheel.name}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {config.wheels.map((wheel) => {
              const active = wheel.id === wheelId;
              return (
                <button
                  key={wheel.id}
                  type="button"
                  onClick={() => setWheelId(wheel.id)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-medium transition-colors ${
                    active
                      ? `${accent.bgSoft} ${accent.text} ring-1 ${accent.isRed ? 'ring-accent-red/50' : 'ring-accent/50'}`
                      : 'border border-glass-border bg-white/5 text-muted hover:text-foreground'
                  }`}
                >
                  {wheel.sizeInch}"
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function InteriorCockpit({
  accentHex,
  panOffset,
  brand,
}: {
  accentHex: string;
  panOffset: number;
  brand: string;
}) {
  return (
    <svg
      viewBox="0 0 800 400"
      className="absolute inset-0 h-full w-full"
      style={{ transform: `translateX(${panOffset * 0.5}px)` }}
      aria-hidden
    >
      <defs>
        <linearGradient id="dashGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a1a22" />
          <stop offset="100%" stopColor="#0a0a0f" />
        </linearGradient>
        <radialGradient id="ambientGlow" cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor={accentHex} stopOpacity="0.25" />
          <stop offset="100%" stopColor={accentHex} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="400" fill="url(#dashGrad)" />
      <rect width="800" height="400" fill="url(#ambientGlow)" />
      {/* Ön cam */}
      <path d="M80 120 Q400 40 720 120 L700 200 Q400 160 100 200 Z" fill="#2a3040" opacity="0.9" />
      {/* Gösterge paneli */}
      <rect x="120" y="180" width="200" height="90" rx="12" fill="#111" stroke="#333" />
      <rect x="480" y="180" width="200" height="90" rx="12" fill="#111" stroke="#333" />
      <rect x="300" y="200" width="200" height="120" rx="16" fill="#0d0d12" stroke={accentHex} strokeWidth="2" />
      <text x="400" y="265" textAnchor="middle" fill="#888" fontSize="14" fontFamily="system-ui">
        {brand}
      </text>
      {/* Koltuklar */}
      <ellipse cx="200" cy="320" rx="90" ry="50" fill="#222" stroke="#444" />
      <ellipse cx="600" cy="320" rx="90" ry="50" fill="#222" stroke="#444" />
      <ellipse cx="200" cy="300" rx="70" ry="35" fill="#2a2a32" />
      <ellipse cx="600" cy="300" rx="70" ry="35" fill="#2a2a32" />
      {/* Direksiyon */}
      <circle cx="180" cy="260" r="35" fill="none" stroke="#555" strokeWidth="6" />
      <circle cx="180" cy="260" r="8" fill={accentHex} />
    </svg>
  );
}
