import ScrollReveal from './ScrollReveal';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  light?: boolean;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  light = false,
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <ScrollReveal className={`max-w-3xl mb-16 ${alignClass}`}>
      {eyebrow && (
        <p className="mb-4 text-xs tracking-[0.35em] uppercase text-brand-gold font-body">
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-display text-4xl md:text-5xl lg:text-6xl leading-tight ${
          light ? 'text-brand-cream' : 'text-brand-brown'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-6 text-lg leading-relaxed font-body ${
            light ? 'text-brand-cream/75' : 'text-brand-dark/70'
          }`}
        >
          {description}
        </p>
      )}
    </ScrollReveal>
  );
}
