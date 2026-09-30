export const VISITOR_SHIFT_CAPACITY = 200;
export const VISITOR_SHIFT_MAX_PER_PURCHASE = 20;
export const VISITOR_SHIFT_HORIZON_DAYS = 90;

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

export const VISITOR_SHIFTS = [
  { id: 'manana', startHour: 8, endHour: 12, endsNextDay: false },
  { id: 'siesta', startHour: 12, endHour: 16, endsNextDay: false },
  { id: 'tarde', startHour: 16, endHour: 21, endsNextDay: false },
  { id: 'noche', startHour: 21, endHour: 5, endsNextDay: true },
] as const;

export type VisitorShiftId = (typeof VISITOR_SHIFTS)[number]['id'];

export type VisitorShiftStatus = 'available' | 'sold_out' | 'ended';

export function isVisitorShiftId(value: string): value is VisitorShiftId {
  return VISITOR_SHIFTS.some((shift) => shift.id === value);
}

export function getVisitorShift(id: VisitorShiftId) {
  const shift = VISITOR_SHIFTS.find((item) => item.id === id);
  if (!shift) throw new Error('Turno inválido');
  return shift;
}

export function formatArgentinaDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function argentinaMinutes(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: ARGENTINA_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');
  return hour * 60 + minute;
}

export function addCalendarDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  const yyyy = next.getUTCFullYear();
  const mm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(next.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function isRealCalendarDate(isoDate: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  const [year, month, day] = isoDate.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/** Argentina no usa horario de verano: UTC−3 todo el año. */
export function shiftEndInstant(date: string, shiftId: VisitorShiftId): Date {
  const shift = getVisitorShift(shiftId);
  const [year, month, day] = date.split('-').map(Number);
  const endDay = shift.endsNextDay ? day + 1 : day;
  return new Date(Date.UTC(year, month - 1, endDay, shift.endHour + 3, 0, 0, 0));
}

export function bookingWindow(now = new Date()): { minDate: string; maxDate: string; today: string } {
  const today = formatArgentinaDate(now);
  const minDate = argentinaMinutes(now) < 5 * 60 ? addCalendarDays(today, -1) : today;
  return {
    today,
    minDate,
    maxDate: addCalendarDays(today, VISITOR_SHIFT_HORIZON_DAYS),
  };
}

export function isDateInBookingWindow(date: string, now = new Date()): boolean {
  if (!isRealCalendarDate(date)) return false;
  const { minDate, maxDate } = bookingWindow(now);
  return date >= minDate && date <= maxDate;
}

export function shiftStatus(input: {
  date: string;
  shiftId: VisitorShiftId;
  sold: number;
  now?: Date;
}): VisitorShiftStatus {
  const now = input.now ?? new Date();
  if (!isDateInBookingWindow(input.date, now) || now.getTime() >= shiftEndInstant(input.date, input.shiftId).getTime()) {
    return 'ended';
  }
  if (input.sold >= VISITOR_SHIFT_CAPACITY) return 'sold_out';
  return 'available';
}
