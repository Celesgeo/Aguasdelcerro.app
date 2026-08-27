import type { Metadata } from 'next';
import GalleryGrid from '@/components/galeria/GalleryGrid';
import JsonLd from '@/components/seo/JsonLd';
import SectionHeading from '@/components/shared/SectionHeading';
import { getGalleryImages } from '@/lib/media';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Galería',
  description:
    'Galería fotográfica de Aguas del Cerro: parque térmico, naturaleza, mirador gastronómico y paisajes de La Rioja.',
  path: '/galeria',
  keywords: ['galería fotos', 'parque térmico imágenes', 'mirador La Rioja'],
});

export default function GaleriaPage() {
  const images = getGalleryImages();

  return (
    <div className="pt-28 pb-28 bg-brand-cream min-h-screen">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Galería', path: '/galeria' },
        ])}
      />
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Galería"
          title="Imágenes que cuentan una historia"
          description="Cada fotografía captura un instante de calma, luz y montaña."
        />
        <GalleryGrid images={images} />
      </div>
    </div>
  );
}
