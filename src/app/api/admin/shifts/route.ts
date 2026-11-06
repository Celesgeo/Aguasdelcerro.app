import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import { getShiftAvailability, listReservationsForDate } from '@/lib/reservations';
import { bookingWindow, isRealCalendarDate } from '@/lib/visitor-shifts';

async function requireAdmin() {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function GET(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }

  const url = new URL(request.url);
  const requested = url.searchParams.get('date')?.trim() ?? '';
  const date = requested || bookingWindow().today;
  if (!isRealCalendarDate(date)) {
    return NextResponse.json({ ok: false, error: 'Fecha inválida' }, { status: 400 });
  }

  try {
    const [shifts, reservations] = await Promise.all([
      getShiftAvailability(date),
      listReservationsForDate(date),
    ]);
    return NextResponse.json({ ok: true, date, shifts, reservations });
  } catch (error) {
    console.error('[admin/shifts]', error);
    return NextResponse.json({ ok: false, error: 'No se pudo leer la base de datos' }, { status: 500 });
  }
}
