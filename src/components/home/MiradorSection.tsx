'use client';

import Image from 'next/image';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import Button from '@/components/shared/Button';
import { useT } from '@/components/i18n/LanguageProvider';

interface MiradorSectionProps {
  image: string;
}

export default function MiradorSection({ image }: MiradorSectionProps) {
  const t = useT();

  return (
    <section className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={t('home.miradorTitle')}
          fill
          className="object-cover"
          style={{ objectPosition: 'center 58%' }}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-brand-black/55" />
      </div>
      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-10">
        <SectionHeading
          light
          i18n={{
            eyebrow: 'home.miradorKicker',
            title: 'home.miradorTitle',
            description: 'home.miradorDescription',
          }}
        />
        <ScrollReveal>
          <Button href="/gastronomia" variant="primary">
            {t('home.miradorCta')}
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
