import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stockViewer } from '@/lib/stock-auth';
import { currentBusinessDate } from '@/lib/stock-store';
import { attendanceForWeek, findSeller, listSellers, setAttendance, workWeek } from '@/lib/stock-team';
import { isValidDateISO } from '@/lib/security';

export const dynamic = 'force-dynamic';

/** Planilla semanal: vendedores × lunes a viernes, con el total de días. */
export async function GET(request: NextRequest) {
  if ((await stockViewer()) !== 'admin') return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const requested = request.nextUrl.searchParams.get('date') ?? '';
  const today = currentBusinessDate();
  const date = isValidDateISO(requested) ? requested : today;
  try {
    const [sellers, marks] = await Promise.all([listSellers({ includeInactive: true }), attendanceForWeek(date)]);
    const week = workWeek(date);
    const rows = sellers
      .filter((s) => s.active || (marks.get(s.id)?.length ?? 0) > 0)
      .map((s) => {
        const list = marks.get(s.id) ?? [];
        return {
          id: s.id,
          name: s.name,
          active: s.active,
          days: week.map((d) => {
            const mark = list.find((m) => m.date === d.date);
            return { date: d.date, present: Boolean(mark), markedAt: mark?.markedAt ?? null, markedBy: mark?.markedBy ?? null };
          }),
          total: list.length,
        };
      });
    return NextResponse.json({ ok: true, today, week, rows });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo cargar la asistencia' }, { status: 500 });
  }
}

/** Corrección del administrador: { sellerId, date, present } */
export async function PUT(request: NextRequest) {
  if ((await stockViewer()) !== 'admin') return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const date = String(body?.date ?? '');
  const seller = await findSeller(String(body?.sellerId ?? '')).catch(() => null);
  if (!seller || !isValidDateISO(date)) return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
  try {
    await setAttendance(seller.id, date, Boolean(body?.present), 'admin');
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar' }, { status: 500 });
  }
}
