import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { listPaidMemberships, listVoidedInPerson } from '@/lib/reservations';
import { listClosures } from '@/lib/stock-cash';
import { stockViewer } from '@/lib/stock-auth';
import { toShiftMembership } from '@/lib/stock-memberships';
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
    const [movements, memberships, voidedMemberships, closures] = await Promise.all([
      listMovements({ businessDate: date }),
      listPaidMemberships(date),
      listVoidedInPerson(date),
      listClosures(date),
    ]);
    return NextResponse.json({
      ok: true,
      date,
      today: currentBusinessDate(),
      currentShiftId: currentShiftId(),
      movements,
      memberships: memberships.map((r) => ({ ...toShiftMembership(r), shiftId: r.shiftId })),
      voidedMemberships: voidedMemberships.map((r) => ({
        ...toShiftMembership(r),
        shiftId: r.shiftId,
        voidedAt: r.voidedAt,
        voidedBy: r.voidedBy,
      })),
      closures,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar los movimientos' }, { status: 500 });
  }
}
