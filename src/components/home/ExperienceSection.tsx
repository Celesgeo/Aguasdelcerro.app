import Image from 'next/image';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import { getExperienceImage } from '@/lib/experiences-media';

export default function ExperienceSection() {
  const primary = getExperienceImage('fotografia');
  const secondary = getExperienceImage('gastronomia');

  return (
    <section className="bg-brand-cream py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal>
            <div className="grid gap-5">
              <div className="group relative overflow-hidden">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={primary}
                    alt="Luz dorada sobre las montañas de La Rioja"
                    fill
                    className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.02]"
                    style={{ objectPosition: 'center 42%' }}
                    sizes="(max-width:1024px) 100vw, 50vw"
                    quality={92}
                  />
                </div>
                <div className="absolute inset-4 border border-brand-gold/20 pointer-events-none" />
              </div>
              <div className="group relative overflow-hidden">
                <div className="relative aspect-[21/9] overflow-hidden">
                  <Image
                    src={secondary}
                    alt="Mirador gastronómico al anochecer"
                    fill
                    className="object-cover transition-transform duration-[1.2s] group-hover:scale-[1.02]"
                    style={{ objectPosition: 'center 50%' }}
                    sizes="(max-width:1024px) 100vw, 50vw"
                    quality={92}
                  />
                </div>
                <div className="absolute inset-3 border border-brand-gold/15 pointer-events-none" />
              </div>
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
                La naturaleza riojana, el bienestar del parque térmico y la calma de un mirador que mira al horizonte se
                combinan en una experiencia pensada para reconectar cuerpo y mente — con una puesta en escena elegante y
                contemporánea.
              </p>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
