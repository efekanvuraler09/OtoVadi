/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Tokenlar index.css'te "R G B" kanalları olarak tanımlı; <alpha-value> sayesinde
      // bg-void/80, text-foreground/60 gibi opaklık sınıfları da üretilir.
      colors: {
        void: 'rgb(var(--color-void) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-elevated': 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        // Gri hiyerarşisi (koyudan açığa): foreground → secondary → muted. gray-*/neutral-* kullanma.
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        'border-subtle': 'rgb(var(--color-border-subtle) / <alpha-value>)',
        'border-strong': 'rgb(var(--color-border-strong) / <alpha-value>)',
        // Semantik durum renkleri (her iki temada AA kontrastlı)
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },
      // Uygulama genelindeki katman sırası (alttan üste). Sayfa içi yerel z değerleri 0-30 aralığında kalmalı.
      zIndex: {
        header: '40',
        bottombar: '40',
        'drawer-backdrop': '60',
        drawer: '70',
        modal: '80',
        toast: '90',
        stage: '100',
      },
      // Mercedes-Benz showroom estetiği: Serif Display (başlık) + temiz Sans (arayüz). Self-host, latin + latin-ext
      // (Türkçe karakterler dahil); main.tsx'te import edilir. Tüm serifler yalnızca font-display'den gelir.
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Inter Variable"', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      // Tip ölçeği: en küçük boyut 2xs (11px). display-* başlıklar clamp() ile akışkan ölçeklenir.
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
        'display-sm': ['clamp(1.375rem, 1.15rem + 0.9vw, 1.875rem)', { lineHeight: '1.3', letterSpacing: '0' }],
        'display-md': ['clamp(1.75rem, 1.35rem + 1.6vw, 2.75rem)', { lineHeight: '1.2', letterSpacing: '-0.005em' }],
        'display-lg': ['clamp(2.25rem, 1.6rem + 2.6vw, 4rem)', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'display-xl': ['clamp(2.75rem, 1.7rem + 4.4vw, 5.5rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
      },
      letterSpacing: {
        // Büyük harfli etiketler için tek ölçü (eski 0.3–0.5em değerlerinin yerine)
        eyebrow: '0.16em',
      },
      // Tek easing eğrisi ve kısa varsayılan süre (src/lib/motion.ts ile aynı değerler)
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'out-expo': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
        350: '350ms',
        550: '550ms',
      },
    },
  },
  plugins: [],
};
