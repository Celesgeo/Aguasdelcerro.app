import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import LocalizedBleedHero from '@/components/shared/LocalizedBleedHero';
import ScrollReveal from '@/components/shared/ScrollReveal';
import Button from '@/components/shared/Button';
import Tx from '@/components/i18n/Tx';
import { getImagesByCategory, getSectionMedia } from '@/lib/media';
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
  const sections = getSectionMedia();
  const images = getImagesByCategory('mirador');
  const hero =
    images.find((i) => i.filename.includes('real-evento'))?.src ??
    sections.mirador;

  return (
    <div className="bg-brand-cream">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Gastronomía', path: '/gastronomia' },
        ])}
      />
      <LocalizedBleedHero image={hero} prefix="pages.gastronomy" position="center 58%" />

      <div className="mx-auto max-w-4xl px-6 py-28 lg:px-10">
        <ScrollReveal>
          <p className="text-xl leading-relaxed text-brand-dark/75 font-body text-center mb-12">
            <Tx k="pages.gastronomy.body" />
          </p>
        </ScrollReveal>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          {(['pillar1', 'pillar2', 'pillar3'] as const).map((pillar) => (
            <ScrollReveal key={pillar}>
              <div className="border border-brand-brown/10 p-8 bg-white">
                <h3 className="font-subtitle text-xl text-brand-brown">
                  <Tx k={`pages.gastronomy.${pillar}`} />
                </h3>
              </div>
            </ScrollReveal>
          ))}
        </div>
        <div className="mt-16 text-center">
          <Button href="/reservas">
            <Tx k="pages.gastronomy.cta" />
          </Button>
        </div>
      </div>
    </div>
  );
}
