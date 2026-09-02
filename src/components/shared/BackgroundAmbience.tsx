'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Music2, Volume2, VolumeX } from 'lucide-react';
import {
  SITE_AMBIENT_STORAGE_KEY,
  SITE_AMBIENT_TRACK,
  SITE_AMBIENT_VOLUME,
} from '@/lib/site-audio';

const FADE_MS = 2400;
const FADE_STEP_MS = 80;
const HINT_KEY = 'aguas-ambience-hint-seen';

function readStoredPreference(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SITE_AMBIENT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeStoredPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(SITE_AMBIENT_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore */
  }
}

function hasSeenHint(): boolean {
  try {
    return window.localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return true;
  }
}

function markHintSeen(): void {
  try {
    window.localStorage.setItem(HINT_KEY, '1');
  } catch {
    /* ignore */
  }
}

export default function BackgroundAmbience() {
  const pathname = usePathname();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      window.clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

  const fadeTo = useCallback(
    (target: number, onComplete?: () => void) => {
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
          onComplete?.();
          return;
        }
        audio.volume = Math.min(SITE_AMBIENT_VOLUME, Math.max(0, start + delta * step));
      }, FADE_STEP_MS);
    },
    [clearFade],
  );

  const stopPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    fadeTo(0, () => {
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    });
  }, [fadeTo]);

  const startPlayback = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    audio.volume = 0;
    audio.loop = true;

    try {
      await audio.play();
      fadeTo(SITE_AMBIENT_VOLUME);
      setPlaying(true);
      return true;
    } catch {
      setPlaying(false);
      return false;
    }
  }, [fadeTo]);

  const enableAmbience = useCallback(async () => {
    markHintSeen();
    setShowHint(false);
    writeStoredPreference(true);
    await startPlayback();
  }, [startPlayback]);

  const disableAmbience = useCallback(() => {
    markHintSeen();
    setShowHint(false);
    writeStoredPreference(false);
    stopPlayback();
  }, [stopPlayback]);

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      stopPlayback();
      return;
    }

    if (!hasSeenHint()) {
      const timer = window.setTimeout(() => setShowHint(true), 2200);
      return () => window.clearTimeout(timer);
    }

    if (readStoredPreference()) {
      const resume = () => {
        void startPlayback();
      };
      window.addEventListener('pointerdown', resume, { once: true });
      return () => window.removeEventListener('pointerdown', resume);
    }
  }, [pathname, startPlayback, stopPlayback]);

  useEffect(() => () => clearFade(), [clearFade]);

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      <audio ref={audioRef} src={SITE_AMBIENT_TRACK} preload="metadata" aria-hidden />

      {showHint && !playing && (
        <div className="fixed bottom-24 left-5 z-[70] max-w-[240px] pointer-events-none sm:left-6">
          <p className="rounded-sm border border-brand-gold/30 bg-brand-brown/95 px-4 py-3 text-[11px] leading-relaxed tracking-[0.12em] uppercase text-brand-cream/90 font-body shadow-xl backdrop-blur-sm">
            Ambientación sonora · tocá el ícono abajo a la izquierda
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => (playing ? disableAmbience() : void enableAmbience())}
        aria-pressed={playing}
        aria-label={playing ? 'Silenciar ambientación' : 'Activar ambientación sonora'}
        className={`fixed bottom-6 left-5 z-[70] flex h-14 w-14 items-center justify-center rounded-full border-2 shadow-xl backdrop-blur-md transition-all duration-500 hover:scale-105 sm:left-6 ${
          playing
            ? 'border-brand-gold/60 bg-brand-brown/95 text-brand-gold'
            : 'border-brand-gold/35 bg-brand-cream/95 text-brand-brown animate-pulse-soft hover:border-brand-gold/55 hover:text-brand-brown'
        }`}
      >
        {playing ? <Volume2 size={22} strokeWidth={1.4} /> : <VolumeX size={22} strokeWidth={1.4} />}
        {!playing && (
          <Music2
            size={12}
            strokeWidth={1.5}
            className="absolute -top-0.5 -right-0.5 text-brand-gold"
            aria-hidden
          />
        )}
      </button>
    </>
  );
}
