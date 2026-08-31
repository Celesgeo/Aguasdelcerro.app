import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import SectionHeading from '@/components/shared/SectionHeading';
import CareersApplicationForm from '@/components/careers/CareersApplicationForm';
import { CAREERS_POSITIONS } from '@/lib/careers';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Trabajá con nosotros',
  description:
    'Sumate al equipo de Aguas del Cerro en La Rioja. Postulate para cocina, mozos, limpieza o seguridad en nuestro parque térmico y mirador gastronómico.',
  path: '/trabaja-con-nosotros',
  keywords: ['trabajo', 'empleo', 'postularse', 'La Rioja', 'gastronomía', 'turismo'],
});

export default function TrabajaConNosotrosPage() {
  return (
    <div className="pt-28 pb-28 bg-brand-cream min-h-screen">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Trabajá con nosotros', path: '/trabaja-con-nosotros' },
        ])}
      />
      <div className="mx-auto max-w-4xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Sumate al equipo"
          title="Trabajá con nosotros"
          description="Buscamos personas con actitud, compromiso y ganas de formar parte de una experiencia única en la montaña riojana."
        />

        <div className="mb-12 max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.25em] uppercase text-brand-gold font-body mb-4 text-center">
            Puestos disponibles
          </p>
          <ul className="flex flex-wrap justify-center gap-3">
            {CAREERS_POSITIONS.map((position) => (
              <li
                key={position.value}
                className="px-4 py-2 text-sm font-body text-brand-brown border border-brand-brown/15 bg-white"
              >
                {position.label}
              </li>
            ))}
          </ul>
        </div>

        <CareersApplicationForm />
      </div>
    </div>
  );
}
