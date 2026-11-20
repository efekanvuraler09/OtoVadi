import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { useI18n } from '../../i18n/useI18n';

interface ThemeToggleProps {
  /** icon: header'daki yuvarlak ikon butonu (rengi ebeveynden alır); segmented: menüdeki Açık/Koyu seçimi */
  variant?: 'icon' | 'segmented';
}

export function ThemeToggle({ variant = 'icon' }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const { t } = useI18n();

  if (variant === 'segmented') {
    return (
      <div role="radiogroup" aria-label={t.nav.theme} className="grid grid-cols-2 gap-1 border border-border-subtle p-1">
        {(['light', 'dark'] as const).map((value) => {
          const active = theme === value;
          const Icon = value === 'light' ? Sun : Moon;
          return (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(value)}
              className={`flex h-10 items-center justify-center gap-2 text-sm font-medium transition-colors ${
                active ? 'bg-foreground text-void' : 'text-secondary hover:text-foreground'
              }`}
            >
              <Icon className="size-4" strokeWidth={1.5} aria-hidden />
              {value === 'light' ? t.nav.lightMode : t.nav.darkMode}
            </button>
          );
        })}
      </div>
    );
  }

  const label = `${t.nav.theme}: ${theme === 'dark' ? t.nav.darkMode : t.nav.lightMode}`;
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="flex size-10 items-center justify-center rounded-full transition-opacity hover:opacity-70"
    >
      {theme === 'dark' ? (
        <Moon className="size-[18px]" strokeWidth={1.5} aria-hidden />
      ) : (
        <Sun className="size-[18px]" strokeWidth={1.5} aria-hidden />
      )}
    </button>
  );
}
