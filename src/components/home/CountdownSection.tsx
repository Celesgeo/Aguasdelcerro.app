'use client';

import { useEffect, useState } from 'react';
import { SITE } from '@/lib/constants';
import { useT } from '@/components/i18n/LanguageProvider';

function getTimeLeft() {
  const target = new Date(SITE.inaugurationDate).getTime();
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function CountdownSection() {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft);
  const t = useT();

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: t('home.days'), value: timeLeft.days },
    { label: t('home.hours'), value: timeLeft.hours },
    { label: t('home.minutes'), value: timeLeft.minutes },
    { label: t('home.seconds'), value: timeLeft.seconds },
  ];

  return (
    <section className="bg-brand-black py-20 border-y border-brand-gold/10">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="text-xs tracking-[0.35em] uppercase text-brand-gold mb-4 font-body">{t('home.countdownKicker')}</p>
        <h2 className="font-display text-3xl md:text-4xl text-brand-cream mb-10">{t('home.countdownTitle')}</h2>
        <div className="grid grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.label} className="border border-brand-gold/15 py-6">
              <p className="font-display text-3xl md:text-4xl text-brand-gold" suppressHydrationWarning>
                {String(item.value).padStart(2, '0')}
              </p>
              <p className="mt-2 text-xs tracking-[0.2em] uppercase text-brand-cream/50 font-body">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
