'use client';

import { useEffect, useState } from 'react';
import { CloudSun, Sunrise, Sunset } from 'lucide-react';

interface WeatherData {
  temp: number;
  description: string;
  sunrise: string;
  sunset: string;
}

export default function WeatherWidget() {
  const [data, setData] = useState<WeatherData | null>(null);

  useEffect(() => {
    fetch('/api/weather')
      .then((r) => r.json())
      .then(setData)
      .catch(() => null);
  }, []);

  if (!data) return null;

  return (
    <section className="bg-brand-cream py-16 border-t border-brand-brown/5">
      <div className="mx-auto max-w-5xl px-6 grid gap-6 md:grid-cols-3">
        <div className="flex items-center gap-4 border border-brand-brown/10 p-6 bg-white">
          <CloudSun className="text-brand-gold" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-dark/50 font-body">Clima · La Rioja</p>
            <p className="font-display text-2xl text-brand-brown">{data.temp}°C · {data.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 border border-brand-brown/10 p-6 bg-white">
          <Sunrise className="text-brand-gold" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-dark/50 font-body">Amanecer</p>
            <p className="font-display text-2xl text-brand-brown">{data.sunrise}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 border border-brand-brown/10 p-6 bg-white">
          <Sunset className="text-brand-gold" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-dark/50 font-body">Atardecer</p>
            <p className="font-display text-2xl text-brand-brown">{data.sunset}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
