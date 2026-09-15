import Image from 'next/image';
import JsonLd from '@/components/seo/JsonLd';
import LocalizedBleedHero from '@/components/shared/LocalizedBleedHero';
import ScrollReveal from '@/components/shared/ScrollReveal';
import Button from '@/components/shared/Button';
import Tx from '@/components/i18n/Tx';
import { EXPERIENCES } from '@/lib/constants';
import { EXPERIENCES_HERO, getExperienceImage } from '@/lib/experiences-media';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = createPageMetadata({
  title: 'Experiencias',
  description:
    'Descubrí las experiencias de Aguas del Cerro: relax, naturaleza, gastronomía y atardeceres en La Rioja, Argentina.',
  path: '/experiencias',
  image: EXPERIENCES_HERO,
  keywords: ['experiencias turísticas', 'relax montaña', 'atardeceres La Rioja', 'turismo de lujo'],
});

export default function ExperienciasPage() {
  return (
    <div className="bg-brand-cream">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Experiencias', path: '/experiencias' },
        ])}
      />

      {/* Hero editorial */}
      <LocalizedBleedHero image={EXPERIENCES_HERO} prefix="pages.experiences" position="center 40%" />

      <div className="mx-auto max-w-7xl px-6 lg:px-10 py-24 lg:py-32">
        <div className="space-y-28 lg:space-y-36">
          {EXPERIENCES.map((exp, i) => {
            const reverse = i % 2 === 1;
            const image = getExperienceImage(exp.slug);
            return (
              <ScrollReveal key={exp.slug}>
                <article
                  className={`grid items-center gap-10 lg:gap-16 lg:grid-cols-12 ${
                    reverse ? 'lg:[direction:rtl]' : ''
                  }`}
                >
                  <div className={`lg:col-span-7 ${reverse ? 'lg:[direction:ltr]' : ''}`}>
                    <div className="group relative overflow-hidden">
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={image}
                          alt={exp.title}
                          fill
                          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.02]"
                          sizes="(max-width:1024px) 100vw, 58vw"
                          quality={92}
                        />
                      </div>
                      <div className="absolute inset-4 border border-brand-gold/25 pointer-events-none" />
                    </div>
                  </div>

                  <div className={`lg:col-span-5 ${reverse ? 'lg:[direction:ltr]' : ''}`}>
                    <p className="text-[11px] tracking-[0.4em] uppercase text-brand-gold font-body mb-4">
                      0{i + 1} — <Tx k="pages.experiences.itemKicker" />
                    </p>
                    <h2 className="font-display text-4xl md:text-5xl text-brand-brown leading-tight mb-5">
                      <Tx k={`experiences.${exp.slug}.title`} />
                    </h2>
                    <div className="w-12 h-px bg-brand-gold/60 mb-6" />
                    <p className="text-lg leading-relaxed text-brand-dark/70 font-body">
                      <Tx k={`experiences.${exp.slug}.description`} />
                    </p>
                  </div>
                </article>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal className="mt-28 text-center border border-brand-brown/10 bg-white px-8 py-14 md:py-16">
          <p className="text-xs tracking-[0.35em] uppercase text-brand-gold font-body mb-4">
            <Tx k="pages.experiences.moment" />
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-brand-brown mb-6">
            <Tx k="pages.experiences.ctaTitle" />
          </h2>
          <Button href="/reservas">
            <Tx k="pages.experiences.cta" />
          </Button>
        </ScrollReveal>
      </div>
    </div>
  );
}
