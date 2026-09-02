'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SITE_AMBIENT_TRACK, SITE_AMBIENT_VOLUME, SITE_READY_EVENT } from '@/lib/site-audio';

const FADE_MS = 2800;
const FADE_STEP_MS = 70;

export default function BackgroundAmbience() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const playingRef = useRef(false);
  const audibleRef = useRef(false);

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const fadeTo = useCallback(
    (target: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      clearFade();
      const start = audio.volume;
      const steps = Math.max(1, Math.round(FADE_MS / FADE_STEP_MS));
      const delta = (target - start) / steps;
      let step = 0;

      fadeTimerRef.current = window.setInterval(() => {
        step += 1;
        if (step >= steps) {
          audio.volume = target;
          clearFade();
          return;
        }
        audio.volume = Math.min(SITE_AMBIENT_VOLUME, Math.max(0, start + delta * step));
      }, FADE_STEP_MS);
    },
    [clearFade],
  );

  const revealSound = useCallback(async () => {
    if (audibleRef.current) return;

    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = false;
    audio.loop = true;

    if (!playingRef.current) {
      audio.volume = 0;
      try {
        await audio.play();
        playingRef.current = true;
        audibleRef.current = true;
        fadeTo(SITE_AMBIENT_VOLUME);
      } catch {
        /* Sin interacción suficiente aún. */
      }
      return;
    }

    audibleRef.current = true;
    audio.volume = 0;
    fadeTo(SITE_AMBIENT_VOLUME);
  }, [fadeTo]);

  const bootAmbience = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || audibleRef.current) return;

    audio.loop = true;
    audio.volume = 0;
    audio.muted = false;

    try {
      await audio.play();
      playingRef.current = true;
      audibleRef.current = true;
      fadeTo(SITE_AMBIENT_VOLUME);
      return;
    } catch {
      /* Autoplay con sonido bloqueado en Chrome/Edge/Firefox. */
    }

    try {
      audio.muted = true;
      await audio.play();
      playingRef.current = true;
    } catch {
      /* Espera la primera interacción del visitante. */
    }
  }, [fadeTo]);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    playingRef.current = false;
    audibleRef.current = false;

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
      audio.volume = 0;
    }

    const onSiteReady = () => {
      void bootAmbience();
    };

    const onInteraction = () => {
      void revealSound();
    };

    window.addEventListener(SITE_READY_EVENT, onSiteReady);
    window.addEventListener('pointerdown', onInteraction);
    window.addEventListener('keydown', onInteraction);
    window.addEventListener('wheel', onInteraction, { passive: true });
    window.addEventListener('scroll', onInteraction, { passive: true });
    window.addEventListener('mousemove', onInteraction, { once: true });

    const fallbackTimer = window.setTimeout(() => {
      void bootAmbience();
    }, 2600);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener(SITE_READY_EVENT, onSiteReady);
      window.removeEventListener('pointerdown', onInteraction);
      window.removeEventListener('keydown', onInteraction);
      window.removeEventListener('wheel', onInteraction);
      window.removeEventListener('scroll', onInteraction);
      window.removeEventListener('mousemove', onInteraction);
      clearFade();
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      }
    };
  }, [pathname, bootAmbience, revealSound, clearFade]);

  if (pathname.startsWith('/admin')) return null;

  return <audio ref={audioRef} src={SITE_AMBIENT_TRACK} preload="auto" aria-hidden />;
}
