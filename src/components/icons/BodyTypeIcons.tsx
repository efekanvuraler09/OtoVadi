import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Audi A6 tipi üç kutu sedan: uzun kaput, düz tavan, yatay bagaj kapağı.
 */
export function SedanIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M 1.5 26.5
          L 3.5 24.2
          L 6 22.2
          L 9.5 20.6
          L 14 19.8
          L 18.5 19.5
          L 21 18.2
          L 23 14.8
          L 25 11.8
          L 40 10.8
          L 44.5 11.2
          L 47.5 13.2
          L 49.5 15.8
          L 51 17.8
          L 53.5 18.2
          L 58.5 18.2
          L 60.5 20.5
          L 62 23.5
          L 62.5 26.5
          L 57 26.5
          Q 49.5 21.2 42.5 26.5
          L 21.5 26.5
          Q 14.5 21.2 7.5 26.5
          L 1.5 26.5 Z"
      />
      <path
        d="M 22.5 17.8 L 25.2 11.8 L 39.5 10.9 L 48 14.2 L 50.5 17.2"
        opacity="0.5"
      />
      <circle cx="15" cy="26.5" r="3.75" />
      <circle cx="46" cy="26.5" r="3.75" />
    </svg>
  );
}

/**
 * Hyundai Santa Fe tipi SUV: yüksek kutu gövde, dik ön/arka, düz tavan, tavan rayı.
 */
export function SuvIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M 1.5 27.5
          L 2.5 24
          L 3.5 19
          L 4.5 14.5
          L 6.5 10.5
          L 10 7.8
          L 14.5 6.5
          L 44 6.5
          L 49.5 7.5
          L 53 9.8
          L 55.5 12.8
          L 57.2 16.2
          L 58.2 20
          L 58.8 24
          L 59.2 27.5
          L 53.5 27.5
          Q 46 21.5 38 27.5
          L 26 27.5
          Q 18 21.5 10.5 27.5
          L 1.5 27.5 Z"
      />
      <path d="M 13.5 5.2 H 46.5" opacity="0.5" />
      <path
        d="M 8.5 11.2 L 11.5 8 L 43.5 8 L 51.5 10.8 L 54.5 14.2"
        opacity="0.5"
      />
      <path d="M 4 24.5 H 60" opacity="0.35" />
      <circle cx="14.5" cy="27.5" r="4.25" />
      <circle cx="47.5" cy="27.5" r="4.25" />
    </svg>
  );
}

/**
 * Kompakt hatchback: kısa kaput, uzun tavan, neredeyse dik arka kapak.
 */
export function HatchbackIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M 2 26.5
          L 3 23.5
          L 5.5 21.2
          L 10 19.8
          L 16 19.2
          L 20.5 15.2
          L 25 11
          L 29 9.8
          L 46 9.8
          L 50.5 10.6
          L 54 14
          L 57.5 18.5
          L 59.5 21.5
          L 60 26.5
          L 54 26.5
          Q 47 21 40 26.5
          L 21.5 26.5
          Q 14.5 21 7.5 26.5
          L 2 26.5 Z"
      />
      <path d="M 21.5 15.8 L 25.8 11.6 L 45.5 11.3 L 50 12.3 L 53.2 15.8" opacity="0.5" />
      <circle cx="14.5" cy="26.5" r="3.75" />
      <circle cx="47" cy="26.5" r="3.75" />
    </svg>
  );
}

/**
 * Çift kabin pick-up: yüksek kaput, kabin, düz kasa.
 */
export function PickupIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M 1.5 27
          L 2 21.5
          L 3.5 17.5
          L 8 16
          L 16 15.2
          L 19 9.5
          L 21 7.5
          L 33 7.5
          L 34.5 9
          L 35 15
          L 61.5 15
          L 62 18.5
          L 62 27
          L 55 27
          Q 48 21 41 27
          L 23.5 27
          Q 16.5 21 9.5 27
          L 1.5 27 Z"
      />
      <path d="M 19.8 14.4 L 21.8 9 L 32.6 9 L 33.2 14.4" opacity="0.5" />
      <path d="M 35 18.5 H 61.5" opacity="0.35" />
      <circle cx="16.5" cy="27" r="4.25" />
      <circle cx="48" cy="27" r="4.25" />
    </svg>
  );
}

/**
 * Muscle car / coupe: uzun kaput, alçak fastback tavan.
 */
export function CoupeIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 64 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.45"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <path
        d="M 1.5 25.5
          L 2.5 22.5
          L 6 20.5
          L 12 19.6
          L 22 19
          L 25 16
          L 29 12.8
          L 33 12
          L 40 12.2
          L 46 14.2
          L 52 17.2
          L 58.5 18
          L 61.5 20
          L 62.5 25.5
          L 56.5 25.5
          Q 49.5 20.2 42.5 25.5
          L 21 25.5
          Q 14 20.2 7 25.5
          L 1.5 25.5 Z"
      />
      <path d="M 25.8 17.4 L 29.6 13.8 L 39.6 13.6 L 47.5 16.6" opacity="0.5" />
      <circle cx="14" cy="25.5" r="3.75" />
      <circle cx="49.5" cy="25.5" r="3.75" />
    </svg>
  );
}

const BODY_TYPE_ICONS = {
  sedan: SedanIcon,
  suv: SuvIcon,
  hatchback: HatchbackIcon,
  pickup: PickupIcon,
  'muscle-car': CoupeIcon,
} as const;

/** Gövde tipine göre siluet (bilinmeyen tipte sedan). Görsel fallback'leri ve gövde tipi kutucukları kullanır. */
export function BodyTypeIcon({ bodyType, ...props }: IconProps & { bodyType?: string }) {
  const Icon = (bodyType && BODY_TYPE_ICONS[bodyType as keyof typeof BODY_TYPE_ICONS]) || SedanIcon;
  return <Icon {...props} />;
}
