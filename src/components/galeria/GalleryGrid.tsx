'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaImage } from '@/lib/media';

interface GalleryGridProps {
  images: MediaImage[];
  showFilter?: boolean;
}

const CATEGORIES = [
  { label: 'Todas', value: 'Todas' },
  { label: 'Parque Térmico', value: 'termas' },
  { label: 'Naturaleza', value: 'naturaleza' },
  { label: 'Mirador', value: 'mirador' },
  { label: 'Restaurante', value: 'restaurante' },
  { label: 'Paisajes', value: 'paisajes' },
  { label: 'Atardeceres', value: 'atardeceres' },
] as const;

export default function GalleryGrid({ images, showFilter = true }: GalleryGridProps) {
  const [filter, setFilter] = useState<string>('Todas');
  const [lightbox, setLightbox] = useState<MediaImage | null>(null);

  const filtered =
    filter === 'Todas'
      ? images
      : images.filter((i) => i.category === filter);

  return (
    <>
      {showFilter && (
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setFilter(cat.value)}
              className={`px-4 py-2 text-xs tracking-[0.15em] uppercase font-body transition-colors ${
                filter === cat.value ? 'bg-brand-brown text-brand-cream' : 'border border-brand-brown/20 text-brand-dark/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-[280px]">
        {filtered.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => setLightbox(img)}
            className={`group relative overflow-hidden ${
              img.orientation === 'portrait' ? 'md:row-span-2' : i % 5 === 0 ? 'md:col-span-2' : ''
            }`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width:768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-brand-black/0 group-hover:bg-brand-black/25 transition-colors" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-brand-black/95 flex items-center justify-center p-6"
            onClick={() => setLightbox(null)}
          >
            <button type="button" className="absolute top-6 right-6 text-brand-cream" onClick={() => setLightbox(null)}>
              <X size={28} />
            </button>
            <div className="relative w-full max-w-5xl aspect-[4/3]">
              <Image src={lightbox.src} alt={lightbox.alt} fill className="object-contain" sizes="90vw" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
