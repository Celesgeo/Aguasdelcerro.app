import { NextResponse } from 'next/server';
import { getApplicationCount, incrementApplicationCount } from '@/lib/careers-store';
import { clientIp, rateLimit } from '@/lib/security';

export const dynamic = 'force-dynamic';

function noStore(body: { ok: boolean; count: number }, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET() {
  const count = await getApplicationCount();
  return noStore({ ok: true, count });
}

export async function POST(request: Request) {
  const ip = clientIp(request);
  const limited = rateLimit(`careers-count:${ip}`, 12, 60 * 60 * 1000);
  if (!limited.ok) {
    const count = await getApplicationCount();
    return NextResponse.json(
      { ok: false, count, error: 'Demasiados intentos.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec), 'Cache-Control': 'no-store' } },
    );
  }

  const count = await incrementApplicationCount();
  return noStore({ ok: true, count });
}
