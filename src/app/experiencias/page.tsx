import type { Metadata } from 'next';
import Image from 'next/image';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import { EXPERIENCES } from '@/lib/constants';
import { getGalleryImages } from '@/lib/media';

export const metadata: Metadata = {
  title: 'Experiencias',
  description: 'Descubrí las experiencias de Aguas del Cerro: relax, naturaleza, gastronomía y atardeceres en La Rioja.',
};

export default function ExperienciasPage() {
  const images = getGalleryImages();

  return (
    <div className="pt-28 pb-28 bg-brand-cream">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Experiencias"
          title="Viví La Rioja de otra manera"
          description="Cada experiencia está diseñada para despertar los sentidos y reconectar con lo esencial."
        />
        <div className="space-y-24">
          {EXPERIENCES.map((exp, i) => {
            const img = images[i % images.length];
            const reverse = i % 2 === 1;
            return (
              <ScrollReveal key={exp.slug}>
                <div className={`grid items-center gap-12 lg:grid-cols-2 ${reverse ? 'lg:[direction:rtl]' : ''}`}>
                  <div className={`relative aspect-[4/3] overflow-hidden ${reverse ? 'lg:[direction:ltr]' : ''}`}>
                    {img && <Image src={img.src} alt={exp.title} fill className="object-cover" sizes="50vw" />}
                  </div>
                  <div className={reverse ? 'lg:[direction:ltr]' : ''}>
                    <p className="text-xs tracking-[0.3em] uppercase text-brand-gold mb-3 font-body">0{i + 1}</p>
                    <h2 className="font-display text-4xl text-brand-brown mb-4">{exp.title}</h2>
                    <p className="text-lg leading-relaxed text-brand-dark/70 font-body">{exp.description}</p>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
