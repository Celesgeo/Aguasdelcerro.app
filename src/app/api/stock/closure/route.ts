import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sellerIdFromCookie, staffNameFromCookie, stockViewer } from '@/lib/stock-auth';
import { closuresForCurrentShift, createCashClosure } from '@/lib/stock-cash';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await stockViewer())) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, closures: await closuresForCurrentShift() });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo cargar' }, { status: 500 });
  }
}

/** Cierre de caja del turno en curso. No devuelve el monto esperado (conteo a ciegas). */
export async function POST(request: NextRequest) {
  const viewer = await stockViewer();
  if (!viewer) return NextResponse.json({ ok: false, error: 'Tu sesión venció. Ingresá la clave de nuevo.' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const cashCounted = Number(body?.cashCounted);
  const openingFloat = Number(body?.openingFloat ?? 0);
  const valid = (n: number) => Number.isInteger(n) && n >= 0 && n <= 1_000_000_000;
  if (!valid(cashCounted)) return NextResponse.json({ ok: false, error: 'Cargá el efectivo contado (en pesos, sin centavos)' }, { status: 400 });
  if (!valid(openingFloat)) return NextResponse.json({ ok: false, error: 'Fondo inicial inválido' }, { status: 400 });

  const staffName = (await staffNameFromCookie()) || (viewer === 'admin' ? 'Administración' : '');
  if (!staffName) return NextResponse.json({ ok: false, error: 'Escribí tu nombre antes de cerrar la caja' }, { status: 400 });
  try {
    await createCashClosure({
      staffName,
      sellerId: await sellerIdFromCookie(),
      openingFloat,
      cashCounted,
      note: sanitizeText(body?.note, 300),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar el cierre' }, { status: 500 });
  }
}
