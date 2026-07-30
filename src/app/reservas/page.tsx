import type { Metadata } from 'next';
import SectionHeading from '@/components/shared/SectionHeading';
import ReservationForm from '@/components/shared/ReservationForm';

export const metadata: Metadata = {
  title: 'Reservas',
  description: 'Reservá tu experiencia en Aguas del Cerro. Parque térmico y mirador gastronómico en La Rioja.',
};

export default function ReservasPage() {
  return (
    <div className="pt-28 pb-28 bg-brand-cream min-h-screen">
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
