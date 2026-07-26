/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#050508',
        surface: '#0c0c10',
        'surface-elevated': '#14141a',
        glass: 'rgba(20, 20, 26, 0.72)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        muted: '#8b8b9a',
        foreground: '#f4f4f7',
        accent: {
          DEFAULT: '#3b82f6',
          glow: 'rgba(59, 130, 246, 0.35)',
        },
        'accent-red': {
          DEFAULT: '#ef4444',
          glow: 'rgba(239, 68, 68, 0.3)',
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
        'accent-glow': '0 10px 40px -10px rgba(59, 130, 246, 0.35)',
        'accent-red-glow': '0 10px 40px -10px rgba(239, 68, 68, 0.3)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
