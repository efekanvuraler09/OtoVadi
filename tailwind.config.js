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
        glass: 'var(--color-glass)',
        'glass-border': 'var(--color-glass-border)',
        muted: 'var(--color-muted)',
        foreground: 'var(--color-foreground)',
        accent: {
          DEFAULT: 'var(--color-accent)',
          glow: 'var(--color-accent-glow)',
        },
        'accent-red': {
          DEFAULT: 'var(--color-accent-red)',
          glow: 'var(--color-accent-red-glow)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Display',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      boxShadow: {
        'accent-glow': '0 10px 40px -10px var(--color-accent-glow)',
        'accent-red-glow': '0 10px 40px -10px var(--color-accent-red-glow)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
