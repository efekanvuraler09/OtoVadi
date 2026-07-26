import type { BodyType } from '../../types/vehicle';

interface ConfiguratorCarSvgProps {
  bodyType: BodyType;
  color: string;
  wheelScale: number;
  rotation: number;
  className?: string;
}

/** Görsel yüklenemediğinde veya dış görünüm modunda kullanılan vektör araç */
export function ConfiguratorCarSvg({
  bodyType,
  color,
  wheelScale,
  rotation,
  className,
}: ConfiguratorCarSvgProps) {
  const isSuv = bodyType === 'suv';
  const rad = (rotation * Math.PI) / 180;
  const sideScale = 0.55 + Math.abs(Math.cos(rad)) * 0.45;
  const wheelR = (isSuv ? 22 : 20) * wheelScale;

  return (
    <svg
      viewBox="0 0 400 160"
      className={className}
      style={{ transform: `scaleX(${sideScale})` }}
      aria-hidden
    >
      <defs>
        <linearGradient id="bodyShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="50%" stopColor={color} stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
      </defs>

      {/* Gölge */}
      <ellipse cx="200" cy="145" rx="150" ry="12" fill="#000" opacity="0.35" />

      {isSuv ? (
        <path
          d="M60 110 L75 70 L120 50 L200 45 L280 50 L325 70 L340 110 Z"
          fill={color}
          stroke="#000"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
      ) : (
        <path
          d="M55 110 L70 75 L110 58 L200 52 L290 58 L330 75 L345 110 Z"
          fill={color}
          stroke="#000"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
      )}

      <path
        d={
          isSuv
            ? 'M95 68 L130 52 L200 48 L270 52 L305 68 L295 85 L105 85 Z'
            : 'M90 72 L125 58 L200 54 L275 58 L310 72 L300 88 L100 88 Z'
        }
        fill="url(#glassGrad)"
        opacity="0.85"
      />

      <rect
        x="175"
        y={isSuv ? 62 : 66}
        width="50"
        height="8"
        rx="2"
        fill="#1f2937"
        opacity="0.6"
      />

      <path d="M55 110 L345 110" fill={color} />
      <rect x="55" y="105" width="290" height="8" fill={color} opacity="0.9" />

      {/* Tekerlekler */}
      {[
        { cx: 115, cy: 112 },
        { cx: 285, cy: 112 },
      ].map(({ cx, cy }) => (
        <g key={cx} transform={`translate(${cx}, ${cy})`}>
          <circle r={wheelR} fill="#1a1a1a" />
          <circle r={wheelR * 0.65} fill="#333" />
          <circle r={wheelR * 0.25} fill="#666" />
          {[0, 45, 90, 135].map((angle) => (
            <line
              key={angle}
              x1="0"
              y1={-wheelR * 0.5}
              x2="0"
              y2={wheelR * 0.5}
              stroke="#555"
              strokeWidth="2"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
      ))}

      <rect x="55" y="50" width="290" height="65" fill="url(#bodyShine)" pointerEvents="none" />
    </svg>
  );
}
