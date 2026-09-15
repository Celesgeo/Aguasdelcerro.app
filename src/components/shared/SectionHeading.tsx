'use client';

import ScrollReveal from './ScrollReveal';
import { useT } from '@/components/i18n/LanguageProvider';

interface SectionHeadingProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  align?: 'left' | 'center';
  light?: boolean;
  i18n?: {
    eyebrow?: string;
    title: string;
    description?: string;
  };
}

export default function SectionHeading({
  eyebrow,
  title = '',
  description,
  align = 'center',
  light = false,
  i18n,
}: SectionHeadingProps) {
  const t = useT();
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  const eyebrowText = i18n?.eyebrow ? t(i18n.eyebrow) : eyebrow;
  const titleText = i18n ? t(i18n.title) : title;
  const descriptionText = i18n?.description ? t(i18n.description) : description;

  return (
    <ScrollReveal className={`max-w-3xl mb-16 ${alignClass}`}>
      {eyebrowText && (
        <p className="mb-4 text-xs tracking-[0.35em] uppercase text-brand-gold font-body">{eyebrowText}</p>
      )}
      <h2
        className={`font-display text-4xl md:text-5xl lg:text-6xl leading-tight ${
          light ? 'text-brand-cream' : 'text-brand-brown'
        }`}
      >
        {titleText}
      </h2>
      {descriptionText && (
        <p className={`mt-6 text-lg leading-relaxed font-body ${light ? 'text-brand-cream/75' : 'text-brand-dark/70'}`}>
          {descriptionText}
        </p>
      )}
    </ScrollReveal>
  );
}
