import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { staffNameFromCookie, stockViewer } from '@/lib/stock-auth';
import { StockError, returnRental } from '@/lib/stock-store';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

/** Devolución de algo alquilado (bata): vuelve al stock. */
export async function POST(request: NextRequest) {
  if (!(await stockViewer())) {
    return NextResponse.json({ ok: false, error: 'Tu sesión venció. Ingresá la clave de nuevo.' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const productId = String(body?.productId ?? '');
  const units = Number(body?.units ?? 1);
  const staffName = (await staffNameFromCookie()) || sanitizeText(body?.staffName, 60) || 'Sin nombre';
  if (!/^[0-9a-f-]{36}$/i.test(productId)) {
    return NextResponse.json({ ok: false, error: 'Producto inválido' }, { status: 400 });
  }
  if (!Number.isInteger(units) || units < 1 || units > 50) {
    return NextResponse.json({ ok: false, error: 'Cantidad inválida' }, { status: 400 });
  }
  try {
    const product = await returnRental({ productId, units, staffName });
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    if (error instanceof StockError) return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    return NextResponse.json({ ok: false, error: 'No se pudo registrar la devolución' }, { status: 500 });
  }
}
