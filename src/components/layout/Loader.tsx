'use client';

import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SITE_READY_EVENT } from '@/lib/site-audio';
import {
  INTRO_ENABLED,
  INTRO_HOLD_MS,
  INTRO_REDUCED_HOLD_MS,
  INTRO_REDUCED_REVEAL_MS,
  INTRO_REVEAL_MS,
} from '@/lib/intro';
import { SITE } from '@/lib/constants';
import styles from './Loader.module.css';

const WATER_SRC = '/images/intro-water.jpg';
const EMBLEM_SRC = '/images/intro-emblem.png';

function releaseSite() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SITE_READY_EVENT));
}

/** Un error de intro no puede desmontar Navbar, Footer ni páginas como Trabajá con nosotros. */
class IntroBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    releaseSite();
  }

  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

function WaterCanvas({ reduced }: { reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [usePhoto, setUsePhoto] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setUsePhoto(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      setUsePhoto(true);
      return;
    }

    const water = new Image();
    water.src = WATER_SRC;

    let alive = true;
    let raf = 0;
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d', { alpha: false });

    const paintSource = () => {
      if (!offCtx || !water.naturalWidth) return;
      const w = canvas.width;
      const h = canvas.height;
      if (!w || !h) return;
      off.width = w;
      off.height = h;
      const iw = water.naturalWidth;
      const ih = water.naturalHeight;
      const scale = Math.max(w / iw, h / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      offCtx.fillStyle = '#070d12';
      offCtx.fillRect(0, 0, w, h);
      offCtx.drawImage(water, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };

    const resize = () => {
      try {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        canvas.width = Math.max(1, Math.round(canvas.clientWidth * dpr));
        canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
        paintSource();
      } catch {
        setUsePhoto(true);
      }
    };

    const loop = (now: number) => {
      if (!alive) return;
      try {
        const w = canvas.width;
        const h = canvas.height;
        if (!w || !h || off.width !== w) {
          raf = window.requestAnimationFrame(loop);
          return;
        }

        ctx.fillStyle = '#070d12';
        ctx.fillRect(0, 0, w, h);

        const t = now * 0.001;
        for (let y = 0; y < h; y += 2) {
          const ox =
            Math.sin(y * 0.016 + t * 1.15) * 3.4 +
            Math.sin(y * 0.038 + t * 0.72) * 1.8;
          ctx.drawImage(off, 0, y, w, 2, ox, y, w, 2);
        }
        raf = window.requestAnimationFrame(loop);
      } catch {
        alive = false;
        setUsePhoto(true);
      }
    };

    const start = () => {
      resize();
      raf = window.requestAnimationFrame(loop);
    };

    water.onerror = () => setUsePhoto(true);
    if (water.complete && water.naturalWidth) start();
    else water.onload = start;

    window.addEventListener('resize', resize);

    return () => {
      alive = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      water.onload = null;
      water.onerror = null;
    };
  }, [reduced]);

  if (usePhoto) {
    return <img src={WATER_SRC} alt="" className={styles.waterPhoto} />;
  }

  return <canvas ref={canvasRef} className={styles.waterCanvas} />;
}

function HomeIntro() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setReduced(prefersReduced);

    const hold = prefersReduced ? INTRO_REDUCED_HOLD_MS : INTRO_HOLD_MS;
    const reveal = prefersReduced ? INTRO_REDUCED_REVEAL_MS : INTRO_REVEAL_MS;
    const done = hold + reveal;

    const leaveTimer = window.setTimeout(() => setLeaving(true), hold);
    const readyTimer = window.setTimeout(releaseSite, done);
    const unmountTimer = window.setTimeout(() => setGone(true), done + 80);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(readyTimer);
      window.clearTimeout(unmountTimer);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className={`${styles.intro} ${reduced ? styles.reduced : ''} ${leaving ? styles.leaving : ''}`}
      aria-hidden="true"
    >
      <div className={styles.stage}>
        <WaterCanvas reduced={reduced} />
        <div className={styles.gold} />
        <div className={styles.markWrap}>
          <span className={styles.steam} />
          <span className={`${styles.steam} ${styles.steamB}`} />
          <img
            src={EMBLEM_SRC}
            alt={SITE.name}
            width={960}
            height={513}
            className={styles.mark}
          />
        </div>
      </div>
    </div>
  );
}

export default function Loader() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith('/admin');
  const isHome = pathname === '/';

  useEffect(() => {
    if (isAdmin) return;
    if (!isHome || !INTRO_ENABLED) releaseSite();
  }, [isAdmin, isHome]);

  if (isAdmin || !isHome || !INTRO_ENABLED) return null;

  return (
    <IntroBoundary>
      <HomeIntro />
    </IntroBoundary>
  );
}
