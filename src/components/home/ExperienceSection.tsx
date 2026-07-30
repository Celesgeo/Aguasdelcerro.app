import Image from 'next/image';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';

interface ExperienceSectionProps {
  image: string;
  landscapeImage?: string;
}

export default function ExperienceSection({ image, landscapeImage }: ExperienceSectionProps) {
  return (
    <section className="bg-brand-cream py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal>
            <div className="grid gap-4">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={landscapeImage ?? image}
                  alt="Paisaje de La Rioja al anochecer"
                  fill
                  className="object-cover"
                  style={{ objectPosition: 'center 42%' }}
                  sizes="(max-width:1024px) 100vw, 50vw"
                />
              </div>
              {landscapeImage && (
                <div className="relative aspect-[21/9] overflow-hidden">
                  <Image
                    src={image}
                    alt="Atardecer en Aguas del Cerro"
                    fill
                    className="object-cover"
                    style={{ objectPosition: 'center 50%' }}
                    sizes="(max-width:1024px) 100vw, 50vw"
                  />
                </div>
              )}
            </div>
          </ScrollReveal>
          <div>
            <SectionHeading
              align="left"
              eyebrow="Nuestra experiencia"
              title="Donde el tiempo se detiene"
              description="Entre montañas y silencio, cada instante invita a respirar distinto. No buscamos impresionar: buscamos que te quedes con la sensación de haber encontrado un refugio."
            />
            <ScrollReveal delay={0.15}>
              <p className="text-brand-dark/70 leading-relaxed font-body text-lg">
                La naturaleza riojana, el bienestar del parque térmico y la calma de un mirador que mira al horizonte
                se combinan en una experiencia pensada para reconectar cuerpo y mente.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
