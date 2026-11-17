'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './LechuzaAsomada.module.css';

/**
 * Lechuza de Aguas del Cerro: se asoma desde el borde inferior izquierdo
 * mientras se hace scroll, parpadea e inclina la cabeza, y vuelve a
 * esconderse cuando el scroll se detiene.
 */
export default function LechuzaAsomada() {
  const [visible, setVisible] = useState(false);
  const [mira, setMira] = useState<'izq' | 'der'>('der');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let lastY = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 4) return;
      setMira(y > lastY ? 'der' : 'izq');
      lastY = y;
      if (y < 200) return;
      setVisible(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setVisible(false), 1600);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className={`${styles.lechuza} ${visible ? styles.asomada : ''}`} aria-hidden="true">
      <svg viewBox="0 0 120 130" className={`${styles.cuerpo} ${mira === 'izq' ? styles.miraIzq : styles.miraDer}`}>
        <defs>
          <radialGradient id="lz-pecho" cx="50%" cy="40%" r="60%">
            <stop offset="0" stopColor="#f3e6cc" />
            <stop offset="1" stopColor="#d9c09a" />
          </radialGradient>
          <linearGradient id="lz-plumas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a8804c" />
            <stop offset="1" stopColor="#7a5530" />
          </linearGradient>
        </defs>

        {/* Rama */}
        <path d="M2 118c30-6 80-6 116-2" stroke="#5a3b1d" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M96 116c6-6 12-8 18-8" stroke="#5a3b1d" strokeWidth="3" strokeLinecap="round" fill="none" />
        <ellipse cx="110" cy="106" rx="6" ry="3" fill="#7d8a45" transform="rotate(-25 110 106)" />

        {/* Cuerpo */}
        <path d="M30 112c-8-30-6-62 30-66 36 4 38 36 30 66z" fill="url(#lz-plumas)" />
        <path d="M42 108c-4-20-2-42 18-44 20 2 22 24 18 44z" fill="url(#lz-pecho)" />
        <g stroke="#a8804c" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.7">
          <path d="M52 78l3 3 3-3M62 78l3 3 3-3M47 88l3 3 3-3M57 88l3 3 3-3M67 88l3 3 3-3M52 98l3 3 3-3M62 98l3 3 3-3" />
        </g>

        {/* Alas */}
        <path className={styles.alaIzq} d="M31 70c-10 12-10 30-2 42 6-4 10-20 8-38z" fill="#6b4626" />
        <path className={styles.alaDer} d="M89 70c10 12 10 30 2 42-6-4-10-20-8-38z" fill="#6b4626" />

        {/* Patitas */}
        <path d="M50 112l-3 6M53 112v7M56 112l3 6M64 112l-3 6M67 112v7M70 112l3 6" stroke="#c99a3c" strokeWidth="2" strokeLinecap="round" />

        {/* Cabeza */}
        <g className={styles.cabeza}>
          <path d="M28 40c0-20 14-30 32-30s32 10 32 30c0 18-14 28-32 28S28 58 28 40z" fill="url(#lz-plumas)" />
          <path d="M30 18l6 12 8-6zM90 18l-6 12-8-6z" fill="#7a5530" />
          <path d="M60 20c-14 0-24 8-24 20 0 10 8 18 24 18s24-8 24-18c0-12-10-20-24-20z" fill="#e9d8b8" />
          <g className={styles.ojos}>
            <circle cx="49" cy="38" r="9" fill="#fff8ea" />
            <circle cx="71" cy="38" r="9" fill="#fff8ea" />
            <circle cx="49" cy="38" r="6" fill="#d9a23a" />
            <circle cx="71" cy="38" r="6" fill="#d9a23a" />
            <circle className={styles.pupila} cx="49" cy="38" r="3.4" fill="#24130a" />
            <circle className={styles.pupila} cx="71" cy="38" r="3.4" fill="#24130a" />
            <circle cx="47.6" cy="36.4" r="1.3" fill="#fff" />
            <circle cx="69.6" cy="36.4" r="1.3" fill="#fff" />
          </g>
          <g className={styles.parpados}>
            <rect x="39" y="28" width="20" height="20" rx="10" fill="#c9a77a" />
            <rect x="61" y="28" width="20" height="20" rx="10" fill="#c9a77a" />
          </g>
          <path d="M57 46l3 6 3-6z" fill="#c99a3c" />
          <circle cx="40" cy="50" r="3" fill="#e8a38a" opacity="0.45" />
          <circle cx="80" cy="50" r="3" fill="#e8a38a" opacity="0.45" />
        </g>
      </svg>
    </div>
  );
}
