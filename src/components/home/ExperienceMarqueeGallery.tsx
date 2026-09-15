'use client';

import Image from 'next/image';
import SectionHeading from '@/components/shared/SectionHeading';
import { HOME_EXPERIENCE_MARQUEE_IMAGES } from '@/lib/home-marquee';
import { useT } from '@/components/i18n/LanguageProvider';
import styles from './ExperienceMarqueeGallery.module.css';

function GalleryCards({ decorative = false }: { decorative?: boolean }) {
  return (
    <div
      className={decorative ? `${styles.group} ${styles.clone}` : styles.group}
      aria-hidden={decorative || undefined}
    >
      {HOME_EXPERIENCE_MARQUEE_IMAGES.map((image, index) => (
        <figure key={`${decorative ? 'clone' : 'live'}-${image.src}`} className={styles.card}>
          <Image
            src={image.src}
            alt={decorative ? '' : image.alt}
            fill
            className={styles.image}
            sizes="(max-width: 767px) 85vw, (max-width: 1023px) 42vw, 31vw"
            quality={78}
            loading={decorative || index > 2 ? 'lazy' : 'eager'}
          />
        </figure>
      ))}
    </div>
  );
}

export default function ExperienceMarqueeGallery() {
  const t = useT();

  return (
    <section className={styles.section}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          i18n={{
            eyebrow: 'home.marqueeKicker',
            title: 'home.marqueeTitle',
            description: 'home.marqueeDescription',
          }}
        />
      </div>

      <div className={styles.scroller} tabIndex={0} aria-label={t('home.marqueeAria')}>
        <div className={styles.track}>
          <GalleryCards />
          <GalleryCards decorative />
        </div>
      </div>
    </section>
  );
}
