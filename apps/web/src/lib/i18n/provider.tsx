'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Locale } from '@/domain/types';
import { directionOf, LOCALE_COOKIE, translator, type Translate } from './index';

interface I18nValue {
  locale: Locale;
  dir: 'ltr' | 'rtl';
  t: Translate;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Language and direction for the newcomer app. The initial locale comes from the cookie on the
 * server, so the first paint is already in the right language and direction. The provider renders
 * the element that carries `lang` and `dir`, so everything inside mirrors with no per-component work.
 */
export function I18nProvider({ initial, children }: { initial: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initial);

  const setLocale = useCallback((next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
    setLocaleState(next);
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ locale, dir: directionOf(locale), t: translator(locale), setLocale }),
    [locale, setLocale],
  );

  return (
    <I18nContext.Provider value={value}>
      <div lang={locale} dir={value.dir} className="contents font-sans">
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
