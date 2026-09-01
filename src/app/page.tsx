import Hero from '@/components/home/Hero';
import ExperienceSection from '@/components/home/ExperienceSection';
import TermasSection from '@/components/home/TermasSection';
import MiradorSection from '@/components/home/MiradorSection';
import ExperiencesGrid from '@/components/home/ExperiencesGrid';
import CountdownSection from '@/components/home/CountdownSection';
import WeatherWidget from '@/components/home/WeatherWidget';
import MapSection from '@/components/home/MapSection';
import {
  FAQSection,
  TimelineSection,
  WhyUsSection,
  TestimonialsSection,
} from '@/components/home/ExtraSections';
import InstagramButton from '@/components/shared/InstagramButton';
import InstagramGallery from '@/components/shared/InstagramGallery';
import SectionHeading from '@/components/shared/SectionHeading';
import { getHeroMedia, getSectionMedia } from '@/lib/media';

export default function HomePage() {
  const hero = getHeroMedia();
  const sections = getSectionMedia();

  return (
    <>
      <Hero videoSrc={hero.video} fallbackImage={hero.fallbackImage} slides={hero.slides} />
      <ExperienceSection />
      <TermasSection image={sections.termas} overviewImage={sections.termas} vipImage={sections.cartel} />
      <MiradorSection image={sections.mirador} />
      <ExperiencesGrid />
      <CountdownSection />
      <WeatherWidget />
      <WhyUsSection />
      <TimelineSection />
      <section className="py-28 bg-brand-brown">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <SectionHeading
            light
            eyebrow="Instagram"
            title="La experiencia en imágenes"
            description="Termas, mirador y paisajes riojanos. Seguinos para ver novedades y momentos del día a día."
          />
          <InstagramGallery />
          <div className="mt-12 text-center">
            <InstagramButton />
          </div>
        </div>
      </section>
      <MapSection />
      <FAQSection />
      <TestimonialsSection />
    </>
  );
}
