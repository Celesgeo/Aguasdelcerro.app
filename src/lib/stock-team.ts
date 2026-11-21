import { randomUUID } from 'node:crypto';
import { query } from '@/lib/db';
import { currentBusinessDate, currentShiftId } from '@/lib/stock-store';
import { addCalendarDays } from '@/lib/visitor-shifts';

/* ------------------------------------------------------------------ */
/* Vendedores                                                          */
/* ------------------------------------------------------------------ */

export type Seller = { id: string; name: string; active: boolean };

type SellerRow = { id: string; name: string; active: boolean };

const mapSeller = (r: SellerRow): Seller => ({ id: r.id, name: r.name, active: r.active });

export async function listSellers(options: { includeInactive?: boolean } = {}): Promise<Seller[]> {
  const rows = await query<SellerRow>(
    `SELECT id, name, active FROM stock_sellers
      ${options.includeInactive ? '' : 'WHERE active = true'}
      ORDER BY active DESC, lower(name)`,
  );
  return rows.map(mapSeller);
}

export async function findSeller(id: string): Promise<Seller | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await query<SellerRow>(`SELECT id, name, active FROM stock_sellers WHERE id = $1`, [id]);
  return rows[0] ? mapSeller(rows[0]) : null;
}

export class SellerError extends Error {}

/** Normaliza el nombre escrito: sin espacios de más. */
export function cleanSellerName(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 60);
}

/** Busca al vendedor por nombre (sin importar mayúsculas); si no existe, lo crea. */
export async function findOrCreateSellerByName(rawName: string): Promise<Seller> {
  const name = cleanSellerName(rawName);
  if (!name) throw new SellerError('Escribí tu nombre');
  const existing = await query<SellerRow>(
    `SELECT id, name, active FROM stock_sellers WHERE lower(name) = lower($1)`,
    [name],
  );
  if (existing[0]) {
    if (!existing[0].active) {
      await query(`UPDATE stock_sellers SET active = true WHERE id = $1`, [existing[0].id]);
    }
    return mapSeller({ ...existing[0], active: true });
  }
  const rows = await query<SellerRow>(
    `INSERT INTO stock_sellers (id, name) VALUES ($1, $2)
     ON CONFLICT ((lower(name))) DO UPDATE SET active = true
     RETURNING id, name, active`,
    [randomUUID(), name],
  );
  return mapSeller(rows[0]!);
}

export async function createSeller(name: string): Promise<Seller> {
  const existing = await query<SellerRow>(`SELECT id, name, active FROM stock_sellers WHERE lower(name) = lower($1)`, [name]);
  if (existing[0]) {
    if (existing[0].active) throw new SellerError('Ya hay un vendedor con ese nombre.');
    const rows = await query<SellerRow>(
      `UPDATE stock_sellers SET active = true WHERE id = $1 RETURNING id, name, active`,
      [existing[0].id],
    );
    return mapSeller(rows[0]!);
  }
  const rows = await query<SellerRow>(
    `INSERT INTO stock_sellers (id, name) VALUES ($1, $2) RETURNING id, name, active`,
    [randomUUID(), name],
  );
  return mapSeller(rows[0]!);
}

export async function updateSeller(id: string, update: { name?: string; active?: boolean }): Promise<Seller | null> {
  const current = await findSeller(id);
  if (!current) return null;
  const name = update.name ?? current.name;
  const clash = await query<{ id: string }>(
    `SELECT id FROM stock_sellers WHERE lower(name) = lower($1) AND id <> $2`,
    [name, id],
  );
  if (clash[0]) throw new SellerError('Ya hay un vendedor con ese nombre.');
  const rows = await query<SellerRow>(
    `UPDATE stock_sellers SET name = $2, active = $3 WHERE id = $1 RETURNING id, name, active`,
    [id, name, update.active ?? current.active],
  );
  return rows[0] ? mapSeller(rows[0]) : null;
}

/* ------------------------------------------------------------------ */
/* Asistencia (lunes a viernes, se tilda solo el día de hoy)           */
/* ------------------------------------------------------------------ */

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function weekday(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
}

export function isWorkday(isoDate: string): boolean {
  const day = weekday(isoDate);
  return day >= 1 && day <= 5;
}

/** Lunes a viernes de la semana que contiene `isoDate`. */
export function workWeek(isoDate: string): { date: string; label: string }[] {
  const monday = addCalendarDays(isoDate, -((weekday(isoDate) + 6) % 7));
  return [0, 1, 2, 3, 4].map((i) => {
    const date = addCalendarDays(monday, i);
    const [, m, d] = date.split('-');
    return { date, label: `${DAY_NAMES[weekday(date)]} ${d}/${m}` };
  });
}

type AttendanceRow = { seller_id: string; work_date: string; shift_id: string | null; marked_at: Date; marked_by: string };

export type AttendanceMark = { date: string; shiftId: string | null; markedAt: string; markedBy: string };

export async function attendanceForWeek(isoDate: string): Promise<Map<string, AttendanceMark[]>> {
  const week = workWeek(isoDate);
  const rows = await query<AttendanceRow>(
    `SELECT seller_id, work_date, shift_id, marked_at, marked_by FROM stock_attendance
      WHERE work_date >= $1 AND work_date <= $2`,
    [week[0]!.date, week[4]!.date],
  );
  const map = new Map<string, AttendanceMark[]>();
  for (const r of rows) {
    const list = map.get(r.seller_id) ?? [];
    list.push({
      date: r.work_date,
      shiftId: r.shift_id,
      markedAt: new Date(r.marked_at).toISOString(),
      markedBy: r.marked_by,
    });
    map.set(r.seller_id, list);
  }
  return map;
}

export class AttendanceError extends Error {}

/** El vendedor marca (o desmarca) su asistencia de HOY. Solo lunes a viernes. */
export async function markOwnAttendance(sellerId: string, present: boolean): Promise<void> {
  const today = currentBusinessDate();
  if (!isWorkday(today)) throw new AttendanceError('La asistencia se marca de lunes a viernes.');
  await setAttendance(sellerId, today, present, 'staff');
}

/** El administrador puede corregir cualquier día. */
export async function setAttendance(
  sellerId: string,
  date: string,
  present: boolean,
  by: 'staff' | 'admin',
): Promise<void> {
  if (present) {
    await query(
      `INSERT INTO stock_attendance (id, seller_id, work_date, shift_id, marked_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (seller_id, work_date) DO NOTHING`,
      [randomUUID(), sellerId, date, by === 'staff' ? currentShiftId() : null, by],
    );
  } else {
    await query(`DELETE FROM stock_attendance WHERE seller_id = $1 AND work_date = $2`, [sellerId, date]);
  }
}

/** Marca asistencia de hoy si es día hábil (lunes a viernes). Se llama solo al ingresar o vender. */
export async function autoMarkAttendance(sellerId: string): Promise<void> {
  const today = currentBusinessDate();
  if (!isWorkday(today)) return;
  await setAttendance(sellerId, today, true, 'staff');
}

/** Días trabajados en la semana actual (lunes a viernes; el lunes vuelve a empezar). */
export async function weekCount(sellerId: string): Promise<number> {
  const week = workWeek(currentBusinessDate());
  const rows = await query<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM stock_attendance
      WHERE seller_id = $1 AND work_date >= $2 AND work_date <= $3`,
    [sellerId, week[0]!.date, week[4]!.date],
  );
  return Number(rows[0]?.n ?? 0);
}
