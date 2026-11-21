import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sellerIdFromCookie, stockViewer } from '@/lib/stock-auth';
import { currentBusinessDate } from '@/lib/stock-store';
import { AttendanceError, attendanceForWeek, isWorkday, markOwnAttendance, workWeek } from '@/lib/stock-team';

export const dynamic = 'force-dynamic';

/** Semana (lunes a viernes) del vendedor que está atendiendo. Solo se puede tildar hoy. */
export async function GET() {
  if (!(await stockViewer())) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const sellerId = await sellerIdFromCookie();
  if (!sellerId) return NextResponse.json({ ok: true, enabled: false, days: [] });
  try {
    const today = currentBusinessDate();
    const marks = (await attendanceForWeek(today)).get(sellerId) ?? [];
    const days = workWeek(today).map((d) => ({
      ...d,
      present: marks.some((m) => m.date === d.date),
      isToday: d.date === today,
    }));
    return NextResponse.json({
      ok: true,
      enabled: true,
      todayIsWorkday: isWorkday(today),
      total: days.filter((d) => d.present).length,
      days,
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo cargar la asistencia' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await stockViewer())) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const sellerId = await sellerIdFromCookie();
  if (!sellerId) {
    return NextResponse.json({ ok: false, error: 'Elegí tu nombre de la lista para marcar asistencia' }, { status: 400 });
  }
  const body = await request.json().catch(() => ({}));
  try {
    await markOwnAttendance(sellerId, body?.present !== false);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AttendanceError) return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    return NextResponse.json({ ok: false, error: 'No se pudo guardar la asistencia' }, { status: 500 });
  }
}
