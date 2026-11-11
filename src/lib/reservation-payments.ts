import { getPayment, refundPaymentFully } from '@/lib/mercadopago';
import { sendRefundEmails, sendReservationConfirmedEmails } from '@/lib/reservation-mail';
import {
  findReservationByCode,
  markConfirmationSent,
  markReservationPaid,
  markReservationRefunded,
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

  // Devolución hecha directamente desde Mercado Pago (o contracargo) sobre una reserva ya pagada.
  if ((payment.status === 'refunded' || payment.status === 'charged_back') && reservation.status === 'paid') {
    const refunded = await markReservationRefunded(reservation.id, null, `mercadopago:${payment.status}`);
    if (refunded) await sendRefundEmails(refunded, 'Devolución registrada en Mercado Pago');
    return { kind: 'rejected', reservation: refunded ?? reservation };
  }

  if (['rejected', 'cancelled', 'refunded', 'charged_back'].includes(payment.status)) {
    await releasePendingReservation(reservation.code, payment.id);
    return { kind: 'rejected', reservation: await findReservationByCode(reservation.code) };
  }

  return { kind: 'pending', reservation };
}

/**
 * Devolución total: pide el reintegro a Mercado Pago, marca la reserva como devuelta,
 * libera los lugares y avisa al cliente. Si Mercado Pago rechaza (p. ej. sin saldo),
 * no cambia nada y lanza el error para mostrarlo.
 */
export async function refundReservation(reservation: Reservation, origin: string, reason: string): Promise<Reservation> {
  if (reservation.status === 'refunded') return reservation;
  if (reservation.status !== 'paid' || !reservation.mpPaymentId) {
    throw new Error('La reserva no tiene un pago aprobado para devolver');
  }
  const { refundId } = await refundPaymentFully(reservation.mpPaymentId, `refund-${reservation.id}`);
  const updated = await markReservationRefunded(reservation.id, refundId, origin);
  // Si el aviso de Mercado Pago llegó antes y ya la marcó, el correo ya salió por ese camino.
  if (updated) await sendRefundEmails(updated, reason);
  return updated ?? { ...reservation, status: 'refunded', mpRefundId: refundId };
}
