import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  STAFF_COOKIE,
  checkStaffPin,
  isStaffPinConfigured,
  staffCookieOptions,
  stockViewer,
} from '@/lib/stock-auth';
import { currentBusinessDate, currentShiftId } from '@/lib/stock-store';
import { clientIp, rateLimit, uniformResponseDelay } from '@/lib/security';

export const dynamic = 'force-dynamic';

/** Estado de la sesión del personal + turno en curso. */
export async function GET() {
  try {
    const [viewer, pinConfigured] = await Promise.all([stockViewer(), isStaffPinConfigured()]);
    return NextResponse.json({
      ok: true,
      viewer,
      pinConfigured,
      shiftId: currentShiftId(),
      businessDate: currentBusinessDate(),
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo conectar con la base de datos' }, { status: 500 });
  }
}

/** Ingreso con la clave del personal. */
export async function POST(request: NextRequest) {
  const limited = rateLimit(`stock-pin:${clientIp(request)}`, 8, 15 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { ok: false, error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const pin = String(body?.pin ?? '').trim();
    const token = pin && pin.length <= 12 ? await checkStaffPin(pin) : null;
    if (!token) {
      await uniformResponseDelay();
      return NextResponse.json({ ok: false, error: 'Clave incorrecta' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(STAFF_COOKIE, token, staffCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo ingresar' }, { status: 500 });
  }
}

/** Cerrar sesión del personal. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(STAFF_COOKIE, '', { ...staffCookieOptions(0), maxAge: 0 });
  return res;
}
