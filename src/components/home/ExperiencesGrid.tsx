import Image from 'next/image';
import Link from 'next/link';
import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import { EXPERIENCES } from '@/lib/constants';
import { MediaImage } from '@/lib/media';

interface ExperiencesGridProps {
  images: MediaImage[];
}

export default function ExperiencesGrid({ images }: ExperiencesGridProps) {
  return (
    <section className="bg-brand-cream py-28 lg:py-36">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHeading eyebrow="Experiencias" title="Cada momento, una sensación distinta" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {EXPERIENCES.map((exp, i) => {
            const img = images[i % images.length];
            return (
              <ScrollReveal key={exp.slug} delay={i * 0.05}>
                <Link href="/experiencias" className="group block overflow-hidden bg-white border border-brand-brown/5">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {img && (
                      <Image
                        src={img.src}
                        alt={exp.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width:768px) 100vw, 25vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 p-6">
                      <h3 className="font-subtitle text-2xl text-brand-cream">{exp.title}</h3>
                    </div>
                  </div>
                  <p className="p-5 text-sm leading-relaxed text-brand-dark/65 font-body">{exp.description}</p>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
