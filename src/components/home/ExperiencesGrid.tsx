import Image from 'next/image';
import Link from 'next/link';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import { getAllExperienceImages } from '@/lib/experiences-media';

export default function ExperiencesGrid() {
  const items = getAllExperienceImages();
  const featured = items[0];
  const rest = items.slice(1);

  return (
    <section className="bg-brand-cream py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading
          eyebrow="Experiencias"
          title="Cada momento, una sensación distinta"
          description="Una curaduría de instantes pensados para quienes buscan belleza, calma y una estética de alto nivel en la montaña riojana."
        />

        {featured && (
          <ScrollReveal className="mb-8">
            <Link href="/experiencias" className="group relative block overflow-hidden">
              <div className="relative aspect-[21/9] min-h-[280px]">
                <Image
                  src={featured.src}
                  alt={featured.title}
                  fill
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
                  sizes="100vw"
                  quality={92}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-brand-black/75 via-brand-black/35 to-transparent" />
                <div className="absolute inset-0 border border-brand-gold/20 m-4 md:m-6 pointer-events-none" />
                <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-xl">
                  <p className="text-[11px] tracking-[0.4em] uppercase text-brand-gold font-body mb-3">
                    Destacada
                  </p>
                  <h3 className="font-display text-4xl md:text-5xl text-brand-cream mb-3">{featured.title}</h3>
                  <p className="font-body text-brand-cream/75 leading-relaxed">{featured.description}</p>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((exp, i) => (
            <ScrollReveal key={exp.slug} delay={i * 0.06}>
              <Link
                href="/experiencias"
                className="group relative block overflow-hidden bg-brand-black"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={exp.src}
                    alt={exp.title}
                    fill
                    className="object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-105"
                    sizes="(max-width:768px) 100vw, 33vw"
                    quality={90}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-black/85 via-brand-black/20 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="absolute inset-3 border border-brand-gold/15 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                  <div className="absolute bottom-0 inset-x-0 p-6 md:p-7">
                    <p className="text-[10px] tracking-[0.35em] uppercase text-brand-gold/90 font-body mb-2">
                      0{i + 2}
                    </p>
                    <h3 className="font-subtitle text-2xl text-brand-cream">{exp.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-cream/65 font-body line-clamp-2 opacity-0 translate-y-2 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                      {exp.description}
                    </p>
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
