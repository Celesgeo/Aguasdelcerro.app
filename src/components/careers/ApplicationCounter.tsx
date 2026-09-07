'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Users } from 'lucide-react';
import { BASE_APPLICATION_COUNT } from '@/lib/careers';

function formatCount(value: number): string {
  return value.toLocaleString('es-AR');
}

export default function ApplicationCounter({
  value,
  highlight,
}: {
  value: number;
  highlight: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const previous = useRef(value);
  const firstPaint = useRef(true);

  useEffect(() => {
    if (reduceMotion) {
      setDisplay(value);
      previous.current = value;
      firstPaint.current = false;
      return;
    }

    const from = firstPaint.current ? Math.max(0, value - 64) : previous.current;
    firstPaint.current = false;
    previous.current = value;

    const started = performance.now();
    const duration = highlight ? 700 : 1400;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, highlight, reduceMotion]);

  return (
    <div className="relative mb-12 mx-auto max-w-2xl border border-brand-gold/25 bg-white px-6 py-8 text-center">
      <div className="absolute inset-3 border border-brand-gold/10 pointer-events-none" />
      <Users className="mx-auto mb-4 text-brand-gold" size={28} strokeWidth={1.4} />
      <p className="text-xs tracking-[0.35em] uppercase text-brand-gold font-body mb-3">
        Postulaciones recibidas
      </p>
      <div className="relative inline-flex items-start justify-center">
        <motion.p
          key={highlight ? `pulse-${value}` : 'count'}
          animate={highlight && !reduceMotion ? { scale: [1, 1.08, 1] } : { scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-5xl md:text-6xl text-brand-brown leading-none tabular-nums"
          aria-live="polite"
        >
          {formatCount(display)}
        </motion.p>
        <AnimatePresence>
          {highlight ? (
            <motion.span
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: -18, scale: 1 }}
              exit={{ opacity: 0, y: -32 }}
              transition={{ duration: 0.9 }}
              className="absolute -right-10 top-0 font-body text-sm tracking-[0.2em] uppercase text-brand-gold"
            >
              +1
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      <p className="mt-4 text-sm text-brand-dark/65 font-body leading-relaxed">
        Aproximadamente {formatCount(Math.max(value, BASE_APPLICATION_COUNT))} personas ya se
        postularon. Completá el formulario y sumate al equipo.
      </p>
    </div>
  );
}
