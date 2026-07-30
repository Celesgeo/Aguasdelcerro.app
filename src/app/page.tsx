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
import { getGalleryImages, getHeroMedia, getImagesByCategory } from '@/lib/media';

export default function HomePage() {
  const hero = getHeroMedia();
  const galleryImages = getGalleryImages();
  const termasImages = getImagesByCategory('termas');
  const termasImage = termasImages[0]?.src ?? '/images/termas-colina-noche-hd.png';
  const termasVip = termasImages.find((i) => i.filename.includes('vip'))?.src ?? '/images/termas-vip-deck-hd.png';
  const miradorImage =
    getImagesByCategory('mirador').find((i) => i.orientation === 'landscape')?.src ??
    '/images/mirador-atardecer-hd.png';
  const experienceImage =
    getImagesByCategory('atardeceres')[0]?.src ?? '/images/experiencia-atardecer-premium.png';
  const landscapeImage =
    getImagesByCategory('paisajes')[0]?.src ?? '/images/paisaje-cactus-luna-hd.png';

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
      <section className="py-20 bg-brand-brown text-center">
        <InstagramButton />
        <div className="mx-auto max-w-5xl px-6 mt-12">
          <InstagramGallery />
        </div>
      </section>
      <MapSection />
      <FAQSection />
      <TestimonialsSection />
    </>
  );
}
