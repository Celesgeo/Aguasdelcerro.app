'use client';

import { useLocaleDict, useT } from '@/components/i18n/LanguageProvider';
import styles from './BrandPhraseMarquee.module.css';

function PhraseGroup({ phrases, decorative = false }: { phrases: readonly string[]; decorative?: boolean }) {
  return (
    <div className={decorative ? `${styles.group} ${styles.clone}` : styles.group} aria-hidden={decorative || undefined}>
      {phrases.map((phrase) => (
        <span key={`${decorative ? 'clone' : 'live'}-${phrase}`} className={styles.item}>
          {phrase}
          <span className={styles.sep} aria-hidden="true" />
        </span>
      ))}
    </div>
  );
}

export default function BrandPhraseMarquee() {
  const dict = useLocaleDict();
  const t = useT();

  return (
    <div className={styles.band} role="region" aria-label={t('home.phrasesAria')}>
      <div className={styles.scroller} tabIndex={0}>
        <div className={styles.track}>
          <PhraseGroup phrases={dict.phrases} />
          <PhraseGroup phrases={dict.phrases} decorative />
        </div>
      </div>
    </div>
  );
}
