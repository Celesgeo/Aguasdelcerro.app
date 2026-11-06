import { NextResponse } from 'next/server';
import { processPayment } from '@/lib/reservation-payments';
import { findReservationByCode, normalizeCode } from '@/lib/reservations';
import { clientIp, rateLimit } from '@/lib/security';

const NO_STORE = { 'Cache-Control': 'no-store' };

function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const visible = user.slice(0, 2);
  return `${visible}${'•'.repeat(Math.max(1, user.length - 2))}@${domain}`;
}

/**
 * Página de vuelta de Mercado Pago: confirma el pago consultándolo a la API
 * (por si el aviso automático todavía no llegó) y devuelve el estado de la reserva.
 */
export async function GET(request: Request) {
  const limited = rateLimit(`estado:${clientIp(request)}`, 30, 10 * 60_000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, code: 'rate_limit' }, { status: 429, headers: NO_STORE });
  }

  const url = new URL(request.url);
  const code = normalizeCode(url.searchParams.get('code') ?? '');
  const paymentId = url.searchParams.get('payment_id')?.trim() ?? '';
  if (!/^ADC-[A-Z0-9]{6}$/.test(code)) {
    return NextResponse.json({ ok: false, code: 'not_found' }, { status: 404, headers: NO_STORE });
  }

  try {
    if (/^\d{1,30}$/.test(paymentId)) {
      await processPayment(paymentId, code).catch((error) => {
        console.error('[reservas/estado] no se pudo verificar el pago', paymentId, error);
      });
    }

    const reservation = await findReservationByCode(code);
    if (!reservation) {
      return NextResponse.json({ ok: false, code: 'not_found' }, { status: 404, headers: NO_STORE });
    }

    const holdActive =
      reservation.status === 'pending' &&
      reservation.holdExpiresAt !== null &&
      new Date(reservation.holdExpiresAt).getTime() > Date.now();

    return NextResponse.json(
      {
        ok: true,
        reservation: {
          code: reservation.code,
          status: reservation.status === 'pending' && !holdActive ? 'expired' : reservation.status,
          date: reservation.date,
          shiftId: reservation.shiftId,
          quantity: reservation.quantity,
          total: reservation.total,
          email: maskEmail(reservation.email),
        },
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    console.error('[reservas/estado]', error);
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503, headers: NO_STORE });
  }
}
