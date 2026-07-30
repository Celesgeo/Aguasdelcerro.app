'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { SITE } from '@/lib/constants';
import Button from '@/components/shared/Button';

export interface HeroSlide {
  src: string;
  alt: string;
  /** CSS object-position so the focal point stays visible */
  position?: string;
}

interface HeroProps {
  videoSrc?: string | null;
  fallbackImage: string;
  slides?: HeroSlide[];
}

const SLIDE_MS = 7000;

export default function Hero({ videoSrc, fallbackImage, slides = [] }: HeroProps) {
  const gallery =
    slides.length > 0
      ? slides
      : [{ src: fallbackImage, alt: SITE.name, position: 'center 58%' }];

  const [index, setIndex] = useState(0);
  const active = gallery[index] ?? gallery[0];

  useEffect(() => {
    if (videoSrc || gallery.length < 2) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % gallery.length);
    }, SLIDE_MS);
    return () => window.clearInterval(id);
  }, [videoSrc, gallery.length]);

  return (
    <section className="relative h-screen min-h-[700px] overflow-hidden">
      {videoSrc ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover scale-105"
          poster={fallbackImage}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <AnimatePresence mode="sync">
          <motion.div
            key={active.src}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={active.src}
              alt={active.alt}
              fill
              priority={index === 0}
              quality={90}
              className="object-cover"
              style={{ objectPosition: active.position ?? 'center 58%' }}
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-brand-black/45 via-brand-black/25 to-brand-black/65" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mb-6 text-xs tracking-[0.45em] uppercase text-brand-gold font-body"
        >
          {SITE.location}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="font-display text-5xl md:text-7xl lg:text-8xl text-brand-cream max-w-5xl leading-[0.95]"
        >
          {SITE.name}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="mt-6 font-subtitle text-xl md:text-2xl text-brand-cream/85 italic"
        >
          {SITE.tagline}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-12 flex flex-col sm:flex-row gap-4"
        >
          <Button href="/reservas">Reservar experiencia</Button>
          <Button href="/experiencias" variant="secondary">
            Descubrir
          </Button>
        </motion.div>
      </div>

      {!videoSrc && gallery.length > 1 && (
        <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {gallery.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              aria-label={`Ver imagen ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? 'w-8 bg-brand-gold' : 'w-1.5 bg-brand-cream/40 hover:bg-brand-cream/70'
              }`}
            />
          ))}
        </div>
      )}

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-brand-cream/70"
      >
        <ChevronDown size={28} />
      </motion.div>
    </section>
  );
}
