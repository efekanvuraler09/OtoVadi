import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { tr } from './locales/tr';
import { en } from './locales/en';
import { de } from './locales/de';

export type Locale = 'tr' | 'en' | 'de';

export type Translations = typeof tr;

const dictionaries: Record<Locale, Translations> = { tr, en, de };

export const localeLabels: Record<Locale, string> = {
  tr: 'TR',
  en: 'EN',
  de: 'DE',
};

interface I18nState {
  locale: Locale;
  t: Translations;
  setLocale: (locale: Locale) => void;
}

export const useI18n = create<I18nState>()(
  persist(
    (set) => ({
      locale: 'tr',
      t: dictionaries.tr,
      setLocale: (locale: Locale) => {
        document.documentElement.lang = locale;
        set({ locale, t: dictionaries[locale] });
      },
    }),
    {
      name: 'otovadi-locale',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.t = dictionaries[state.locale];
          document.documentElement.lang = state.locale;
        }
      },
    },
  ),
);
