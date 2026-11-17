'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './LechuzaAsomada.module.css';

/**
 * Lechucita de Aguas del Cerro (vizcachera). Mientras se hace scroll aparece
 * cada vez de un lugar distinto: se asoma desde abajo, saluda desde un costado,
 * cuelga de arriba sonriendo o espía detrás de un título. Cuando el scroll se
 * detiene, se vuelve a esconder.
 */

type Pose = 'abajo' | 'costado' | 'colgada' | 'titulo';

const ORDEN: Pose[] = ['abajo', 'titulo', 'costado', 'colgada', 'titulo', 'abajo', 'costado', 'titulo', 'colgada'];
const OCULTAR_MS = 1700;

function tituloVisible(): DOMRect | null {
  const alto = window.innerHeight;
  const candidatos = Array.from(document.querySelectorAll('main h2'));
  for (const h of candidatos) {
    const r = document.createRange();
    r.selectNodeContents(h);
    const rect = r.getBoundingClientRect();
    if (rect.width > 40 && rect.top > 150 && rect.top < alto - 120) return rect;
  }
  return null;
}

export default function LechuzaAsomada() {
  const [pose, setPose] = useState<Pose>('abajo');
  const [visible, setVisible] = useState(false);
  const [lado, setLado] = useState<'izq' | 'der'>('izq');
  const [mira, setMira] = useState<'abajo' | 'arriba'>('abajo');
  const [pos, setPos] = useState<CSSProperties>({});
  const estado = useRef({ activa: false, paso: 0, poseActual: 'abajo' as Pose, timer: 0, raf: 0 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const s = estado.current;
    let lastY = window.scrollY;

    const ubicarEnTitulo = () => {
      const rect = tituloVisible();
      if (!rect) {
        setVisible(false);
        return;
      }
      const ancho = window.innerWidth < 768 ? 58 : 76;
      const left = Math.min(window.innerWidth - ancho - 8, Math.max(8, rect.right - ancho * 0.35));
      setPos({ left, top: rect.top - ancho * 0.62, width: ancho, height: ancho * 0.62 });
    };

    const empezar = () => {
      let siguiente = ORDEN[s.paso % ORDEN.length];
      s.paso += 1;
      if (siguiente === 'titulo' && !tituloVisible()) siguiente = 'abajo';
      s.poseActual = siguiente;
      setPose(siguiente);
      setLado(Math.random() < 0.5 ? 'izq' : 'der');
      if (siguiente === 'titulo') ubicarEnTitulo();
      else setPos({});
      // Un cuadro después, para que la transición de entrada se vea
      requestAnimationFrame(() => setVisible(true));
      s.activa = true;
    };

    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY) < 3) return;
      setMira(y > lastY ? 'abajo' : 'arriba');
      lastY = y;
      if (y < 250) return;
      if (!s.activa) empezar();
      else if (s.poseActual === 'titulo') {
        cancelAnimationFrame(s.raf);
        s.raf = requestAnimationFrame(ubicarEnTitulo);
      }
      window.clearTimeout(s.timer);
      s.timer = window.setTimeout(() => {
        setVisible(false);
        window.setTimeout(() => (s.activa = false), 650);
      }, OCULTAR_MS);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(s.timer);
      cancelAnimationFrame(s.raf);
    };
  }, []);

  const clases = [
    styles.lechuza,
    styles[pose],
    lado === 'der' ? styles.der : styles.izq,
    mira === 'arriba' ? styles.miraArriba : styles.miraAbajo,
    visible ? styles.visible : '',
  ].join(' ');

  return (
    <div className={clases} style={pose === 'titulo' ? pos : undefined} aria-hidden="true">
      {pose === 'colgada' && <span className={styles.rama} />}
      <div className={styles.ave}>
        <svg viewBox="0 0 120 170" className={styles.svg}>
          <defs>
            <linearGradient id="bh-plumas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#9b7650" />
              <stop offset="1" stopColor="#6f4f31" />
            </linearGradient>
            <radialGradient id="bh-cara" cx="50%" cy="45%" r="60%">
              <stop offset="0" stopColor="#e3cba3" />
              <stop offset="1" stopColor="#bf9d6e" />
            </radialGradient>
            <radialGradient id="bh-ojo" cx="45%" cy="40%" r="60%">
              <stop offset="0" stopColor="#ffe48a" />
              <stop offset="0.7" stopColor="#f2b928" />
              <stop offset="1" stopColor="#c98a12" />
            </radialGradient>
            <linearGradient id="bh-ala" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7d5a38" />
              <stop offset="1" stopColor="#57391f" />
            </linearGradient>
          </defs>
          <g className={styles.patas}>
            <path d="M51 128v26M69 128v26" stroke="#d8c7a2" strokeWidth="5" strokeLinecap="round" />
            <path d="M51 154l-6 5M51 154l1 6M51 154l6 4M69 154l-6 4M69 154l-1 6M69 154l6 5" stroke="#8c7a55" strokeWidth="2" strokeLinecap="round" />
          </g>
          <path d="M28 100C26 70 40 58 60 58s34 12 32 42c-2 24-16 34-32 34s-30-10-32-34z" fill="url(#bh-plumas)" />
          <path d="M42 98c0-20 8-29 18-29s18 9 18 29-8 31-18 31-18-11-18-31z" fill="#efe2c6" />
          <path d="M51.2 78.0q2.2 1.6 4.4 0M63.8 78.0q2.2 1.6 4.4 0M50.7 83.4q2.2 1.6 4.4 0M65.1 83.4q2.2 1.6 4.4 0M46.4 88.8q2.2 1.6 4.4 0M57.4 88.8q2.2 1.6 4.4 0M67.8 88.8q2.2 1.6 4.4 0M47.1 94.2q2.2 1.6 4.4 0M58.7 94.2q2.2 1.6 4.4 0M69.3 94.2q2.2 1.6 4.4 0M46.2 99.6q2.2 1.6 4.4 0M57.3 99.6q2.2 1.6 4.4 0M68.4 99.6q2.2 1.6 4.4 0M46.7 105.0q2.2 1.6 4.4 0M58.3 105.0q2.2 1.6 4.4 0M68.0 105.0q2.2 1.6 4.4 0M48.2 110.4q2.2 1.6 4.4 0M57.1 110.4q2.2 1.6 4.4 0M68.5 110.4q2.2 1.6 4.4 0M50.4 115.8q2.2 1.6 4.4 0M65.1 115.8q2.2 1.6 4.4 0M53.4 121.2q2.2 1.6 4.4 0M63.0 121.2q2.2 1.6 4.4 0" stroke="#8a6a44" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.75" />
          <g className={styles.alaIzq}>
            <path d="M31 80c-10 16-9 38 4 52 6-14 7-34 3-52z" fill="url(#bh-ala)" />
            <circle cx="34.6" cy="120.2" r="1.7" fill="#efe2c6" /><circle cx="30.7" cy="124.5" r="1.7" fill="#efe2c6" /><circle cx="32.2" cy="122.7" r="1.1" fill="#efe2c6" /><circle cx="33.7" cy="118.6" r="1.1" fill="#efe2c6" /><circle cx="35.6" cy="109.4" r="1.4" fill="#efe2c6" /><circle cx="34.9" cy="108.3" r="1.4" fill="#efe2c6" /><circle cx="36.5" cy="90.5" r="1.7" fill="#efe2c6" /><circle cx="31.2" cy="87.2" r="1.1" fill="#efe2c6" /><circle cx="31.1" cy="111.7" r="1.7" fill="#efe2c6" /><circle cx="33.7" cy="94.4" r="1.4" fill="#efe2c6" /><circle cx="31.2" cy="108.4" r="1.4" fill="#efe2c6" /><circle cx="32.1" cy="96.4" r="1.7" fill="#efe2c6" /><circle cx="28.2" cy="109.5" r="1.1" fill="#efe2c6" /><circle cx="37.4" cy="91.8" r="1.1" fill="#efe2c6" />
            
            {/* manchas */}
          </g>
          <g className={styles.alaDer}>
            <path d="M89 80c10 16 9 38-4 52-6-14-7-34-3-52z" fill="url(#bh-ala)" />
            <circle cx="85.4" cy="120.2" r="1.7" fill="#efe2c6" /><circle cx="89.3" cy="124.5" r="1.7" fill="#efe2c6" /><circle cx="87.8" cy="122.7" r="1.1" fill="#efe2c6" /><circle cx="86.3" cy="118.6" r="1.1" fill="#efe2c6" /><circle cx="84.4" cy="109.4" r="1.4" fill="#efe2c6" /><circle cx="85.1" cy="108.3" r="1.4" fill="#efe2c6" /><circle cx="83.5" cy="90.5" r="1.7" fill="#efe2c6" /><circle cx="88.8" cy="87.2" r="1.1" fill="#efe2c6" /><circle cx="88.9" cy="111.7" r="1.7" fill="#efe2c6" /><circle cx="86.3" cy="94.4" r="1.4" fill="#efe2c6" /><circle cx="88.8" cy="108.4" r="1.4" fill="#efe2c6" /><circle cx="87.9" cy="96.4" r="1.7" fill="#efe2c6" /><circle cx="91.8" cy="109.5" r="1.1" fill="#efe2c6" /><circle cx="82.6" cy="91.8" r="1.1" fill="#efe2c6" />
          </g>
          <g className={styles.cabeza}>
            <ellipse cx="60" cy="40" rx="31" ry="28" fill="url(#bh-plumas)" />
            <circle cx="49.4" cy="20.1" r="1.3" fill="#f1e4c8" /><circle cx="35.2" cy="34.6" r="0.9" fill="#f1e4c8" /><circle cx="35.4" cy="34.9" r="1.3" fill="#f1e4c8" /><circle cx="37.4" cy="24.1" r="1.3" fill="#f1e4c8" /><circle cx="65.0" cy="15.3" r="1.3" fill="#f1e4c8" /><circle cx="53.8" cy="64.7" r="0.9" fill="#f1e4c8" /><circle cx="63.4" cy="19.2" r="1.1" fill="#f1e4c8" /><circle cx="62.9" cy="15.4" r="0.9" fill="#f1e4c8" /><circle cx="51.7" cy="25.4" r="0.9" fill="#f1e4c8" /><circle cx="71.9" cy="25.2" r="1.3" fill="#f1e4c8" /><circle cx="66.5" cy="16.0" r="1.3" fill="#f1e4c8" /><circle cx="32.4" cy="48.1" r="1.3" fill="#f1e4c8" /><circle cx="86.7" cy="37.6" r="1.3" fill="#f1e4c8" /><circle cx="33.9" cy="51.5" r="1.1" fill="#f1e4c8" /><circle cx="68.8" cy="65.6" r="1.1" fill="#f1e4c8" /><circle cx="57.7" cy="21.1" r="0.9" fill="#f1e4c8" /><circle cx="59.6" cy="23.8" r="1.1" fill="#f1e4c8" /><circle cx="37.8" cy="25.4" r="1.1" fill="#f1e4c8" /><circle cx="85.0" cy="38.8" r="0.9" fill="#f1e4c8" /><circle cx="83.0" cy="56.2" r="1.3" fill="#f1e4c8" /><circle cx="40.6" cy="24.5" r="0.9" fill="#f1e4c8" /><circle cx="40.9" cy="27.2" r="0.9" fill="#f1e4c8" /><circle cx="53.9" cy="17.6" r="1.3" fill="#f1e4c8" /><circle cx="54.0" cy="22.3" r="0.9" fill="#f1e4c8" /><circle cx="56.4" cy="17.9" r="1.3" fill="#f1e4c8" /><circle cx="38.9" cy="25.6" r="1.1" fill="#f1e4c8" /><circle cx="88.7" cy="37.9" r="1.1" fill="#f1e4c8" /><circle cx="50.6" cy="26.3" r="1.3" fill="#f1e4c8" /><circle cx="87.1" cy="40.5" r="0.9" fill="#f1e4c8" /><circle cx="75.5" cy="28.1" r="1.3" fill="#f1e4c8" /><circle cx="49.8" cy="24.0" r="0.9" fill="#f1e4c8" /><circle cx="74.4" cy="24.2" r="1.3" fill="#f1e4c8" /><circle cx="58.3" cy="22.5" r="1.3" fill="#f1e4c8" /><circle cx="87.4" cy="36.2" r="1.3" fill="#f1e4c8" /><circle cx="51.9" cy="23.9" r="0.9" fill="#f1e4c8" /><circle cx="59.0" cy="65.2" r="1.3" fill="#f1e4c8" /><circle cx="35.1" cy="47.7" r="1.1" fill="#f1e4c8" /><circle cx="58.7" cy="21.6" r="1.3" fill="#f1e4c8" /><circle cx="88.3" cy="33.4" r="1.1" fill="#f1e4c8" /><circle cx="74.6" cy="16.6" r="0.9" fill="#f1e4c8" /><circle cx="78.4" cy="19.9" r="1.3" fill="#f1e4c8" /><circle cx="88.8" cy="47.5" r="1.1" fill="#f1e4c8" /><circle cx="73.6" cy="17.5" r="1.3" fill="#f1e4c8" /><circle cx="86.0" cy="35.4" r="0.9" fill="#f1e4c8" /><circle cx="79.6" cy="23.4" r="1.1" fill="#f1e4c8" /><circle cx="33.7" cy="52.0" r="1.1" fill="#f1e4c8" />
            <ellipse cx="60" cy="45" rx="25" ry="20" fill="url(#bh-cara)" stroke="#6f4f31" strokeWidth="1.2" />
            <path d="M37 37q11-9 22-1M83 37q-11-9-22-1" stroke="#f6eedb" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            <g className={styles.ojos}>
              <circle cx="49" cy="44" r="7.6" fill="url(#bh-ojo)" stroke="#3a2412" strokeWidth="1" />
              <circle cx="71" cy="44" r="7.6" fill="url(#bh-ojo)" stroke="#3a2412" strokeWidth="1" />
              <circle className={styles.pupila} cx="49" cy="44" r="4" fill="#120904" />
              <circle className={styles.pupila} cx="71" cy="44" r="4" fill="#120904" />
              <circle cx="47" cy="41.8" r="1.6" fill="#fff" />
              <circle cx="69" cy="41.8" r="1.6" fill="#fff" />
            </g>
            <g className={styles.parpados}>
              <ellipse cx="49" cy="44" rx="8.2" ry="8.2" fill="#a8845a" />
              <ellipse cx="71" cy="44" rx="8.2" ry="8.2" fill="#a8845a" />
            </g>
            <g className={styles.feliz}>
              <ellipse cx="49" cy="44" rx="8.4" ry="8.4" fill="#c9a77a" />
              <ellipse cx="71" cy="44" rx="8.4" ry="8.4" fill="#c9a77a" />
              <path d="M42.5 45q6.5-7 13 0M64.5 45q6.5-7 13 0" stroke="#2a170a" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            </g>
            <path d="M57 50q3 8 6 0q-3 2-6 0z" fill="#c4b58a" stroke="#7d6c45" strokeWidth="0.6" />
            <path d="M47 59q13 8 26 0" stroke="#f6eedb" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </div>
    </div>
  );
}
