'use client';

import Image from 'next/image';
import { useT } from '@/components/i18n/LanguageProvider';

export default function LocalizedBleedHero({
  image,
  prefix,
  position = 'center 42%',
  minHeightClass = 'min-h-[70vh]',
}: {
  image: string;
  prefix: string;
  position?: string;
  minHeightClass?: string;
}) {
  const t = useT();
  const description = t(`${prefix}.description`);

  return (
    <section className={`relative pt-28 ${minHeightClass} flex items-end overflow-hidden`}>
      <Image
        src={image}
        alt={t(`${prefix}.title`)}
        fill
        priority
        quality={92}
        className="object-cover"
        style={{ objectPosition: position }}
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-brand-black/85 via-brand-black/35 to-brand-black/15" />
      <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-10 pb-16 md:pb-24">
        <p className="text-xs tracking-[0.45em] uppercase text-brand-gold font-body mb-4">{t(`${prefix}.kicker`)}</p>
        <h1 className="font-display text-5xl md:text-7xl text-brand-cream max-w-3xl leading-[0.95]">
          {t(`${prefix}.title`)}
        </h1>
        {description && !description.startsWith('pages.') && (
          <p className="mt-6 max-w-xl text-lg text-brand-cream/75 font-body leading-relaxed">{description}</p>
        )}
      </div>
    </section>
  );
}
