'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Button from '@/components/shared/Button';
import { useT } from '@/components/i18n/LanguageProvider';

interface HeroProps {
  image: string;
}

export default function Hero({ image }: HeroProps) {
  const t = useT();

  return (
    <section className="relative min-h-[100svh] bg-[#F6F0E7] pt-20 lg:pt-0">
      <div className="grid min-h-[100svh] lg:grid-cols-12">
        <div className="relative z-10 flex flex-col justify-center px-6 py-12 sm:px-10 lg:col-span-5 lg:px-14 xl:px-20">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="mb-5 text-[12px] tracking-[0.42em] uppercase text-[#C6A15B] font-body font-semibold"
          >
            {t('hero.kicker')}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.9 }}
            className="font-display text-[2.9rem] leading-[0.95] text-[#33271F] sm:text-6xl lg:text-[4.6rem]"
          >
            {t('hero.title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8 }}
            className="mt-6 max-w-md font-body text-base leading-relaxed text-[#33271F] sm:text-lg"
          >
            {t('hero.subtitle')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.8 }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <Button href="/reservas">{t('hero.ctaPrimary')}</Button>
            <Button href="/termas" variant="ghost" className="!text-[#33271F] !border-[#C6A15B]/50">
              {t('hero.ctaSecondary')}
            </Button>
          </motion.div>
        </div>

        <div className="relative min-h-[62vh] lg:col-span-7 lg:min-h-[100svh]">
          <div className="absolute inset-0 overflow-hidden">
            <Image
              src={image}
              alt={t('hero.photoCaption')}
              fill
              priority
              quality={88}
              className="object-cover"
              style={{ objectPosition: 'center 42%' }}
              sizes="(max-width: 1024px) 100vw, 58vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#263A32]/45 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 right-6 text-xs tracking-[0.28em] uppercase text-[#F6F0E7] font-body font-semibold drop-shadow-[0_1px_8px_rgba(38,58,50,0.8)]">
              {t('hero.photoCaption')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
