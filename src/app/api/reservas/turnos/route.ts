import { NextResponse } from 'next/server';
import { getTicketPaymentLink } from '@/lib/payment-links';
import { clientIp } from '@/lib/request-ip';
import {
  ShiftReserveError,
  getShiftAvailability,
  reserveShift,
} from '@/lib/shift-inventory';
import { TICKET_PRICE_ARS } from '@/lib/memberships';
import { bookingWindow, isDateInBookingWindow } from '@/lib/visitor-shifts';

const reserveBuckets = new Map<string, { count: number; resetAt: number }>();

function allowReserve(ip: string): boolean {
  const now = Date.now();
  const current = reserveBuckets.get(ip);
  const windowMs = 10 * 60_000;
  const limit = 8;
  if (!current || now >= current.resetAt) {
    reserveBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function publicShifts(shifts: Awaited<ReturnType<typeof getShiftAvailability>>) {
  return shifts.map((shift) => ({
    id: shift.id,
    status: shift.status,
  }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get('date')?.trim() ?? '';
  const window = bookingWindow();
  const date = requested || window.today;

  if (!isDateInBookingWindow(date)) {
    return NextResponse.json(
      { ok: false, code: 'invalid' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const shifts = await getShiftAvailability(date);
  return NextResponse.json(
    {
      ok: true,
      date,
      minDate: window.minDate,
      maxDate: window.maxDate,
      price: TICKET_PRICE_ARS,
      shifts: publicShifts(shifts),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export async function POST(request: Request) {
  if (!allowReserve(clientIp(request))) {
    return NextResponse.json(
      { ok: false, code: 'rate_limit' },
      { status: 429, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const paymentUrl = getTicketPaymentLink();
  if (!paymentUrl) {
    return NextResponse.json(
      { ok: false, code: 'unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  let body: { date?: unknown; shiftId?: unknown; quantity?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: 'invalid' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const { sale } = await reserveShift({
      date: typeof body.date === 'string' ? body.date : '',
      shiftId: typeof body.shiftId === 'string' ? body.shiftId : '',
      quantity: typeof body.quantity === 'number' ? body.quantity : Number(body.quantity),
    });
    const shifts = await getShiftAvailability(sale.date);
    return NextResponse.json(
      {
        ok: true,
        paymentUrl,
        quantity: sale.quantity,
        shiftId: sale.shiftId,
        shifts: publicShifts(shifts),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    if (error instanceof ShiftReserveError) {
      const status = error.code === 'invalid' ? 400 : 409;
      return NextResponse.json(
        { ok: false, code: error.code },
        { status, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    return NextResponse.json(
      { ok: false, code: 'unavailable' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
