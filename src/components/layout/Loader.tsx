'use client';

import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
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

const LOGO_SRC = '/images/intro-logo.png';
const SUNSET_SRC = '/invitacion-privada/atardecer.jpg';

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
        <img src={SUNSET_SRC} alt="" className={styles.photo} />
        <div className={styles.veil} />
        <div className={styles.frame} />
        <div className={styles.center}>
          <div className={styles.markWrap}>
            <img src={LOGO_SRC} alt={SITE.name} width={602} height={543} className={styles.mark} />
            <span className={styles.shine} />
          </div>
          <span className={styles.line} />
          <p className={styles.tagline}>Al pie del cerro Velasco · La Rioja</p>
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
