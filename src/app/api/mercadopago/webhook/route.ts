import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/mercadopago';
import { processPayment } from '@/lib/reservation-payments';

/**
 * Aviso automático de Mercado Pago (notification_url de cada pago).
 * No se confía en el contenido del aviso: solo se toma el número de pago
 * y se consulta el estado real a la API de Mercado Pago.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  let body: { type?: string; topic?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const topic = body.type ?? body.topic ?? url.searchParams.get('type') ?? url.searchParams.get('topic');
  const dataId = String(body.data?.id ?? url.searchParams.get('data.id') ?? url.searchParams.get('id') ?? '');

  if (topic !== 'payment' || !/^\d{1,30}$/.test(dataId)) {
    // Otros avisos (merchant_order, etc.) no se usan: se responde OK para que no reintente.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const validSignature = verifyWebhookSignature({
    signatureHeader: request.headers.get('x-signature'),
    requestId: request.headers.get('x-request-id'),
    dataId: url.searchParams.get('data.id') ?? dataId,
  });
  if (!validSignature) {
    console.warn('[mp/webhook] firma inválida para el pago', dataId);
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const outcome = await processPayment(dataId);
    console.log(`[mp/webhook] pago ${dataId}: ${outcome.kind}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    // 500 hace que Mercado Pago reintente más tarde.
    console.error('[mp/webhook] error procesando el pago', dataId, error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
