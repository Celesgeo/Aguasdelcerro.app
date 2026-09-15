import type { Metadata } from 'next';
import GalleryGrid from '@/components/galeria/GalleryGrid';
import JsonLd from '@/components/seo/JsonLd';
import SectionHeading from '@/components/shared/SectionHeading';
import { getGalleryImages } from '@/lib/media';
import { getAllExperienceImages } from '@/lib/experiences-media';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';
import type { MediaImage } from '@/lib/media';

export const metadata: Metadata = createPageMetadata({
  title: 'Galería',
  description:
    'Galería fotográfica de Aguas del Cerro: parque térmico, naturaleza, mirador gastronómico y paisajes de La Rioja.',
  path: '/galeria',
  keywords: ['galería fotos', 'parque térmico imágenes', 'mirador La Rioja'],
});

export default function GaleriaPage() {
  const editorial: MediaImage[] = getAllExperienceImages().map((exp) => ({
    src: exp.src,
    filename: exp.src.split('/').pop() ?? exp.slug,
    category: 'experiencia',
    alt: exp.title,
    orientation: 'landscape',
  }));
  const images = [...editorial, ...getGalleryImages()];

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
          i18n={{
            eyebrow: 'pages.gallery.kicker',
            title: 'pages.gallery.title',
            description: 'pages.gallery.description',
          }}
        />
        <GalleryGrid images={images} />
      </div>
    </div>
  );
}
