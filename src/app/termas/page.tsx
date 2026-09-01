import type { Metadata } from 'next';
import Image from 'next/image';
import JsonLd from '@/components/seo/JsonLd';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import Button from '@/components/shared/Button';
import { TERMAS_BENEFITS } from '@/lib/constants';
import { getImagesByCategory, getSectionMedia } from '@/lib/media';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Parque Térmico',
  description:
    'Parque térmico en La Rioja, Argentina. Bienestar, relax y conexión con la naturaleza en Aguas del Cerro.',
  path: '/termas',
  image: '/images/real/real-termas-piletas.jpg',
  keywords: ['parque térmico', 'termas La Rioja', 'spa montaña', 'aguas termales'],
});

export default function TermasPage() {
  const sections = getSectionMedia();
  const images = getImagesByCategory('termas');
  const hero = images[0]?.src ?? sections.termas;
  const detail = sections.cartel;

  return (
    <div className="bg-brand-cream">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Parque Térmico', path: '/termas' },
        ])}
      />
      <section className="relative h-[75vh] min-h-[520px]">
        <Image
          src={hero}
          alt="Parque térmico"
          fill
          priority
          className="object-cover"
          style={{ objectPosition: 'center 48%' }}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-brand-black/40" />
        <div className="relative z-10 flex h-full items-end pb-20 px-6 max-w-7xl mx-auto">
          <h1 className="font-display text-5xl md:text-7xl text-brand-cream">Parque Térmico</h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
        <SectionHeading
          eyebrow="Bienestar"
          title="El agua como ritual"
          description="Piscinas de piedra natural integradas al paisaje. Aguas térmicas, silencio y montaña."
        />

        {images.length > 1 && (
          <div className="mb-16 grid gap-4 md:grid-cols-2">
            {images.slice(0, 4).map((img) => (
              <ScrollReveal key={img.src}>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    className="object-cover"
                    style={{ objectPosition: 'center 40%' }}
                    sizes="(max-width:768px) 100vw, 50vw"
                  />
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {TERMAS_BENEFITS.map((b) => (
            <ScrollReveal key={b.title}>
              <div className="bg-white border border-brand-brown/8 p-10">
                <h3 className="font-subtitle text-2xl text-brand-brown mb-3">{b.title}</h3>
                <p className="text-brand-dark/70 font-body leading-relaxed">{b.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {detail && (
          <ScrollReveal className="mt-16">
            <div className="relative aspect-[21/9] overflow-hidden">
              <Image
                src={detail}
                alt="Aguas del Cerro — cartel nocturno en el cerro"
                fill
                className="object-cover"
                style={{ objectPosition: 'center 40%' }}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-black/60 to-transparent" />
              <div className="absolute inset-0 flex items-center px-8 md:px-14">
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-brand-gold font-body mb-3">Sector VIP</p>
                  <h3 className="font-display text-3xl md:text-4xl text-brand-cream mb-2">Mayor privacidad</h3>
                  <p className="text-brand-cream/75 font-body max-w-md">
                    Deck de madera exclusivo, camas Bali y una experiencia premium sobre la ciudad.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        )}

        <div className="mt-16 text-center">
          <Button href="/reservas">Consultar disponibilidad</Button>
        </div>
      </div>
    </div>
  );
}
