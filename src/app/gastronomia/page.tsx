import type { Metadata } from 'next';
import Image from 'next/image';
import JsonLd from '@/components/seo/JsonLd';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import Button from '@/components/shared/Button';
import { getImagesByCategory } from '@/lib/media';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Gastronomía',
  description:
    'Mirador gastronómico con cocina regional, atardeceres y vista panorámica en Aguas del Cerro, La Rioja.',
  path: '/gastronomia',
  image: '/images/real/real-evento-mirador-noche.jpg',
  keywords: ['mirador gastronómico', 'restaurante montaña', 'cocina regional La Rioja'],
});

export default function GastronomiaPage() {
  const images = getImagesByCategory('mirador');
  const hero =
    images.find((i) => i.orientation === 'landscape')?.src ??
    images[0]?.src ??
    '/images/real/real-evento-mirador-noche.jpg';

  return (
    <div className="bg-brand-cream">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Gastronomía', path: '/gastronomia' },
        ])}
      />
      <section className="relative h-[70vh] min-h-[500px]">
        <Image
          src={hero}
          alt="Mirador gastronómico"
          fill
          priority
          className="object-cover"
          style={{ objectPosition: 'center 58%' }}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-brand-black/45" />
        <div className="relative z-10 flex h-full items-end pb-20 px-6 lg:px-10 max-w-7xl mx-auto">
          <div>
            <p className="text-xs tracking-[0.35em] uppercase text-brand-gold mb-4 font-body">Gastronomía</p>
            <h1 className="font-display text-5xl md:text-6xl text-brand-cream max-w-3xl">Mirador Gastronómico</h1>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-6 py-28 lg:px-10">
        <ScrollReveal>
          <p className="text-xl leading-relaxed text-brand-dark/75 font-body text-center mb-12">
            Sabores de La Rioja elevados a una experiencia contemplativa. Mesas bajo el cielo, luces cálidas
            y montañas que se tiñen de oro al caer la tarde.
          </p>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {['Cocina regional', 'Atardeceres únicos', 'Vista panorámica'].map((item) => (
            <ScrollReveal key={item}>
              <div className="border border-brand-brown/10 p-8 bg-white">
                <h3 className="font-subtitle text-xl text-brand-brown">{item}</h3>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button href="/reservas">Reservar mesa</Button>
        </div>
      </div>
    </div>
  );
}
