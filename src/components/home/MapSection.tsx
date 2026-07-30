import { SITE } from '@/lib/constants';
import Button from '@/components/shared/Button';
import SectionHeading from '@/components/shared/SectionHeading';

export default function MapSection() {
  return (
    <section className="bg-brand-cream py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading eyebrow="Ubicación" title="En el corazón de La Rioja" description="Montaña, valle y cielo abierto te esperan." />
        <div className="overflow-hidden border border-brand-brown/10 shadow-xl">
          <iframe
            title="Mapa Aguas del Cerro"
            src={`https://maps.google.com/maps?q=${SITE.coordinates.lat},${SITE.coordinates.lng}&z=15&output=embed`}
            className="h-[420px] w-full grayscale-[20%]"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="mt-8 text-center">
          <Button href={SITE.mapsUrl}>Cómo llegar</Button>
        </div>
      </div>
    </section>
  );
}
