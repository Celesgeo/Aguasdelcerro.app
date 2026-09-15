'use client';

import Image from 'next/image';
import { Droplets, Leaf, Moon, Sparkles } from 'lucide-react';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import { getTermasMedia } from '@/lib/termas-media';
import { useLocaleDict, useT } from '@/components/i18n/LanguageProvider';

const icons = [Droplets, Leaf, Moon, Sparkles];

export default function TermasSection() {
  const media = getTermasMedia();
  const t = useT();
  const dict = useLocaleDict();

  return (
    <section className="bg-brand-brown py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          light
          i18n={{
            eyebrow: 'home.termasKicker',
            title: 'home.termasTitle',
            description: 'home.termasDescription',
          }}
        />

        <div className="mb-16 grid gap-4 lg:grid-cols-12">
          <ScrollReveal className="lg:col-span-8">
            <div className="relative aspect-[16/10] overflow-hidden border border-brand-gold/15">
              <Image
                src={media.hero}
                alt={t('home.termasOverview')}
                fill
                className="object-cover"
                style={{ objectPosition: 'center 42%' }}
                sizes="(max-width:1024px) 100vw, 66vw"
                quality={92}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/50 via-transparent to-transparent pointer-events-none" />
              <p className="absolute bottom-5 left-5 text-xs tracking-[0.25em] uppercase text-brand-cream/85 font-body pointer-events-none">
                {t('home.termasOverview')}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="lg:col-span-4">
            <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full min-h-[280px] overflow-hidden border border-brand-gold/15">
              <Image
                src={media.vip}
                alt={t('home.termasValley')}
                fill
                className="object-cover"
                style={{ objectPosition: 'center 60%' }}
                sizes="(max-width:1024px) 100vw, 33vw"
                quality={92}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-black/75 via-brand-black/15 to-transparent" />
              <div className="absolute inset-3 border border-brand-gold/20 pointer-events-none" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-xs tracking-[0.25em] uppercase text-brand-gold font-body mb-2">{t('home.termasNight')}</p>
                <p className="font-subtitle text-xl text-brand-cream">{t('home.termasValley')}</p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {dict.benefits.map((item, i) => {
            const Icon = icons[i] ?? Droplets;
            return (
              <ScrollReveal key={item.title} delay={i * 0.08}>
                <div className="group h-full border border-brand-gold/15 bg-brand-cream/5 p-8 backdrop-blur-sm transition-all duration-500 hover:border-brand-gold/35 hover:bg-brand-cream/8">
                  <Icon className="mb-6 text-brand-gold" size={28} strokeWidth={1.2} />
                  <h3 className="font-subtitle text-xl text-brand-cream mb-3">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-brand-cream/65 font-body">{item.description}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
