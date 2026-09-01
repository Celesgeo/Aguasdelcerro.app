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
import { getGalleryImages, getHeroMedia, getImagesByCategory } from '@/lib/media';

export default function HomePage() {
  const hero = getHeroMedia();
  const galleryImages = getGalleryImages();
  const termasImages = getImagesByCategory('termas');
  const termasImage = termasImages[0]?.src ?? '/images/real/real-termas-piletas.jpg';
  const termasVip = termasImages[1]?.src ?? termasImages[0]?.src ?? '/images/real/real-termas-piletas.jpg';
  const miradorImage =
    getImagesByCategory('mirador').find((i) => i.orientation === 'landscape')?.src ??
    '/images/real/real-evento-mirador-noche.jpg';
  const experienceImage =
    getImagesByCategory('atardeceres')[0]?.src ?? '/images/real/real-atardecer-montana.jpg';
  const landscapeImage =
    getImagesByCategory('naturaleza')[0]?.src ?? '/images/real/real-naturaleza-lechuza.jpg';

  return (
    <>
      <Hero videoSrc={hero.video} fallbackImage={hero.fallbackImage} slides={hero.slides} />
      <ExperienceSection image={experienceImage} landscapeImage={landscapeImage} />
      <TermasSection image={termasImage} overviewImage={termasImage} vipImage={termasVip} />
      <MiradorSection image={miradorImage} />
      <ExperiencesGrid images={galleryImages} />
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
