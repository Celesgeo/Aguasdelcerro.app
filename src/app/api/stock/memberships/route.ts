import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TICKET_PRICE_ARS } from '@/lib/memberships';
import {
  ReservationError,
  createInPersonSale,
  getShiftAvailability,
  isInPersonPaymentMethod,
  listPaidMemberships,
} from '@/lib/reservations';
import { sellerIdFromCookie, staffNameFromCookie, stockViewer } from '@/lib/stock-auth';
import { autoMarkAttendance } from '@/lib/stock-team';
import { toShiftMembership } from '@/lib/stock-memberships';
import { currentBusinessDate, currentShiftId } from '@/lib/stock-store';
import { clientIp, rateLimit, sanitizeText } from '@/lib/security';
import { VISITOR_SHIFT_MAX_PER_PURCHASE } from '@/lib/visitor-shifts';

export const dynamic = 'force-dynamic';

/** Membresías del turno en curso: online (Mercado Pago) + presenciales. */
export async function GET() {
  if (!(await stockViewer())) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    const date = currentBusinessDate();
    const shiftId = currentShiftId();
    const [list, availability] = await Promise.all([listPaidMemberships(date, shiftId), getShiftAvailability(date)]);
    const slot = availability.find((s) => s.id === shiftId);
    return NextResponse.json({
      ok: true,
      unitPrice: TICKET_PRICE_ARS,
      maxPerSale: VISITOR_SHIFT_MAX_PER_PURCHASE,
      remaining: slot?.remaining ?? null,
      memberships: list.map(toShiftMembership),
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar las membresías' }, { status: 500 });
  }
}

/** Cargar membresías vendidas en el parque para el turno en curso. */
export async function POST(request: NextRequest) {
  if (!(await stockViewer())) {
    return NextResponse.json({ ok: false, error: 'Tu sesión venció. Ingresá la clave de nuevo.' }, { status: 401 });
  }
  if (!rateLimit(`stock-membership:${clientIp(request)}`, 60, 60 * 1000).ok) {
    return NextResponse.json({ ok: false, error: 'Demasiadas cargas seguidas. Esperá un momento.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const quantity = Number(body?.quantity ?? 1);
  const paymentMethod = String(body?.paymentMethod ?? '');
  const staffName = (await staffNameFromCookie()) || sanitizeText(body?.staffName, 60);
  const name = sanitizeText(body?.name, 80);
  const phone = sanitizeText(body?.phone, 40);

  if (!staffName) return NextResponse.json({ ok: false, error: 'Escribí tu nombre antes de cargar' }, { status: 400 });
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > VISITOR_SHIFT_MAX_PER_PURCHASE) {
    return NextResponse.json(
      { ok: false, error: `Cantidad inválida (de 1 a ${VISITOR_SHIFT_MAX_PER_PURCHASE})` },
      { status: 400 },
    );
  }
  if (!isInPersonPaymentMethod(paymentMethod)) {
    return NextResponse.json({ ok: false, error: 'Elegí cómo pagó (efectivo, transferencia o tarjeta)' }, { status: 400 });
  }

  try {
    const reservation = await createInPersonSale({
      date: currentBusinessDate(),
      shiftId: currentShiftId(),
      quantity,
      name,
      phone,
      paymentMethod,
      soldBy: staffName,
    });
    const sellerId = await sellerIdFromCookie();
    if (sellerId) await autoMarkAttendance(sellerId).catch(() => undefined);
    return NextResponse.json({ ok: true, membership: toShiftMembership(reservation) });
  } catch (error) {
    if (error instanceof ReservationError) {
      const message =
        error.code === 'sold_out'
          ? 'El turno está completo (sin cupo).'
          : error.code === 'insufficient'
            ? 'No queda cupo suficiente en este turno para esa cantidad.'
            : 'Datos inválidos.';
      return NextResponse.json({ ok: false, error: message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: 'No se pudo cargar la membresía' }, { status: 500 });
  }
}
