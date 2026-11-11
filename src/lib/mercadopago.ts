import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { getSiteUrl } from '@/lib/site-url';
import type { Reservation } from '@/lib/reservations';
import { shiftLabel } from '@/lib/visitor-shifts';

/**
 * Mercado Pago · Checkout Pro (API de preferencias).
 * Credenciales: variable MP_ACCESS_TOKEN en Railway (nunca en el código).
 * Firma de avisos (opcional pero recomendada): MP_WEBHOOK_SECRET.
 */

const MP_API = 'https://api.mercadopago.com';

function accessToken(): string | null {
  return process.env.MP_ACCESS_TOKEN?.trim() || null;
}

export function isMercadoPagoConfigured(): boolean {
  return accessToken() !== null;
}

export interface MpPayment {
  id: string;
  status: string;
  statusDetail: string | null;
  externalReference: string | null;
  amount: number;
  currency: string | null;
}

async function mpFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = accessToken();
  if (!token) throw new Error('MP_ACCESS_TOKEN no está configurado');
  return fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });
}

function readableDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

/** Crea el pago único de una reserva y devuelve el enlace de Mercado Pago. */
export async function createCheckoutPreference(
  reservation: Reservation,
  holdMinutes: number,
): Promise<{ preferenceId: string; checkoutUrl: string }> {
  const site = getSiteUrl();
  const returnUrl = `${site}/reservas/confirmacion?code=${encodeURIComponent(reservation.code)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + holdMinutes * 60_000);

  const response = await mpFetch('/checkout/preferences', {
    method: 'POST',
    headers: { 'X-Idempotency-Key': randomUUID() },
    body: JSON.stringify({
      items: [
        {
          id: 'membresia-visitante-individual',
          title: 'Membresía visitante individual · Aguas del Cerro',
          description: `${readableDate(reservation.date)} · ${shiftLabel(reservation.shiftId)}`,
          quantity: reservation.quantity,
          unit_price: reservation.unitPrice,
          currency_id: 'ARS',
        },
      ],
      payer: {
        name: reservation.name,
        email: reservation.email,
      },
      external_reference: reservation.code,
      notification_url: `${site}/api/mercadopago/webhook`,
      back_urls: {
        success: returnUrl,
        pending: returnUrl,
        failure: returnUrl,
      },
      auto_return: 'approved',
      // Solo aprobado o rechazado: evita pagos en efectivo que se acreditan días después.
      binary_mode: true,
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }],
      },
      expires: true,
      expiration_date_from: now.toISOString(),
      expiration_date_to: expiresAt.toISOString(),
      statement_descriptor: 'AGUAS DEL CERRO',
    }),
  });

  const data = (await response.json().catch(() => null)) as
    | { id?: string; init_point?: string; message?: string }
    | null;
  if (!response.ok || !data?.id || !data.init_point) {
    throw new Error(`Mercado Pago rechazó la preferencia (${response.status}): ${data?.message ?? 'sin detalle'}`);
  }
  return { preferenceId: data.id, checkoutUrl: data.init_point };
}

/** Consulta un pago directamente a Mercado Pago (fuente de verdad, no se confía en lo que llega por URL). */
export async function getPayment(paymentId: string): Promise<MpPayment | null> {
  if (!/^\d{1,30}$/.test(paymentId)) return null;
  const response = await mpFetch(`/v1/payments/${paymentId}`);
  if (response.status === 404) return null;
  const data = (await response.json().catch(() => null)) as
    | {
        id?: number | string;
        status?: string;
        status_detail?: string;
        external_reference?: string | null;
        transaction_amount?: number;
        currency_id?: string;
      }
    | null;
  if (!response.ok || !data?.id) {
    throw new Error(`No se pudo consultar el pago ${paymentId} (${response.status})`);
  }
  return {
    id: String(data.id),
    status: data.status ?? 'unknown',
    statusDetail: data.status_detail ?? null,
    externalReference: data.external_reference ?? null,
    amount: Number(data.transaction_amount ?? 0),
    currency: data.currency_id ?? null,
  };
}

/**
 * Verifica la firma `x-signature` de los avisos de Mercado Pago.
 * Si MP_WEBHOOK_SECRET no está configurado, devuelve true (igual se consulta el pago a la API).
 */
export function verifyWebhookSignature(input: {
  signatureHeader: string | null;
  requestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  if (!input.signatureHeader) return false;

  const parts = Object.fromEntries(
    input.signatureHeader.split(',').map((part) => {
      const [key, ...rest] = part.split('=');
      return [key.trim(), rest.join('=').trim()];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const dataId = input.dataId && /^[a-z0-9]+$/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId;
  let manifest = '';
  if (dataId) manifest += `id:${dataId};`;
  if (input.requestId) manifest += `request-id:${input.requestId};`;
  manifest += `ts:${ts};`;

  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(v1, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export class RefundError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Devolución total de un pago. La clave de idempotencia es fija por reserva:
 * si se pide dos veces (doble clic, reintento), Mercado Pago devuelve una sola vez.
 * Requiere saldo disponible en la cuenta de Mercado Pago.
 */
export async function refundPaymentFully(paymentId: string, idempotencyKey: string): Promise<{ refundId: string }> {
  if (!/^\d{1,30}$/.test(paymentId)) throw new RefundError('Número de pago inválido', 400);
  const response = await mpFetch(`/v1/payments/${paymentId}/refunds`, {
    method: 'POST',
    headers: { 'X-Idempotency-Key': idempotencyKey },
    body: JSON.stringify({}),
  });
  const data = (await response.json().catch(() => null)) as
    | { id?: number | string; status?: string; message?: string; cause?: Array<{ description?: string }> }
    | null;
  if (!response.ok || !data?.id) {
    const detail = data?.cause?.[0]?.description || data?.message || 'sin detalle';
    throw new RefundError(`Mercado Pago no pudo hacer la devolución (${response.status}): ${detail}`, response.status);
  }
  return { refundId: String(data.id) };
}
