import { useState } from 'react';
import { Globe } from 'lucide-react';
import { useI18n, localeLabels, type Locale } from '../../i18n/useI18n';

const locales: Locale[] = ['tr', 'en', 'de'];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-black dark:text-neutral-400 hover:opacity-70 dark:hover:text-white transition-all select-none outline-none focus:outline-none"
        aria-label="Dil Seçici"
      >
        <Globe className="size-[18px] stroke-[1.5]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider">
          {localeLabels[locale]}
        </span>
      </button>

      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 z-50 min-w-[100px] border border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md shadow-2xl">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={`block w-full text-left px-4 py-2.5 font-sans text-sm font-medium tracking-wider transition-colors select-none outline-none focus:outline-none ${
                  l === locale
                    ? 'text-neutral-900 dark:text-neutral-100 bg-neutral-100 dark:bg-neutral-800/80'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                {localeLabels[l]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
