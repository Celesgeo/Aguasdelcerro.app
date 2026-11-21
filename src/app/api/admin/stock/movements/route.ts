import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stockViewer } from '@/lib/stock-auth';
import { currentBusinessDate, currentShiftId, listMovements } from '@/lib/stock-store';
import { isValidDateISO } from '@/lib/security';

export const dynamic = 'force-dynamic';

/** Movimientos de una jornada (ventas, reposiciones y ajustes). */
export async function GET(request: NextRequest) {
  if ((await stockViewer()) !== 'admin') {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const requested = request.nextUrl.searchParams.get('date') ?? '';
  const date = isValidDateISO(requested) ? requested : currentBusinessDate();
  try {
    const movements = await listMovements({ businessDate: date });
    return NextResponse.json({
      ok: true,
      date,
      today: currentBusinessDate(),
      currentShiftId: currentShiftId(),
      movements,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar los movimientos' }, { status: 500 });
  }
}
