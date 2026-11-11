import { randomInt, randomUUID } from 'node:crypto';
import { query } from '@/lib/db';
import { formatARS } from '@/lib/memberships';
import { RefundError } from '@/lib/mercadopago';
import { sendCancellationRequestEmails } from '@/lib/reservation-mail';
import { refundReservation } from '@/lib/reservation-payments';
import {
  REFUND_POLICY_MIN_HOURS,
  WITHDRAWAL_DAYS,
  WITHDRAWAL_MIN_HOURS,
  findReservationByCodeAndEmail,
  normalizeCode,
  refundEligibility,
} from '@/lib/reservations';

/**
 * Solicitudes del "Botón de arrepentimiento" y del "Botón de baja de servicio"
 * (Ley 24.240 arts. 10 ter y 34; CCyC arts. 1110 y ss.; Disposición 954/2025).
 *
 * - Sin registro previo: alcanza con nombre y correo; el código de reserva es opcional.
 * - Se entrega un código de trámite en el momento y por correo (art. 5: dentro de las 24 h).
 * - Si la reserva cumple las condiciones, la devolución total se hace automáticamente.
 * - Si no se puede resolver sola, queda registrada y el equipo recibe un aviso con "ACCIÓN REQUERIDA".
 */

export type RequestKind = 'arrepentimiento' | 'baja';

export type RequestOutcome = 'refunded' | 'already_refunded' | 'pending_review' | 'outside_terms';

export interface CancellationRequestResult {
  trackingCode: string;
  outcome: RequestOutcome;
  message: string;
}

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function trackingCode(): string {
  let out = '';
  for (let i = 0; i < 6; i++) out += ALPHABET[randomInt(0, ALPHABET.length)];
  return `SOL-${out}`;
}

export async function createCancellationRequest(input: {
  kind: RequestKind;
  name: string;
  email: string;
  phone?: string;
  reservationCode?: string;
  reason?: string;
}): Promise<CancellationRequestResult> {
  const code = input.reservationCode ? normalizeCode(input.reservationCode) : '';
  const reservation = code ? await findReservationByCodeAndEmail(code, input.email) : null;

  let outcome: RequestOutcome = 'pending_review';
  let customerOutcome =
    'Revisaremos su solicitud y le responderemos por este medio a la brevedad, dentro de las 24 horas hábiles.';
  let staffOutcome = code
    ? 'No se encontró una reserva pagada con ese código y ese correo. Revisar manualmente y responder al cliente.'
    : 'El cliente no indicó código de reserva. Identificar la reserva y responder.';

  if (reservation?.status === 'refunded') {
    outcome = 'already_refunded';
    customerOutcome = 'Esta reserva ya fue devuelta anteriormente. Si tiene alguna duda, puede responder este correo.';
    staffOutcome = 'La reserva ya estaba devuelta. No requiere acción.';
  } else if (reservation?.status === 'paid') {
    const ground = refundEligibility(reservation);
    if (ground) {
      const reasonText =
        ground === 'withdrawal'
          ? `Derecho de arrepentimiento (${input.kind === 'baja' ? 'botón de baja' : 'botón de arrepentimiento'})`
          : `Cancelación con más de ${REFUND_POLICY_MIN_HOURS} h de anticipación`;
      try {
        await refundReservation(reservation, `cliente:${input.kind}`, reasonText);
        outcome = 'refunded';
        customerOutcome = `Cancelamos la reserva ${reservation.code} y realizamos la devolución total de ${formatARS(reservation.total)} al mismo medio de pago. Le enviamos un correo aparte con el detalle.`;
        staffOutcome = `Devolución total realizada automáticamente (${reasonText}).`;
      } catch (error) {
        const detail = error instanceof RefundError ? error.message : 'error inesperado';
        console.error('[arrepentimiento] la devolución automática falló', reservation.code, error);
        outcome = 'pending_review';
        customerOutcome =
          'Su solicitud corresponde y quedó registrada. Procesaremos la devolución total al mismo medio de pago dentro de las 24 horas.';
        staffOutcome = `CORRESPONDE DEVOLVER (${reasonText}), pero Mercado Pago no la procesó: ${detail}. Verificar saldo en Mercado Pago y usar "Devolver" en /admin → Turnos.`;
      }
    } else {
      outcome = 'outside_terms';
      customerOutcome = `Su reserva ya no está dentro de los plazos de devolución: hasta ${REFUND_POLICY_MIN_HOURS} horas antes del turno, o dentro de los ${WITHDRAWAL_DAYS} días corridos desde la compra con al menos ${WITHDRAWAL_MIN_HOURS} horas de anticipación. Nuestro equipo revisará su caso y le escribirá para ofrecerle, si hay disponibilidad, una nueva fecha.`;
      staffOutcome =
        'Fuera de los plazos de devolución. Revisar el caso y contactar al cliente (cambio de fecha a criterio del parque).';
    }
  }

  const tracking = await insertRequest({
    kind: input.kind,
    reservationCode: reservation?.code ?? (code || null),
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    reason: input.reason || null,
    outcome,
    detail: staffOutcome,
  });

  await sendCancellationRequestEmails({
    trackingCode: tracking,
    kind: input.kind,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    reservationCode: reservation?.code ?? (code || null),
    reason: input.reason || null,
    customerOutcome,
    staffOutcome,
    needsAction: outcome === 'pending_review' || outcome === 'outside_terms',
  });

  return { trackingCode: tracking, outcome, message: customerOutcome };
}

async function insertRequest(row: {
  kind: RequestKind;
  reservationCode: string | null;
  name: string;
  email: string;
  phone: string | null;
  reason: string | null;
  outcome: RequestOutcome;
  detail: string;
}): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = trackingCode();
    const inserted = await query<{ tracking_code: string }>(
      `INSERT INTO cancellation_requests
        (id, tracking_code, kind, reservation_code, customer_name, customer_email, customer_phone, reason, outcome, outcome_detail, resolved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, CASE WHEN $9::text IN ('refunded','already_refunded') THEN now() ELSE NULL END)
       ON CONFLICT (tracking_code) DO NOTHING
       RETURNING tracking_code`,
      [randomUUID(), code, row.kind, row.reservationCode, row.name, row.email.toLowerCase(), row.phone, row.reason, row.outcome, row.detail],
    );
    if (inserted[0]) return inserted[0].tracking_code;
  }
  throw new Error('No se pudo generar un código de trámite único');
}

export interface CancellationRequestRow {
  trackingCode: string;
  kind: RequestKind;
  reservationCode: string | null;
  name: string;
  email: string;
  phone: string | null;
  reason: string | null;
  outcome: RequestOutcome;
  detail: string | null;
  createdAt: string;
}

/** Últimas solicitudes, para el panel. */
export async function listRecentRequests(limit = 30): Promise<CancellationRequestRow[]> {
  const rows = await query<{
    tracking_code: string;
    kind: RequestKind;
    reservation_code: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    reason: string | null;
    outcome: RequestOutcome;
    outcome_detail: string | null;
    created_at: Date;
  }>('SELECT * FROM cancellation_requests ORDER BY created_at DESC LIMIT $1', [limit]);
  return rows.map((r) => ({
    trackingCode: r.tracking_code,
    kind: r.kind,
    reservationCode: r.reservation_code,
    name: r.customer_name,
    email: r.customer_email,
    phone: r.customer_phone,
    reason: r.reason,
    outcome: r.outcome,
    detail: r.outcome_detail,
    createdAt: new Date(r.created_at).toISOString(),
  }));
}
