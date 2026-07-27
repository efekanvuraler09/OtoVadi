/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: 'var(--color-void)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        muted: 'var(--color-muted)',
        foreground: 'var(--color-foreground)',
        'border-subtle': 'var(--color-border-subtle)',
      },
      fontFamily: {
        display: [
          'Playfair Display',
          'Georgia',
          'Times New Roman',
          'serif',
        ],
        sans: [
          'Inter',
          'SF Pro Display',
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
