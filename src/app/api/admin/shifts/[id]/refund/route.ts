import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import { RefundError } from '@/lib/mercadopago';
import { refundReservation } from '@/lib/reservation-payments';
import { findReservationById } from '@/lib/reservations';

async function requireAdmin() {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value);
}

/** Devolución total desde el panel: Mercado Pago + liberar lugares + correo al cliente. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await context.params;
  const reservation = await findReservationById(id);
  if (!reservation) {
    return NextResponse.json({ ok: false, error: 'Reserva no encontrada' }, { status: 404 });
  }
  if (reservation.status === 'refunded') {
    return NextResponse.json({ ok: true, already: true });
  }
  if (reservation.status !== 'paid') {
    return NextResponse.json(
      { ok: false, error: 'Solo se pueden devolver reservas pagadas. Las pendientes se liberan solas.' },
      { status: 409 },
    );
  }

  let reason = 'Devolución realizada por Aguas del Cerro';
  try {
    const body = (await request.json()) as { reason?: unknown };
    if (typeof body.reason === 'string' && body.reason.trim()) reason = body.reason.trim().slice(0, 200);
  } catch {
    // sin cuerpo: se usa el motivo por defecto
  }

  try {
    await refundReservation(reservation, 'admin', reason);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[admin/refund]', reservation.code, error);
    const message =
      error instanceof RefundError
        ? `${error.message}. Revisá que haya saldo disponible en Mercado Pago.`
        : 'No se pudo hacer la devolución';
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
