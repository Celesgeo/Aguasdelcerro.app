'use client';

import SectionHeading from '@/components/shared/SectionHeading';
import ScrollReveal from '@/components/shared/ScrollReveal';
import { useLocaleDict, useT } from '@/components/i18n/LanguageProvider';

export function FAQSection() {
  const dict = useLocaleDict();

  return (
    <section className="bg-brand-cream py-28">
      <div className="mx-auto max-w-3xl px-6">
        <SectionHeading i18n={{ eyebrow: 'home.faqKicker', title: 'home.faqTitle' }} />
        <div className="space-y-4">
          {dict.faq.map((item, i) => (
            <ScrollReveal key={item.q} delay={i * 0.05}>
              <details className="group border border-brand-brown/10 bg-white p-6">
                <summary className="cursor-pointer list-none font-subtitle text-lg text-brand-brown flex justify-between items-center">
                  {item.q}
                  <span className="text-brand-gold group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="mt-4 text-brand-dark/70 font-body leading-relaxed">{item.a}</p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TimelineSection() {
  const dict = useLocaleDict();

  return (
    <section className="bg-brand-brown py-28">
      <div className="mx-auto max-w-4xl px-6">
        <SectionHeading light i18n={{ eyebrow: 'home.timelineKicker', title: 'home.timelineTitle' }} />
        <div className="space-y-10 border-l border-brand-gold/20 pl-8">
          {dict.timeline.map((item, i) => (
            <ScrollReveal key={item.year} delay={i * 0.08}>
              <div className="relative">
                <span className="absolute -left-[41px] top-1 h-3 w-3 rounded-full bg-brand-gold" />
                <p className="text-brand-gold text-sm tracking-[0.2em] uppercase font-body">{item.year}</p>
                <h3 className="font-subtitle text-2xl text-brand-cream mt-1">{item.title}</h3>
                <p className="mt-2 text-brand-cream/65 font-body">{item.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhyUsSection() {
  const dict = useLocaleDict();

  return (
    <section className="py-28 bg-white">
      <div className="mx-auto max-w-5xl px-6">
        <SectionHeading i18n={{ eyebrow: 'home.whyKicker', title: 'home.whyTitle' }} />
        <div className="grid md:grid-cols-2 gap-6">
          {dict.why.map((r, i) => (
            <ScrollReveal key={r} delay={i * 0.06}>
              <div className="border-l-2 border-brand-gold pl-6 py-2">
                <p className="font-body text-brand-dark/75 text-lg">{r}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TestimonialsSection() {
  const t = useT();

  return (
    <section className="py-20 bg-brand-cream/50 text-center">
      <p className="text-xs tracking-[0.3em] uppercase text-brand-gold font-body mb-3">{t('home.testimonialsKicker')}</p>
      <p className="font-body text-brand-dark/50">{t('home.testimonialsSoon')}</p>
    </section>
  );
}
