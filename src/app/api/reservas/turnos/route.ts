import { NextResponse } from 'next/server';
import { createCheckoutPreference, isMercadoPagoConfigured } from '@/lib/mercadopago';
import {
  PAYMENT_HOLD_MINUTES,
  ReservationError,
  createPendingReservation,
  discardPendingReservation,
  getShiftAvailability,
  setPreferenceId,
} from '@/lib/reservations';
import { TICKET_PRICE_ARS } from '@/lib/memberships';
import { clientIp, rateLimit, sanitizeText } from '@/lib/security';
import { bookingWindow, isDateInBookingWindow } from '@/lib/visitor-shifts';

const NO_STORE = { 'Cache-Control': 'no-store' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function publicShifts(shifts: Awaited<ReturnType<typeof getShiftAvailability>>) {
  return shifts.map((shift) => ({ id: shift.id, status: shift.status }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get('date')?.trim() ?? '';
  const window = bookingWindow();
  const date = requested || window.today;

  if (!isDateInBookingWindow(date)) {
    return NextResponse.json({ ok: false, code: 'invalid' }, { status: 400, headers: NO_STORE });
  }

  try {
    const shifts = await getShiftAvailability(date);
    return NextResponse.json(
      {
        ok: true,
        date,
        minDate: window.minDate,
        maxDate: window.maxDate,
        price: TICKET_PRICE_ARS,
        shifts: publicShifts(shifts),
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('[reservas/turnos] GET', error);
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503, headers: NO_STORE });
  }
}

export async function POST(request: Request) {
  const limited = rateLimit(`reserve:${clientIp(request)}`, 8, 10 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, code: 'rate_limit' }, { status: 429, headers: NO_STORE });
  }

  if (!isMercadoPagoConfigured()) {
    console.error('[reservas/turnos] falta MP_ACCESS_TOKEN');
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503, headers: NO_STORE });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'invalid' }, { status: 400, headers: NO_STORE });
  }

  const name = sanitizeText(body.name, 80);
  const email = sanitizeText(body.email, 120).toLowerCase();
  const phone = sanitizeText(body.phone, 40);
  if (name.length < 2) {
    return NextResponse.json({ ok: false, code: 'name' }, { status: 400, headers: NO_STORE });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, code: 'email' }, { status: 400, headers: NO_STORE });
  }
  if (body.acceptTerms !== true) {
    return NextResponse.json({ ok: false, code: 'terms' }, { status: 400, headers: NO_STORE });
  }

  let reservationId: string | null = null;
  try {
    const reservation = await createPendingReservation({
      date: typeof body.date === 'string' ? body.date : '',
      shiftId: typeof body.shiftId === 'string' ? body.shiftId : '',
      quantity: typeof body.quantity === 'number' ? body.quantity : Number(body.quantity),
      name,
      email,
      phone,
    });
    reservationId = reservation.id;

    const { preferenceId, checkoutUrl } = await createCheckoutPreference(reservation, PAYMENT_HOLD_MINUTES);
    await setPreferenceId(reservation.id, preferenceId);

    return NextResponse.json(
      {
        ok: true,
        code: reservation.code,
        paymentUrl: checkoutUrl,
        shifts: publicShifts(await getShiftAvailability(reservation.date)),
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof ReservationError) {
      const status = error.code === 'invalid' ? 400 : 409;
      return NextResponse.json({ ok: false, code: error.code }, { status, headers: NO_STORE });
    }
    console.error('[reservas/turnos] POST', error);
    if (reservationId) await discardPendingReservation(reservationId).catch(() => undefined);
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 500, headers: NO_STORE });
  }
}
