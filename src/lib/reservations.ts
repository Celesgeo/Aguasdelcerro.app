import { randomInt, randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { query, transaction } from '@/lib/db';
import { TICKET_PRICE_ARS } from '@/lib/memberships';
import {
  RESCHEDULE_MIN_HOURS,
  VISITOR_SHIFT_CAPACITY,
  VISITOR_SHIFT_MAX_PER_PURCHASE,
  VISITOR_SHIFTS,
  isDateInBookingWindow,
  isVisitorShiftId,
  shiftStartInstant,
  shiftStatus,
  type VisitorShiftId,
  type VisitorShiftStatus,
} from '@/lib/visitor-shifts';

/** Minutos que se guarda el lugar mientras la persona paga en Mercado Pago. */
export const PAYMENT_HOLD_MINUTES = 30;

export type ReservationStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';

export interface Reservation {
  id: string;
  code: string;
  date: string;
  shiftId: VisitorShiftId;
  quantity: number;
  unitPrice: number;
  total: number;
  name: string;
  email: string;
  phone: string | null;
  status: ReservationStatus;
  holdExpiresAt: string | null;
  mpPreferenceId: string | null;
  mpPaymentId: string | null;
  paidAt: string | null;
  confirmationSentAt: string | null;
  rescheduleCount: number;
  refundedAt: string | null;
  mpRefundId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAvailability {
  id: VisitorShiftId;
  /** Pagadas + lugares guardados que todavía no vencieron */
  sold: number;
  capacity: number;
  remaining: number;
  status: VisitorShiftStatus;
}

interface ReservationRow {
  id: string;
  code: string;
  visit_date: string;
  shift_id: string;
  quantity: number;
  unit_price: number;
  total: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  status: string;
  hold_expires_at: Date | null;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  paid_at: Date | null;
  confirmation_sent_at: Date | null;
  reschedule_count: number;
  refunded_at: Date | null;
  mp_refund_id: string | null;
  created_at: Date;
  updated_at: Date;
}

function iso(value: Date | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

function toReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    code: row.code,
    date: row.visit_date,
    shiftId: row.shift_id as VisitorShiftId,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    total: row.total,
    name: row.customer_name,
    email: row.customer_email,
    phone: row.customer_phone,
    status: row.status as ReservationStatus,
    holdExpiresAt: iso(row.hold_expires_at),
    mpPreferenceId: row.mp_preference_id,
    mpPaymentId: row.mp_payment_id,
    paidAt: iso(row.paid_at),
    confirmationSentAt: iso(row.confirmation_sent_at),
    rescheduleCount: row.reschedule_count,
    refundedAt: iso(row.refunded_at),
    mpRefundId: row.mp_refund_id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

/** Cuenta lugares ocupados: pagados, o pendientes cuyo tiempo para pagar no venció. */
const OCCUPIED_SQL = `status = 'paid' OR (status = 'pending' AND hold_expires_at > now())`;

async function occupiedByShift(date: string, client?: PoolClient, excludeId?: string): Promise<Map<string, number>> {
  const sql = `
    SELECT shift_id, COALESCE(SUM(quantity), 0)::int AS sold
    FROM reservations
    WHERE visit_date = $1 AND (${OCCUPIED_SQL}) ${excludeId ? 'AND id <> $2' : ''}
    GROUP BY shift_id`;
  const values = excludeId ? [date, excludeId] : [date];
  const rows = client
    ? (await client.query<{ shift_id: string; sold: number }>(sql, values)).rows
    : await query<{ shift_id: string; sold: number }>(sql, values);
  return new Map(rows.map((row) => [row.shift_id, Number(row.sold)]));
}

function buildAvailability(date: string, sold: Map<string, number>, now: Date): ShiftAvailability[] {
  return VISITOR_SHIFTS.map((shift) => {
    const count = sold.get(shift.id) ?? 0;
    return {
      id: shift.id,
      sold: count,
      capacity: VISITOR_SHIFT_CAPACITY,
      remaining: Math.max(0, VISITOR_SHIFT_CAPACITY - count),
      status: shiftStatus({ date, shiftId: shift.id, sold: count, now }),
    };
  });
}

export async function getShiftAvailability(date: string, now = new Date()): Promise<ShiftAvailability[]> {
  return buildAvailability(date, await occupiedByShift(date), now);
}

export class ReservationError extends Error {
  code: 'invalid' | 'ended' | 'sold_out' | 'insufficient' | 'not_found' | 'too_late' | 'not_paid' | 'same_slot' | 'not_refundable';

  constructor(code: ReservationError['code']) {
    super(code);
    this.code = code;
  }
}

/** Bloquea un día+turno durante la transacción para que dos compras no tomen el mismo último lugar. */
async function lockSlot(client: PoolClient, date: string, shiftId: string): Promise<void> {
  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`slot:${date}:${shiftId}`]);
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateCode(): string {
  let out = '';
  for (let i = 0; i < 6; i++) out += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  return `ADC-${out}`;
}

export function normalizeCode(value: string): string {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, '');
  if (/^ADC-[A-Z0-9]{6}$/.test(cleaned)) return cleaned;
  if (/^[A-Z0-9]{6}$/.test(cleaned)) return `ADC-${cleaned}`;
  return cleaned;
}

export interface CreateReservationInput {
  date: string;
  shiftId: string;
  quantity: number;
  name: string;
  email: string;
  phone?: string;
  now?: Date;
}

export async function createPendingReservation(input: CreateReservationInput): Promise<Reservation> {
  const now = input.now ?? new Date();
  const quantity = Math.floor(input.quantity);
  if (
    !isDateInBookingWindow(input.date, now) ||
    !isVisitorShiftId(input.shiftId) ||
    !Number.isFinite(quantity) ||
    quantity < 1 ||
    quantity > VISITOR_SHIFT_MAX_PER_PURCHASE ||
    !input.name.trim() ||
    !input.email.trim()
  ) {
    throw new ReservationError('invalid');
  }
  const shiftId = input.shiftId;

  return transaction(async (client) => {
    await lockSlot(client, input.date, shiftId);
    const sold = await occupiedByShift(input.date, client);
    const snapshot = buildAvailability(input.date, sold, now).find((shift) => shift.id === shiftId);
    if (!snapshot || snapshot.status === 'ended') throw new ReservationError('ended');
    if (snapshot.status === 'sold_out') throw new ReservationError('sold_out');
    if (snapshot.remaining < quantity) throw new ReservationError('insufficient');

    const holdExpiresAt = new Date(now.getTime() + PAYMENT_HOLD_MINUTES * 60_000);
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = generateCode();
      const { rows } = await client.query<ReservationRow>(
        `INSERT INTO reservations
          (id, code, visit_date, shift_id, quantity, unit_price, total, customer_name, customer_email, customer_phone, status, hold_expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending',$11)
         ON CONFLICT (code) DO NOTHING
         RETURNING *`,
        [
          randomUUID(),
          code,
          input.date,
          shiftId,
          quantity,
          TICKET_PRICE_ARS,
          TICKET_PRICE_ARS * quantity,
          input.name.trim(),
          input.email.trim().toLowerCase(),
          input.phone?.trim() || null,
          holdExpiresAt,
        ],
      );
      if (rows[0]) return toReservation(rows[0]);
    }
    throw new Error('No se pudo generar un código de reserva único');
  });
}

export async function setPreferenceId(id: string, preferenceId: string): Promise<void> {
  await query('UPDATE reservations SET mp_preference_id = $2, updated_at = now() WHERE id = $1', [id, preferenceId]);
}

/** Borra una reserva pendiente que nunca llegó a Mercado Pago (p. ej. falló la creación del pago). */
export async function discardPendingReservation(id: string): Promise<void> {
  await query(`DELETE FROM reservations WHERE id = $1 AND status = 'pending' AND mp_payment_id IS NULL`, [id]);
}

export async function findReservationByCode(code: string): Promise<Reservation | null> {
  const rows = await query<ReservationRow>('SELECT * FROM reservations WHERE code = $1', [normalizeCode(code)]);
  return rows[0] ? toReservation(rows[0]) : null;
}

export async function findReservationByCodeAndEmail(code: string, email: string): Promise<Reservation | null> {
  const rows = await query<ReservationRow>(
    'SELECT * FROM reservations WHERE code = $1 AND lower(customer_email) = lower($2)',
    [normalizeCode(code), email.trim()],
  );
  return rows[0] ? toReservation(rows[0]) : null;
}

/**
 * Marca la reserva como pagada. Devuelve `newlyPaid: true` solo la primera vez,
 * así el correo de confirmación se manda una sola vez aunque Mercado Pago avise varias.
 */
export async function markReservationPaid(
  code: string,
  paymentId: string,
): Promise<{ reservation: Reservation; newlyPaid: boolean } | null> {
  return transaction(async (client) => {
    const { rows } = await client.query<ReservationRow>(
      'SELECT * FROM reservations WHERE code = $1 FOR UPDATE',
      [normalizeCode(code)],
    );
    const row = rows[0];
    if (!row) return null;
    // Ya pagada, o devuelta: un aviso tardío de "aprobado" no la vuelve a activar.
    if (row.status === 'paid' || row.status === 'refunded') return { reservation: toReservation(row), newlyPaid: false };

    const updated = await client.query<ReservationRow>(
      `UPDATE reservations
       SET status = 'paid', mp_payment_id = $2, paid_at = now(), hold_expires_at = NULL, updated_at = now()
       WHERE id = $1
       RETURNING *`,
      [row.id, paymentId],
    );
    return { reservation: toReservation(updated.rows[0]), newlyPaid: true };
  });
}

/** Libera el lugar de una reserva cuyo pago fue rechazado o cancelado en Mercado Pago. */
export async function releasePendingReservation(code: string, paymentId: string): Promise<void> {
  await query(
    `UPDATE reservations
     SET status = 'cancelled', mp_payment_id = COALESCE(mp_payment_id, $2), hold_expires_at = NULL, updated_at = now()
     WHERE code = $1 AND status = 'pending'`,
    [normalizeCode(code), paymentId],
  );
}

export async function markConfirmationSent(id: string): Promise<void> {
  await query('UPDATE reservations SET confirmation_sent_at = now(), updated_at = now() WHERE id = $1', [id]);
}

export async function listReservationsForDate(date: string): Promise<Reservation[]> {
  const rows = await query<ReservationRow>(
    `SELECT * FROM reservations
     WHERE visit_date = $1 AND (${OCCUPIED_SQL})
     ORDER BY shift_id, created_at`,
    [date],
  );
  return rows.map(toReservation);
}

/** Anulación desde el panel de administración: devuelve el lugar al cupo. */
export async function cancelReservation(id: string): Promise<void> {
  const rows = await query<{ id: string }>(
    `UPDATE reservations SET status = 'cancelled', hold_expires_at = NULL, updated_at = now()
     WHERE id = $1 AND status <> 'cancelled' RETURNING id`,
    [id],
  );
  if (!rows[0]) throw new ReservationError('not_found');
}

/** ¿Todavía se puede cambiar el día o turno de esta reserva? */
export function canReschedule(reservation: Reservation, now = new Date()): boolean {
  if (reservation.status !== 'paid') return false;
  const start = shiftStartInstant(reservation.date, reservation.shiftId);
  return start.getTime() - now.getTime() >= RESCHEDULE_MIN_HOURS * 3_600_000;
}

/** Fecha y hora límite para cambiar (para mostrarle al cliente). */
export function rescheduleDeadline(reservation: Reservation): Date {
  const start = shiftStartInstant(reservation.date, reservation.shiftId);
  return new Date(start.getTime() - RESCHEDULE_MIN_HOURS * 3_600_000);
}

export async function rescheduleReservation(input: {
  code: string;
  email: string;
  date: string;
  shiftId: string;
  now?: Date;
}): Promise<Reservation> {
  const now = input.now ?? new Date();
  if (!isDateInBookingWindow(input.date, now) || !isVisitorShiftId(input.shiftId)) {
    throw new ReservationError('invalid');
  }
  const shiftId = input.shiftId;

  const current = await findReservationByCodeAndEmail(input.code, input.email);
  if (!current) throw new ReservationError('not_found');
  if (current.status !== 'paid') throw new ReservationError('not_paid');
  if (!canReschedule(current, now)) throw new ReservationError('too_late');
  if (current.date === input.date && current.shiftId === shiftId) throw new ReservationError('same_slot');

  // El nuevo turno también tiene que estar a 48 h o más, con la misma regla.
  const newStart = shiftStartInstant(input.date, shiftId);
  if (newStart.getTime() - now.getTime() < RESCHEDULE_MIN_HOURS * 3_600_000) {
    throw new ReservationError('too_late');
  }

  return transaction(async (client) => {
    await lockSlot(client, input.date, shiftId);
    const sold = await occupiedByShift(input.date, client, current.id);
    const snapshot = buildAvailability(input.date, sold, now).find((shift) => shift.id === shiftId);
    if (!snapshot || snapshot.status === 'ended') throw new ReservationError('ended');
    if (snapshot.remaining < current.quantity) throw new ReservationError('insufficient');

    const { rows } = await client.query<ReservationRow>(
      `UPDATE reservations
       SET visit_date = $2, shift_id = $3, reschedule_count = reschedule_count + 1, updated_at = now()
       WHERE id = $1 AND status = 'paid'
       RETURNING *`,
      [current.id, input.date, shiftId],
    );
    if (!rows[0]) throw new ReservationError('not_paid');
    return toReservation(rows[0]);
  });
}

/* ------------------------------------------------------------------ */
/* Devoluciones                                                        */
/* ------------------------------------------------------------------ */

/** Horas de anticipación para pedir la devolución total por política del parque. */
export const REFUND_POLICY_MIN_HOURS = 48;
/** Derecho de arrepentimiento (Ley 24.240 art. 34; Disp. 954/2025 art. 2): días corridos desde la compra. */
export const WITHDRAWAL_DAYS = 10;
/** ...y aviso mínimo antes del turno. */
export const WITHDRAWAL_MIN_HOURS = 24;

export type RefundGround = 'policy' | 'withdrawal';

/**
 * ¿Corresponde la devolución total automática?
 * - Por política: hasta 48 h antes del turno.
 * - Por arrepentimiento: dentro de los 10 días corridos desde el pago y con al menos 24 h de anticipación al turno.
 */
export function refundEligibility(reservation: Reservation, now = new Date()): RefundGround | null {
  if (reservation.status !== 'paid' || !reservation.mpPaymentId) return null;
  const hoursToStart = (shiftStartInstant(reservation.date, reservation.shiftId).getTime() - now.getTime()) / 3_600_000;
  if (hoursToStart >= REFUND_POLICY_MIN_HOURS) return 'policy';
  const paidAt = reservation.paidAt ? new Date(reservation.paidAt).getTime() : null;
  const daysSincePaid = paidAt === null ? Infinity : (now.getTime() - paidAt) / 86_400_000;
  if (daysSincePaid <= WITHDRAWAL_DAYS && hoursToStart >= WITHDRAWAL_MIN_HOURS) return 'withdrawal';
  return null;
}

export async function findReservationById(id: string): Promise<Reservation | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await query<ReservationRow>('SELECT * FROM reservations WHERE id = $1', [id]);
  return rows[0] ? toReservation(rows[0]) : null;
}

/** Marca la reserva como devuelta y libera los lugares. Devuelve null si ya estaba devuelta. */
export async function markReservationRefunded(
  id: string,
  refundId: string | null,
  origin: string,
): Promise<Reservation | null> {
  const rows = await query<ReservationRow>(
    `UPDATE reservations
     SET status = 'refunded', refunded_at = now(), mp_refund_id = COALESCE($2, mp_refund_id),
         refund_origin = $3, hold_expires_at = NULL, updated_at = now()
     WHERE id = $1 AND status <> 'refunded'
     RETURNING *`,
    [id, refundId, origin],
  );
  return rows[0] ? toReservation(rows[0]) : null;
}

/** Reservas devueltas de un día (para el panel). */
export async function listRefundedForDate(date: string): Promise<Reservation[]> {
  const rows = await query<ReservationRow>(
    `SELECT * FROM reservations WHERE visit_date = $1 AND status = 'refunded' ORDER BY refunded_at DESC`,
    [date],
  );
  return rows.map(toReservation);
}
