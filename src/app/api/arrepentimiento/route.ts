import { NextResponse } from 'next/server';
import { createCancellationRequest } from '@/lib/cancellation-requests';
import { clientIp, rateLimit, sanitizeText } from '@/lib/security';

const NO_STORE = { 'Cache-Control': 'no-store' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Botón de arrepentimiento / Botón de baja de servicio.
 * Sin registro previo; devuelve el código de trámite en el momento.
 */
export async function POST(request: Request) {
  const limited = rateLimit(`arrepentimiento:${clientIp(request)}`, 6, 15 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, code: 'rate_limit' }, { status: 429, headers: NO_STORE });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'invalid' }, { status: 400, headers: NO_STORE });
  }

  const kind = body.kind === 'baja' ? 'baja' : 'arrepentimiento';
  const name = sanitizeText(body.name, 80);
  const email = sanitizeText(body.email, 120).toLowerCase();
  const phone = sanitizeText(body.phone, 40);
  const reservationCode = sanitizeText(body.reservationCode, 12);
  const reason = sanitizeText(body.reason, 500);

  if (name.length < 2) return NextResponse.json({ ok: false, code: 'name' }, { status: 400, headers: NO_STORE });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, code: 'email' }, { status: 400, headers: NO_STORE });

  try {
    const result = await createCancellationRequest({ kind, name, email, phone, reservationCode, reason });
    return NextResponse.json({ ok: true, ...result }, { headers: NO_STORE });
  } catch (error) {
    console.error('[arrepentimiento]', error);
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503, headers: NO_STORE });
  }
}
