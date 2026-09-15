'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { dictionaries, type Locale } from '@/lib/i18n/dictionaries';

const STORAGE_KEY = 'aguas-lang';

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readPath(source: unknown, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = source;
  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'es') setLocaleState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'es-AR';
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback(
    (path: string) =>
      readPath(dictionaries[locale], path) ?? readPath(dictionaries.es, path) ?? path,
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useT() {
  return useLanguage().t;
}

export function useLocaleDict() {
  const { locale } = useLanguage();
  return dictionaries[locale];
}
