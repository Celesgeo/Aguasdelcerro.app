import { NextResponse } from 'next/server';
import { sendReservationRescheduledEmails } from '@/lib/reservation-mail';
import {
  ReservationError,
  canReschedule,
  findReservationByCodeAndEmail,
  rescheduleDeadline,
  rescheduleReservation,
  type Reservation,
} from '@/lib/reservations';
import { clientIp, rateLimit, sanitizeText, uniformResponseDelay } from '@/lib/security';

const NO_STORE = { 'Cache-Control': 'no-store' };

function publicReservation(reservation: Reservation) {
  return {
    code: reservation.code,
    name: reservation.name,
    status: reservation.status,
    date: reservation.date,
    shiftId: reservation.shiftId,
    quantity: reservation.quantity,
    total: reservation.total,
    canReschedule: canReschedule(reservation),
    rescheduleDeadline: rescheduleDeadline(reservation).toISOString(),
  };
}

/**
 * "Mi reserva": consultar con código + correo, y cambiar día o turno (hasta 48 h antes).
 * body: { action: 'lookup' | 'reschedule', code, email, date?, shiftId? }
 */
export async function POST(request: Request) {
  const startedAt = Date.now();
  const limited = rateLimit(`mi-reserva:${clientIp(request)}`, 15, 15 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, code: 'rate_limit' }, { status: 429, headers: NO_STORE });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'invalid' }, { status: 400, headers: NO_STORE });
  }

  const code = sanitizeText(body.code, 12);
  const email = sanitizeText(body.email, 120);
  const action = body.action === 'reschedule' ? 'reschedule' : 'lookup';

  try {
    const current = await findReservationByCodeAndEmail(code, email);
    if (!current || current.status !== 'paid') {
      await uniformResponseDelay(Math.max(0, 450 - (Date.now() - startedAt)));
      return NextResponse.json({ ok: false, code: 'not_found' }, { status: 404, headers: NO_STORE });
    }

    if (action === 'lookup') {
      return NextResponse.json({ ok: true, reservation: publicReservation(current) }, { headers: NO_STORE });
    }

    const updated = await rescheduleReservation({
      code,
      email,
      date: sanitizeText(body.date, 10),
      shiftId: sanitizeText(body.shiftId, 20),
    });
    await sendReservationRescheduledEmails(updated, { date: current.date, shiftId: current.shiftId });
    return NextResponse.json({ ok: true, reservation: publicReservation(updated) }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof ReservationError) {
      const status = error.code === 'not_found' ? 404 : error.code === 'invalid' ? 400 : 409;
      return NextResponse.json({ ok: false, code: error.code }, { status, headers: NO_STORE });
    }
    console.error('[reservas/mi-reserva]', error);
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503, headers: NO_STORE });
  }
}
