import Image from 'next/image';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import Button from '@/components/shared/Button';

interface MiradorSectionProps {
  image: string;
}

export default function MiradorSection({ image }: MiradorSectionProps) {
  return (
    <section className="relative py-28 lg:py-36 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={image}
          alt="Mirador gastronómico al atardecer"
          fill
          className="object-cover"
          style={{ objectPosition: 'center 58%' }}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-brand-black/55" />
      </div>
      <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-10">
        <SectionHeading
          light
          eyebrow="Mirador Gastronómico"
          title="Sabores de montaña, cielos de oro"
          description="Comidas regionales, atardeceres inolvidables y una vista panorámica que abraza La Rioja."
        />
        <ScrollReveal>
          <Button href="/gastronomia" variant="primary">
            Conocer el mirador
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
