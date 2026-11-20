import { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { useI18n, localeLabels, type Locale } from '../../i18n/useI18n';

const locales: Locale[] = ['tr', 'en', 'de'];

interface LanguageSwitcherProps {
  /** dropdown: header'daki küçük açılır menü (rengi ebeveynden alır); segmented: menüdeki TR/EN/DE seçimi */
  variant?: 'dropdown' | 'segmented';
}

export function LanguageSwitcher({ variant = 'dropdown' }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklama / Escape ile kapanır
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (variant === 'segmented') {
    return (
      <div role="radiogroup" aria-label={t.nav.language} className="grid grid-cols-3 gap-1 border border-border-subtle p-1">
        {locales.map((l) => {
          const active = l === locale;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLocale(l)}
              className={`h-10 text-sm font-medium tracking-wide transition-colors ${
                active ? 'bg-foreground text-void' : 'text-secondary hover:text-foreground'
              }`}
            >
              {localeLabels[l]}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t.nav.language}: ${localeLabels[locale]}`}
        className="flex h-10 items-center gap-1.5 rounded-full px-2.5 transition-opacity hover:opacity-70"
      >
        <Globe className="size-4" strokeWidth={1.5} aria-hidden />
        <span className="text-xs font-semibold tracking-wider">{localeLabels[locale]}</span>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t.nav.language}
          className="absolute right-0 top-full mt-2 min-w-[7rem] border border-border-subtle bg-void py-1 text-foreground shadow-2xl"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2.5 text-left text-sm font-medium tracking-wide transition-colors ${
                  l === locale ? 'bg-surface-elevated text-foreground' : 'text-secondary hover:bg-surface hover:text-foreground'
                }`}
              >
                {localeLabels[l]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
