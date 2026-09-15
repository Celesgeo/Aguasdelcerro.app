'use client';

import { useLanguage } from '@/components/i18n/LanguageProvider';

export default function LanguageSwitch({
  compact = false,
  inverted = false,
}: {
  compact?: boolean;
  inverted?: boolean;
}) {
  const { locale, setLocale, t } = useLanguage();
  const idle = inverted
    ? 'text-[#33271F]/50 hover:text-[#33271F]'
    : 'text-brand-cream/55 hover:text-brand-cream';

  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className={`inline-flex items-center gap-1.5 font-body ${compact ? 'text-xs' : 'text-[11px]'}`}
    >
      <button
        type="button"
        onClick={() => setLocale('es')}
        aria-pressed={locale === 'es'}
        className={`tracking-[0.18em] uppercase transition-colors ${locale === 'es' ? 'text-brand-gold' : idle}`}
      >
        ES
      </button>
      <span className={inverted ? 'text-[#33271F]/25' : 'text-brand-cream/30'} aria-hidden="true">
        /
      </span>
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        className={`tracking-[0.18em] uppercase transition-colors ${locale === 'en' ? 'text-brand-gold' : idle}`}
      >
        EN
      </button>
    </div>
  );
}
