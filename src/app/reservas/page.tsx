import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import SectionHeading from '@/components/shared/SectionHeading';
import ReservationForm from '@/components/shared/ReservationForm';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Reservas',
  description:
    'Reservá tu experiencia en Aguas del Cerro. Parque térmico y mirador gastronómico en La Rioja, Argentina.',
  path: '/reservas',
  keywords: ['reservas', 'turnos parque térmico', 'reservar mirador'],
});

export default function ReservasPage() {
  return (
    <div className="pt-28 pb-28 bg-brand-cream min-h-screen">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'Inicio', path: '/' },
          { name: 'Reservas', path: '/reservas' },
        ])}
      />
      <div className="mx-auto max-w-4xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Reservas"
          title="Tu experiencia comienza aquí"
          description="Completá el formulario y te contactamos por WhatsApp con disponibilidad."
        />
        <ReservationForm />
      </div>
    </div>
  );
}
