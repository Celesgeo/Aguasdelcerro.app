import Image from 'next/image';
import { Droplets, Leaf, Moon, Sparkles } from 'lucide-react';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import { TERMAS_BENEFITS } from '@/lib/constants';

const icons = [Droplets, Leaf, Moon, Sparkles];

interface TermasSectionProps {
  image: string;
  vipImage?: string;
  overviewImage?: string;
}

export default function TermasSection({ image, vipImage, overviewImage }: TermasSectionProps) {
  const main = overviewImage ?? image;
  const detail = vipImage ?? image;

  return (
    <section className="bg-brand-brown py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          light
          eyebrow="Parque Térmico"
          title="Calor que envuelve el cuerpo"
          description="Aguas térmicas mineralizadas en piscinas de piedra natural, integradas al paisaje de La Rioja."
        />

        <div className="mb-16 grid gap-4 lg:grid-cols-12">
          <ScrollReveal className="lg:col-span-8">
            <div className="relative aspect-[16/10] overflow-hidden border border-brand-gold/15">
              <Image
                src={main}
                alt="Piletas privadas en la colina al anochecer"
                fill
                className="object-cover"
                style={{ objectPosition: 'center 48%' }}
                sizes="(max-width:1024px) 100vw, 66vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-brown/55 via-transparent to-transparent" />
              <p className="absolute bottom-5 left-5 text-xs tracking-[0.25em] uppercase text-brand-cream/80 font-body">
                Vista general · 13 piletas privadas
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1} className="lg:col-span-4">
            <div className="relative aspect-[16/10] lg:aspect-auto lg:h-full min-h-[280px] overflow-hidden border border-brand-gold/15">
              <Image
                src={detail}
                alt="Sector VIP con deck de madera y cama Bali"
                fill
                className="object-cover"
                style={{ objectPosition: 'center 40%' }}
                sizes="(max-width:1024px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-brown/70 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-xs tracking-[0.25em] uppercase text-brand-gold font-body mb-2">Sector VIP</p>
                <p className="font-subtitle text-xl text-brand-cream">Deck exclusivo · Camas Bali</p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {TERMAS_BENEFITS.map((item, i) => {
            const Icon = icons[i] ?? Droplets;
            return (
              <ScrollReveal key={item.title} delay={i * 0.08}>
                <div className="group h-full border border-brand-gold/15 bg-brand-cream/5 p-8 backdrop-blur-sm transition-all duration-500 hover:border-brand-gold/35 hover:bg-brand-cream/8">
                  <Icon className="mb-6 text-brand-gold" size={28} strokeWidth={1.2} />
                  <h3 className="font-subtitle text-xl text-brand-cream mb-3">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-brand-cream/65 font-body">{item.description}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
