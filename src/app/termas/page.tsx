import Image from 'next/image';
import JsonLd from '@/components/seo/JsonLd';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import Button from '@/components/shared/Button';
import MediaVideo from '@/components/shared/MediaVideo';
import { TERMAS_BENEFITS } from '@/lib/constants';
import { getTermasMedia } from '@/lib/termas-media';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

export const metadata: Metadata = createPageMetadata({
  title: 'Parque Térmico',
  description:
    'Parque térmico en La Rioja, Argentina. Bienestar, relax y conexión con la naturaleza en Aguas del Cerro.',
  path: '/termas',
  image: '/images/termas/termas-hero.jpg',
  keywords: ['parque térmico', 'termas La Rioja', 'spa montaña', 'aguas termales'],
});

export default function TermasPage() {
  const media = getTermasMedia();

  return (
    <div className="bg-brand-cream">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Parque Térmico', path: '/termas' },
        ])}
      />

      <section className="relative pt-28 min-h-[75vh] flex items-end overflow-hidden">
        <MediaVideo
          src={media.video}
          poster={media.hero}
          className="absolute inset-0 h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black/85 via-brand-black/40 to-brand-black/25" />
        <div className="relative z-10 mx-auto max-w-7xl w-full px-6 lg:px-10 pb-16 md:pb-24">
          <p className="text-xs tracking-[0.45em] uppercase text-brand-gold font-body mb-4">Parque Térmico</p>
          <h1 className="font-display text-5xl md:text-7xl text-brand-cream max-w-3xl leading-[0.95]">
            El agua como ritual
          </h1>
          <p className="mt-6 max-w-xl text-lg text-brand-cream/75 font-body leading-relaxed">
            Piscinas de piedra natural, vapor suave y montaña riojana — una experiencia térmica de alto nivel.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
        <SectionHeading
          eyebrow="Bienestar"
          title="13 piletas privadas en la colina"
          description="Aguas térmicas mineralizadas integradas al paisaje. Silencio, calor y una estética cuidada en cada rincón."
        />

        <div className="mb-16 grid gap-5 lg:grid-cols-2">
          <ScrollReveal>
            <div className="group relative overflow-hidden">
              <div className="relative aspect-[16/10]">
                <Image
                  src={media.overview}
                  alt="Vista panorámica del parque térmico"
                  fill
                  className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.02]"
                  sizes="(max-width:1024px) 100vw, 50vw"
                  quality={92}
                />
              </div>
              <div className="absolute inset-4 border border-brand-gold/20 pointer-events-none" />
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <div className="group relative overflow-hidden h-full min-h-[280px]">
              <Image
                src={media.hero}
                alt="Piletas térmicas de piedra"
                fill
                className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.02]"
                sizes="(max-width:1024px) 100vw, 50vw"
                quality={92}
              />
              <div className="absolute inset-4 border border-brand-gold/15 pointer-events-none" />
            </div>
          </ScrollReveal>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {TERMAS_BENEFITS.map((b) => (
            <ScrollReveal key={b.title}>
              <div className="bg-white border border-brand-brown/8 p-10 h-full">
                <h3 className="font-subtitle text-2xl text-brand-brown mb-3">{b.title}</h3>
                <p className="text-brand-dark/70 font-body leading-relaxed">{b.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="relative aspect-[21/9] min-h-[320px] overflow-hidden">
            <Image
              src={media.vip}
              alt="Sector VIP — deck exclusivo con vista panorámica"
              fill
              className="object-cover"
              style={{ objectPosition: 'center 45%' }}
              sizes="100vw"
              quality={92}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-black/75 via-brand-black/30 to-transparent" />
            <div className="absolute inset-4 md:inset-6 border border-brand-gold/25 pointer-events-none" />
            <div className="absolute inset-0 flex items-center px-8 md:px-14">
              <div>
                <p className="text-xs tracking-[0.35em] uppercase text-brand-gold font-body mb-3">Sector VIP</p>
                <h3 className="font-display text-3xl md:text-5xl text-brand-cream mb-3">Mayor privacidad</h3>
                <p className="text-brand-cream/80 font-body max-w-md leading-relaxed">
                  Deck de madera exclusivo, camas Bali y una experiencia premium sobre las luces de la ciudad.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <div className="mt-16 text-center">
          <Button href="/reservas">Consultar disponibilidad</Button>
        </div>
      </div>
    </div>
  );
}
