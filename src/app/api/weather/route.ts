import { NextResponse } from 'next/server';
import { SITE } from '@/lib/constants';

/** WMO weather interpretation codes → Spanish labels */
const WMO_ES: Record<number, string> = {
  0: 'Despejado',
  1: 'Mayormente despejado',
  2: 'Parcialmente nublado',
  3: 'Nublado',
  45: 'Niebla',
  48: 'Niebla con escarcha',
  51: 'Llovizna ligera',
  53: 'Llovizna',
  55: 'Llovizna intensa',
  56: 'Llovizna helada',
  57: 'Llovizna helada intensa',
  61: 'Lluvia ligera',
  63: 'Lluvia',
  65: 'Lluvia intensa',
  66: 'Lluvia helada',
  67: 'Lluvia helada intensa',
  71: 'Nieve ligera',
  73: 'Nieve',
  75: 'Nieve intensa',
  77: 'Granos de nieve',
  80: 'Chubascos ligeros',
  81: 'Chubascos',
  82: 'Chubascos fuertes',
  85: 'Chubascos de nieve',
  86: 'Chubascos de nieve intensos',
  95: 'Tormenta',
  96: 'Tormenta con granizo',
  99: 'Tormenta con granizo fuerte',
};

function formatLocalTime(iso: string): string {
  // Open-Meteo returns local ISO without offset, e.g. "2026-07-20T08:18"
  const time = iso.includes('T') ? iso.split('T')[1] : iso;
  return time.slice(0, 5);
}

export async function GET() {
  const { lat, lng } = SITE.coordinates;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lng));
  url.searchParams.set('current', 'temperature_2m,weather_code');
  url.searchParams.set('daily', 'sunrise,sunset');
  url.searchParams.set('timezone', 'America/Argentina/La_Rioja');
  url.searchParams.set('forecast_days', '1');

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 1800 }, // cache 30 min
    });

    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);

    const data = await res.json();
    const code = Number(data.current?.weather_code ?? 0);
    const sunrise = data.daily?.sunrise?.[0];
    const sunset = data.daily?.sunset?.[0];

    return NextResponse.json({
      temp: Math.round(Number(data.current?.temperature_2m ?? 0)),
      description: WMO_ES[code] ?? 'Sin datos',
      sunrise: sunrise ? formatLocalTime(sunrise) : '--:--',
      sunset: sunset ? formatLocalTime(sunset) : '--:--',
      location: 'La Rioja, Argentina',
    });
  } catch {
    return NextResponse.json(
      {
        temp: 22,
        description: 'Sin datos en vivo',
        sunrise: '--:--',
        sunset: '--:--',
        location: 'La Rioja, Argentina',
      },
      { status: 200 },
    );
  }
}
