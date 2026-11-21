import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  STAFF_COOKIE,
  STAFF_NAME_COOKIE,
  STAFF_SELLER_COOKIE,
  checkStaffPin,
  isStaffPinConfigured,
  sellerIdFromCookie,
  staffCookieOptions,
  staffNameFromCookie,
  stockViewer,
} from '@/lib/stock-auth';
import { currentBusinessDate, currentShiftId } from '@/lib/stock-store';
import { findSeller, listSellers } from '@/lib/stock-team';
import { clientIp, rateLimit, sanitizeText, uniformResponseDelay } from '@/lib/security';

export const dynamic = 'force-dynamic';

/** Estado de la sesión del personal + turno en curso (+ lista de vendedores si ya ingresó). */
export async function GET() {
  try {
    const [viewer, pinConfigured, staffName, sellerId] = await Promise.all([
      stockViewer(),
      isStaffPinConfigured(),
      staffNameFromCookie(),
      sellerIdFromCookie(),
    ]);
    const sellers = viewer ? (await listSellers()).map((s) => ({ id: s.id, name: s.name })) : [];
    return NextResponse.json({
      ok: true,
      viewer,
      pinConfigured,
      staffName: viewer ? staffName : '',
      sellerId: viewer ? sellerId : null,
      sellers,
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
    const token = pin && pin.length <= 40 ? await checkStaffPin(pin) : null;
    if (!token) {
      await uniformResponseDelay();
      return NextResponse.json({ ok: false, error: 'Clave incorrecta' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(STAFF_COOKIE, token, staffCookieOptions());
    // Al entrar se elige de nuevo quién atiende.
    res.cookies.set(STAFF_NAME_COOKIE, '', { ...staffCookieOptions(0), maxAge: 0 });
    res.cookies.set(STAFF_SELLER_COOKIE, '', { ...staffCookieOptions(0), maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo ingresar' }, { status: 500 });
  }
}

/** Elegir quién atiende: { sellerId } de la lista, o { staffName } si todavía no hay lista. */
export async function PUT(request: NextRequest) {
  if (!(await stockViewer())) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  try {
    let staffName = '';
    let sellerId: string | null = null;
    const sellers = await listSellers();

    if (body?.sellerId) {
      const seller = await findSeller(String(body.sellerId));
      if (!seller || !seller.active) {
        return NextResponse.json({ ok: false, error: 'Elegí tu nombre de la lista' }, { status: 400 });
      }
      staffName = seller.name;
      sellerId = seller.id;
    } else if (sellers.length === 0) {
      staffName = sanitizeText(body?.staffName, 60);
    } else {
      return NextResponse.json({ ok: false, error: 'Elegí tu nombre de la lista' }, { status: 400 });
    }
    if (!staffName) return NextResponse.json({ ok: false, error: 'Escribí tu nombre' }, { status: 400 });

    const res = NextResponse.json({ ok: true, staffName, sellerId });
    res.cookies.set(STAFF_NAME_COOKIE, encodeURIComponent(staffName), staffCookieOptions());
    if (sellerId) res.cookies.set(STAFF_SELLER_COOKIE, sellerId, staffCookieOptions());
    else res.cookies.set(STAFF_SELLER_COOKIE, '', { ...staffCookieOptions(0), maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar' }, { status: 500 });
  }
}

/** Cerrar sesión del personal. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  for (const name of [STAFF_COOKIE, STAFF_NAME_COOKIE, STAFF_SELLER_COOKIE]) {
    res.cookies.set(name, '', { ...staffCookieOptions(0), maxAge: 0 });
  }
  return res;
}
