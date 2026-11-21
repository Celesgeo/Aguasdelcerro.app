import { NextResponse } from 'next/server';
import { sellerIdFromCookie, stockViewer } from '@/lib/stock-auth';
import { weekCount } from '@/lib/stock-team';

export const dynamic = 'force-dynamic';

/** Solo el contador de días de la semana del vendedor que atiende (la planilla la ve el admin). */
export async function GET() {
  if (!(await stockViewer())) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const sellerId = await sellerIdFromCookie();
  if (!sellerId) return NextResponse.json({ ok: true, daysThisWeek: null });
  try {
    return NextResponse.json({ ok: true, daysThisWeek: await weekCount(sellerId) });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo cargar' }, { status: 500 });
  }
}
