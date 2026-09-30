import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import SectionHeading from '@/components/shared/SectionHeading';
import VisitorShiftBooking from '@/components/shared/VisitorShiftBooking';
import { breadcrumbJsonLd, createPageMetadata } from '@/lib/seo';

export const metadata: Metadata = createPageMetadata({
  title: 'Reservas',
  description:
    'Reservá tu experiencia en Aguas del Cerro. Membresía visitante individual del parque térmico: $20.000 por persona. La Rioja, Argentina.',
  path: '/reservas',
  keywords: ['reservas', 'membresía visitante', 'membresía individual', 'mercado pago', 'reservar mirador'],
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
          i18n={{
            eyebrow: 'pages.reservations.kicker',
            title: 'pages.reservations.title',
            description: 'pages.reservations.description',
          }}
        />
        <VisitorShiftBooking />
      </div>
    </div>
  );
}
