import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import { getShiftAvailability, listShiftSales } from '@/lib/shift-inventory';
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

  const [shifts, sales] = await Promise.all([getShiftAvailability(date), listShiftSales(date)]);
  return NextResponse.json({ ok: true, date, shifts, sales });
}
