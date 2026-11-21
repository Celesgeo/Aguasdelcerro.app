import { randomUUID } from 'node:crypto';
import { query } from '@/lib/db';
import { currentBusinessDate, currentShiftId } from '@/lib/stock-store';

export type CashClosure = {
  id: string;
  businessDate: string;
  shiftId: string;
  staffName: string;
  openingFloat: number;
  cashCounted: number;
  expectedCash: number;
  difference: number;
  note: string | null;
  createdAt: string;
};

type ClosureRow = {
  id: string;
  business_date: string;
  shift_id: string;
  staff_name: string;
  opening_float: number;
  cash_counted: number;
  expected_cash: number;
  difference: number;
  note: string | null;
  created_at: Date;
};

const mapClosure = (r: ClosureRow): CashClosure => ({
  id: r.id,
  businessDate: r.business_date,
  shiftId: r.shift_id,
  staffName: r.staff_name,
  openingFloat: Number(r.opening_float),
  cashCounted: Number(r.cash_counted),
  expectedCash: Number(r.expected_cash),
  difference: Number(r.difference),
  note: r.note,
  createdAt: new Date(r.created_at).toISOString(),
});

/** Efectivo que debería haber en el turno: productos + membresías presenciales cobrados en efectivo. */
export async function expectedCashForShift(date: string, shiftId: string): Promise<{ products: number; memberships: number }> {
  const [products, memberships] = await Promise.all([
    query<{ total: number }>(
      `SELECT COALESCE(SUM(total), 0)::int AS total FROM stock_movements
        WHERE business_date = $1 AND shift_id = $2 AND kind = 'sale' AND voided_at IS NULL
          AND COALESCE(payment_method, 'efectivo') = 'efectivo'`,
      [date, shiftId],
    ),
    query<{ total: number }>(
      `SELECT COALESCE(SUM(total), 0)::int AS total FROM reservations
        WHERE visit_date = $1 AND shift_id = $2 AND status = 'paid'
          AND sale_origin = 'presencial' AND payment_method = 'efectivo'`,
      [date, shiftId],
    ),
  ]);
  return { products: Number(products[0]?.total ?? 0), memberships: Number(memberships[0]?.total ?? 0) };
}

/** El vendedor declara el efectivo contado al cerrar el turno (no ve cuánto "debería" haber). */
export async function createCashClosure(input: {
  staffName: string;
  sellerId: string | null;
  openingFloat: number;
  cashCounted: number;
  note: string;
}): Promise<CashClosure> {
  const date = currentBusinessDate();
  const shiftId = currentShiftId();
  const expected = await expectedCashForShift(date, shiftId);
  const expectedCash = input.openingFloat + expected.products + expected.memberships;
  const rows = await query<ClosureRow>(
    `INSERT INTO stock_cash_closures
       (id, business_date, shift_id, staff_name, seller_id, opening_float, cash_counted, expected_cash, difference, note)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      randomUUID(),
      date,
      shiftId,
      input.staffName,
      input.sellerId,
      input.openingFloat,
      input.cashCounted,
      expectedCash,
      input.cashCounted - expectedCash,
      input.note || null,
    ],
  );
  return mapClosure(rows[0]!);
}

export async function listClosures(date: string): Promise<CashClosure[]> {
  const rows = await query<ClosureRow>(
    `SELECT * FROM stock_cash_closures WHERE business_date = $1 ORDER BY created_at DESC`,
    [date],
  );
  return rows.map(mapClosure);
}

/** ¿Ya se cerró la caja de este turno? (para mostrárselo al vendedor) */
export async function closuresForCurrentShift(): Promise<{ staffName: string; createdAt: string }[]> {
  const rows = await query<ClosureRow>(
    `SELECT * FROM stock_cash_closures WHERE business_date = $1 AND shift_id = $2 ORDER BY created_at DESC`,
    [currentBusinessDate(), currentShiftId()],
  );
  return rows.map((r) => ({ staffName: r.staff_name, createdAt: new Date(r.created_at).toISOString() }));
}
