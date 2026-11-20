import { m } from 'framer-motion';
import { RADAR_AXES, axisVector, radarPoints, type RadarProfile } from '../../lib/radarProfile';
import { useI18n } from '../../i18n/useI18n';
import { TRANSITION } from '../../lib/motion';

interface SoulRadarProps {
  vehicle: RadarProfile;
  user: RadarProfile;
}

/*
 * Geometri: viewBox 440×330, merkez (220,160), yarıçap 108. Yan etiketler merkezden 0.951·(R+18) uzakta ve
 * dışa doğru hizalı (start/end); en uzun etiket (~100 birim) viewBox içinde kalır. Ekran 320 px'e inse bile
 * 15 birimlik etiket ~11 px okunur. Etiketler SVG içinde olduğu için mobilde taşma olmaz.
 */
const W = 440;
const H = 330;
const CX = 220;
const CY = 160;
const R = 108;
const RINGS = [0.25, 0.5, 0.75, 1];

const toPath = (points: { x: number; y: number }[]) => points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

/** U11 — Ruh İkizi 5 eksenli SVG radar: dolu çokgen araç, kesikli çizgi kullanıcı profili. Tema tokenlarıyla çizilir. */
export function SoulRadar({ vehicle, user }: SoulRadarProps) {
  const { t, locale } = useI18n();
  const labels = t.soulTwin.radarAxes;
  const vehiclePoints = radarPoints(vehicle, CX, CY, R);
  const userPoints = radarPoints(user, CX, CY, R);

  return (
    <m.figure
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION.slow}
      className="flex w-full max-w-md flex-col items-center"
    >
      <figcaption className="eyebrow mb-4 text-center">{t.soulTwin.radarTitle}</figcaption>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full overflow-visible"
        role="img"
        lang={locale}
        aria-label={RADAR_AXES.map((axis) => `${labels[axis]}: ${vehicle[axis]} / ${user[axis]}`).join(', ')}
      >
        {/* Halkalar ve eksenler */}
        <g className="text-border-subtle" stroke="currentColor" fill="none" strokeWidth={1}>
          {RINGS.map((ring) => (
            <polygon
              key={ring}
              points={toPath(RADAR_AXES.map((_, i) => {
                const v = axisVector(i);
                return { x: CX + v.x * R * ring, y: CY + v.y * R * ring };
              }))}
            />
          ))}
          {RADAR_AXES.map((axis, i) => {
            const v = axisVector(i);
            return <line key={axis} x1={CX} y1={CY} x2={CX + v.x * R} y2={CY + v.y * R} />;
          })}
        </g>

        {/* Kullanıcı profili (kesikli) */}
        <m.polygon
          points={toPath(userPoints)}
          fill="none"
          stroke="rgb(var(--color-muted))"
          strokeWidth={1.5}
          strokeDasharray="5 4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...TRANSITION.slow, delay: 0.35 }}
        />

        {/* Araç profili (dolu) */}
        <m.g
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...TRANSITION.slow, delay: 0.15 }}
          style={{ originX: `${CX}px`, originY: `${CY}px`, transformBox: 'view-box' }}
        >
          <polygon
            points={toPath(vehiclePoints)}
            fill="rgb(var(--color-foreground) / 0.1)"
            stroke="rgb(var(--color-foreground))"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {vehiclePoints.map((p, i) => (
            <circle key={RADAR_AXES[i]} cx={p.x} cy={p.y} r={3} fill="rgb(var(--color-foreground))" />
          ))}
        </m.g>

        {/* Etiketler: eksen adı + "araç · siz" puanı */}
        {RADAR_AXES.map((axis, i) => {
          const v = axisVector(i);
          const lx = CX + v.x * (R + 18);
          const ly = CY + v.y * (R + 18);
          const anchor = Math.abs(v.x) < 0.2 ? 'middle' : v.x > 0 ? 'start' : 'end';
          // Üst etiket yukarı, alttakiler aşağı doğru yerleşir
          const nameY = v.y < -0.5 ? ly - 22 : v.y > 0.5 ? ly + 12 : ly - 4;
          return (
            <g key={axis}>
              <text
                x={lx}
                y={nameY}
                textAnchor={anchor}
                className="fill-muted font-sans uppercase"
                fontSize={15}
                fontWeight={500}
                letterSpacing="0.16em"
              >
                {labels[axis]}
              </text>
              <text x={lx} y={nameY + 19} textAnchor={anchor} className="font-sans" fontSize={16} style={{ fontVariantNumeric: 'tabular-nums' }}>
                <tspan className="fill-foreground" fontWeight={500}>
                  {vehicle[axis]}
                </tspan>
                <tspan className="fill-muted" fontWeight={400}>
                  {' · '}
                  {user[axis]}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>

      <div className="mt-4 flex items-center gap-6 text-2xs text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-4 border border-foreground bg-foreground/10" aria-hidden />
          {t.soulTwin.radarVehicle}
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-4 border-t border-dashed border-muted" aria-hidden />
          {t.soulTwin.radarYou}
        </span>
      </div>
    </m.figure>
  );
}
