export const VISITOR_SHIFT_CAPACITY = 200;
export const VISITOR_SHIFT_MAX_PER_PURCHASE = 20;
export const VISITOR_SHIFT_HORIZON_DAYS = 90;

const ARGENTINA_TZ = 'America/Argentina/Buenos_Aires';

/**
 * Turnos del parque. Horarios en minutos desde la medianoche (hora de Argentina).
 * `name` y `hours` son los textos que se muestran en el panel, los correos y Mercado Pago.
 */
export const VISITOR_SHIFTS = [
  { id: 'manana', name: 'Mañana', start: 7 * 60 + 30, end: 13 * 60 + 30, startsNextDay: false, endsNextDay: false, hours: '07:30 a 13:30 hs' },
  { id: 'tarde', name: 'Tarde', start: 13 * 60 + 30, end: 19 * 60 + 30, startsNextDay: false, endsNextDay: false, hours: '13:30 a 19:30 hs' },
  { id: 'noche', name: 'Noche', start: 19 * 60 + 30, end: 1 * 60 + 30, startsNextDay: false, endsNextDay: true, hours: '19:30 a 01:30 hs' },
  // La Madrugada es la continuación de la noche del día elegido: de 01:30 a 07:30 del día siguiente.
  // Conserva el id "trasnoche" para que las reservas ya guardadas sigan siendo válidas.
  { id: 'trasnoche', name: 'Madrugada', start: 1 * 60 + 30, end: 7 * 60 + 30, startsNextDay: true, endsNextDay: true, hours: '01:30 a 07:30 hs del día siguiente' },
] as const;

export type VisitorShiftId = (typeof VISITOR_SHIFTS)[number]['id'];

export type VisitorShiftStatus = 'available' | 'sold_out' | 'ended';

export function isVisitorShiftId(value: string): value is VisitorShiftId {
  return VISITOR_SHIFTS.some((shift) => shift.id === value);
}

/** "Mañana · 07:30 a 13:30 hs" */
export function shiftLabel(id: VisitorShiftId): string {
  const shift = getVisitorShift(id);
  return `${shift.name} · ${shift.hours}`;
}

/** "07:30" */
export function formatMinutes(total: number): string {
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
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

/** Momento en que empieza el turno (Argentina, UTC−3). */
export function shiftStartInstant(date: string, shiftId: VisitorShiftId): Date {
  const shift = getVisitorShift(shiftId);
  const [year, month, day] = date.split('-').map(Number);
  const startDay = shift.startsNextDay ? day + 1 : day;
  return new Date(Date.UTC(year, month - 1, startDay, 3, shift.start, 0, 0));
}

/** Horas de anticipación mínimas para que el cliente cambie día o turno. */
export const RESCHEDULE_MIN_HOURS = 48;

/** Argentina no usa horario de verano: UTC−3 todo el año. */
export function shiftEndInstant(date: string, shiftId: VisitorShiftId): Date {
  const shift = getVisitorShift(shiftId);
  const [year, month, day] = date.split('-').map(Number);
  const endDay = shift.endsNextDay ? day + 1 : day;
  return new Date(Date.UTC(year, month - 1, endDay, 3, shift.end, 0, 0));
}

export function bookingWindow(now = new Date()): { minDate: string; maxDate: string; today: string } {
  const today = formatArgentinaDate(now);
  // Hasta las 07:30 sigue abierta la Madrugada (y antes la Noche) del día anterior.
  const lastOvernightEnd = Math.max(...VISITOR_SHIFTS.filter((s) => s.endsNextDay).map((s) => s.end), 0);
  const minDate = argentinaMinutes(now) < lastOvernightEnd ? addCalendarDays(today, -1) : today;
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
