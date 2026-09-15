import Hero from '@/components/home/Hero';
import ExperienceSection from '@/components/home/ExperienceSection';
import TermasSection from '@/components/home/TermasSection';
import MiradorSection from '@/components/home/MiradorSection';
import ExperiencesGrid from '@/components/home/ExperiencesGrid';
import ExperienceMarqueeGallery from '@/components/home/ExperienceMarqueeGallery';
import BrandPhraseMarquee from '@/components/home/BrandPhraseMarquee';
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
import { getSectionMedia } from '@/lib/media';

export default function HomePage() {
  const sections = getSectionMedia();

  return (
    <div className="overflow-x-clip">
      <Hero image="/images/real/real-termas-atardecer.jpg" />
      <ExperienceSection />
      <TermasSection />
      <MiradorSection image={sections.mirador} />
      <ExperiencesGrid />
      <ExperienceMarqueeGallery />
      <BrandPhraseMarquee />
      <CountdownSection />
      <WeatherWidget />
      <WhyUsSection />
      <TimelineSection />
      <section className="py-28 bg-brand-brown">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <SectionHeading
            light
            i18n={{
              eyebrow: 'home.instagramKicker',
              title: 'home.instagramTitle',
              description: 'home.instagramDescription',
            }}
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
    </div>
  );
}
