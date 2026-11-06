import { getPayment } from '@/lib/mercadopago';
import { sendReservationConfirmedEmails } from '@/lib/reservation-mail';
import {
  findReservationByCode,
  markConfirmationSent,
  markReservationPaid,
  releasePendingReservation,
  type Reservation,
} from '@/lib/reservations';

export type PaymentOutcome =
  | { kind: 'paid'; reservation: Reservation }
  | { kind: 'rejected'; reservation: Reservation | null }
  | { kind: 'pending'; reservation: Reservation | null }
  | { kind: 'mismatch' }
  | { kind: 'not_found' };

/**
 * Consulta el pago en Mercado Pago y actualiza la reserva.
 * Lo usan tanto el aviso automático (webhook) como la página de vuelta,
 * así la confirmación llega aunque uno de los dos caminos falle.
 */
export async function processPayment(paymentId: string, expectedCode?: string): Promise<PaymentOutcome> {
  const payment = await getPayment(paymentId);
  if (!payment || !payment.externalReference) return { kind: 'not_found' };
  if (expectedCode && payment.externalReference !== expectedCode) return { kind: 'mismatch' };

  const reservation = await findReservationByCode(payment.externalReference);
  if (!reservation) return { kind: 'not_found' };

  if (payment.status === 'approved') {
    // Controla que lo pagado coincida con la reserva.
    if (payment.currency !== 'ARS' || Math.round(payment.amount) !== reservation.total) {
      console.error(
        `[reservas] monto distinto en ${reservation.code}: pagó ${payment.amount} ${payment.currency}, esperado ${reservation.total} ARS`,
      );
      return { kind: 'mismatch' };
    }

    const result = await markReservationPaid(reservation.code, payment.id);
    if (!result) return { kind: 'not_found' };

    // Se manda una sola vez. Si el primer envío falló, se reintenta en un aviso posterior
    // (pasados 5 minutos, para no duplicar si el aviso y la vuelta del cliente llegan juntos).
    const paidAt = result.reservation.paidAt ? new Date(result.reservation.paidAt).getTime() : Date.now();
    const retryFailedEmail = !result.reservation.confirmationSentAt && Date.now() - paidAt > 5 * 60_000;
    if (result.newlyPaid || retryFailedEmail) {
      const sent = await sendReservationConfirmedEmails(result.reservation);
      if (sent) await markConfirmationSent(result.reservation.id);
    }
    return { kind: 'paid', reservation: result.reservation };
  }

  if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(payment.status)) {
    await releasePendingReservation(reservation.code, payment.id);
    return { kind: 'rejected', reservation: await findReservationByCode(reservation.code) };
  }

  return { kind: 'pending', reservation };
}
