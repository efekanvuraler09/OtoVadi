import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

/** Tarayıcı çubuğu rengi (index.html'deki inline script ile aynı değerler) */
const THEME_COLOR: Record<Theme, string> = { light: '#ffffff', dark: '#000000' };

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

/**
 * index.html'deki inline script, React yüklenmeden önce kayıtlı tercihi (yoksa işletim sistemi tercihini)
 * <html> sınıfına uygular. Store aynı kararla başlar; böylece ilk render ile ilk boyama arasında tema değişmez.
 */
const initialTheme: Theme =
  typeof document !== 'undefined' && !document.documentElement.classList.contains('dark') ? 'light' : 'dark';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: initialTheme,
      toggleTheme: () =>
        set((state) => {
          const theme: Theme = state.theme === 'light' ? 'dark' : 'light';
          applyTheme(theme);
          return { theme };
        }),
      setTheme: (theme) =>
        set(() => {
          applyTheme(theme);
          return { theme };
        }),
    }),
    {
      name: 'theme-storage',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);
