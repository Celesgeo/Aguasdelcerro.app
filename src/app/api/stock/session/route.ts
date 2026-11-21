import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  STAFF_COOKIE,
  STAFF_NAME_COOKIE,
  STAFF_SELLER_COOKIE,
  checkStaffPin,
  currentShiftEnd,
  isStaffPinConfigured,
  secondsUntilShiftEnd,
  sellerIdFromCookie,
  staffCookieOptions,
  staffNameFromCookie,
  stockViewer,
} from '@/lib/stock-auth';
import { currentBusinessDate, currentShiftId } from '@/lib/stock-store';
import { SellerError, autoMarkAttendance, findOrCreateSellerByName, findSeller, listSellers, weekCount } from '@/lib/stock-team';
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
    let daysThisWeek: number | null = null;
    if (viewer && sellerId) {
      // Si la sesión sigue abierta de un día a otro, el día nuevo también cuenta.
      await autoMarkAttendance(sellerId).catch(() => undefined);
      daysThisWeek = await weekCount(sellerId).catch(() => null);
    }
    return NextResponse.json({
      ok: true,
      viewer,
      pinConfigured,
      staffName: viewer ? staffName : '',
      sellerId: viewer ? sellerId : null,
      daysThisWeek,
      sessionEndsAt: viewer === 'staff' ? currentShiftEnd().toISOString() : null,
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
    res.cookies.set(STAFF_COOKIE, token, staffCookieOptions(secondsUntilShiftEnd()));
    // Al entrar se elige de nuevo quién atiende.
    res.cookies.set(STAFF_NAME_COOKIE, '', { ...staffCookieOptions(0), maxAge: 0 });
    res.cookies.set(STAFF_SELLER_COOKIE, '', { ...staffCookieOptions(0), maxAge: 0 });
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo ingresar' }, { status: 500 });
  }
}

/** Elegir quién atiende: { staffName } escrito (se busca o se crea) o { sellerId }. Marca la asistencia de hoy. */
export async function PUT(request: NextRequest) {
  if (!(await stockViewer())) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  try {
    let seller = body?.sellerId ? await findSeller(String(body.sellerId)) : null;
    if (!seller) {
      const typed = sanitizeText(body?.staffName, 60);
      if (!typed) return NextResponse.json({ ok: false, error: 'Escribí tu nombre' }, { status: 400 });
      seller = await findOrCreateSellerByName(typed);
    }
    await autoMarkAttendance(seller.id);
    const daysThisWeek = await weekCount(seller.id);

    const res = NextResponse.json({ ok: true, staffName: seller.name, sellerId: seller.id, daysThisWeek });
    res.cookies.set(STAFF_NAME_COOKIE, encodeURIComponent(seller.name), staffCookieOptions(secondsUntilShiftEnd()));
    res.cookies.set(STAFF_SELLER_COOKIE, seller.id, staffCookieOptions(secondsUntilShiftEnd()));
    return res;
  } catch (error) {
    if (error instanceof SellerError) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
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
