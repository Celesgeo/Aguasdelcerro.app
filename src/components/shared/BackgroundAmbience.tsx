'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { SITE_AMBIENT_TRACK, SITE_AMBIENT_VOLUME } from '@/lib/site-audio';

const FADE_MS = 3200;
const FADE_STEP_MS = 80;
const START_DELAY_MS = 2000;

export default function BackgroundAmbience() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const startedRef = useRef(false);

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

  const startPlayback = useCallback(async () => {
    if (startedRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0;
    audio.loop = true;

    try {
      await audio.play();
      startedRef.current = true;
      fadeTo(SITE_AMBIENT_VOLUME);
    } catch {
      /* El navegador bloqueó autoplay; se reintenta con la primera interacción. */
    }
  }, [fadeTo]);

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;

    startedRef.current = false;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0;
    }

    const tryStart = () => {
      void startPlayback();
    };

    const delayTimer = window.setTimeout(tryStart, START_DELAY_MS);

    const resumeOnInteraction = () => {
      void startPlayback();
    };

    window.addEventListener('pointerdown', resumeOnInteraction);
    window.addEventListener('keydown', resumeOnInteraction);
    window.addEventListener('scroll', resumeOnInteraction, { passive: true });
    window.addEventListener('touchstart', resumeOnInteraction, { passive: true });

    return () => {
      window.clearTimeout(delayTimer);
      window.removeEventListener('pointerdown', resumeOnInteraction);
      window.removeEventListener('keydown', resumeOnInteraction);
      window.removeEventListener('scroll', resumeOnInteraction);
      window.removeEventListener('touchstart', resumeOnInteraction);
      clearFade();
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [pathname, startPlayback, clearFade]);

  if (pathname.startsWith('/admin')) return null;

  return (
    <audio
      ref={audioRef}
      src={SITE_AMBIENT_TRACK}
      preload="auto"
      aria-hidden
      playsInline
    />
  );
}
