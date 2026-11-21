import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sellerIdFromCookie, staffNameFromCookie, stockViewer } from '@/lib/stock-auth';
import { autoMarkAttendance } from '@/lib/stock-team';
import {
  StockError,
  currentBusinessDate,
  currentShiftId,
  listMovements,
  registerSale,
} from '@/lib/stock-store';
import { clientIp, rateLimit, sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;

/** Ventas del turno en curso. */
export async function GET() {
  if (!(await stockViewer())) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    const sales = await listMovements({
      businessDate: currentBusinessDate(),
      shiftId: currentShiftId(),
      kind: 'sale',
    });
    return NextResponse.json({ ok: true, sales });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar las ventas' }, { status: 500 });
  }
}

/** Registrar una venta: descuenta del stock. */
export async function POST(request: NextRequest) {
  if (!(await stockViewer())) {
    return NextResponse.json({ ok: false, error: 'Tu sesión venció. Ingresá la clave de nuevo.' }, { status: 401 });
  }
  const limited = rateLimit(`stock-sale:${clientIp(request)}`, 120, 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: 'Demasiadas ventas seguidas. Esperá un momento.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const productId = String(body?.productId ?? '');
  const units = Number(body?.units ?? 1);
  const staffName = (await staffNameFromCookie()) || sanitizeText(body?.staffName, 60);
  const paymentMethod = String(body?.paymentMethod ?? 'efectivo');
  if (!['efectivo', 'transferencia', 'tarjeta'].includes(paymentMethod)) {
    return NextResponse.json({ ok: false, error: 'Forma de pago inválida' }, { status: 400 });
  }

  if (!UUID.test(productId)) {
    return NextResponse.json({ ok: false, error: 'Producto inválido' }, { status: 400 });
  }
  if (!Number.isInteger(units) || units < 1 || units > 50) {
    return NextResponse.json({ ok: false, error: 'Cantidad inválida (de 1 a 50)' }, { status: 400 });
  }
  if (!staffName) {
    return NextResponse.json({ ok: false, error: 'Escribí tu nombre antes de vender' }, { status: 400 });
  }

  try {
    const result = await registerSale({ productId, units, staffName, paymentMethod });
    const sellerId = await sellerIdFromCookie();
    if (sellerId) await autoMarkAttendance(sellerId).catch(() => undefined);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: 'No se pudo registrar la venta' }, { status: 500 });
  }
}
