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
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        'border-subtle': 'rgb(var(--color-border-subtle) / <alpha-value>)',
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
      fontFamily: {
        display: [
          'Corporate A',
          'Corporate A BQ',
          'Playfair Display',
          'Georgia',
          'Times New Roman',
          'serif',
        ],
        sans: [
          'MBCorpo S Text',
          'MBCorpo Title',
          'Montserrat',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      letterSpacing: {
        'mb-wide': '0.15em',
        'mb-wider': '0.25em',
      },
    },
  },
  plugins: [],
};
