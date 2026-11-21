import { randomUUID } from 'node:crypto';
import { query, transaction } from '@/lib/db';
import { formatArgentinaDate, type VisitorShiftId } from '@/lib/visitor-shifts';

export { STOCK_CATEGORIES, isStockCategory, type StockCategory } from '@/lib/stock-shared';
import type { StockCategory } from '@/lib/stock-shared';

export type StockProduct = {
  id: string;
  name: string;
  category: string;
  unitPrice: number;
  /** null = sin control de stock */
  quantity: number | null;
  lowAlert: number;
  active: boolean;
  sortOrder: number;
  /** Se alquila: al devolverlo vuelve al stock (p. ej. batas). */
  isRental: boolean;
};

const PRODUCT_COLS = 'id, name, category, unit_price, quantity, low_alert, active, sort_order, is_rental';

export type StockMovement = {
  id: string;
  productId: string;
  productName: string;
  /** return = devolución de algo alquilado (bata): vuelve al stock */
  kind: 'sale' | 'restock' | 'adjust' | 'return';
  units: number;
  unitPrice: number;
  total: number;
  shiftId: string | null;
  businessDate: string;
  staffName: string | null;
  note: string | null;
  voided: boolean;
  createdAt: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  unit_price: number;
  quantity: number | null;
  low_alert: number;
  active: boolean;
  sort_order: number;
  is_rental: boolean;
};

type MovementRow = {
  id: string;
  product_id: string;
  product_name: string;
  kind: StockMovement['kind'];
  units: number;
  unit_price: number;
  total: number;
  shift_id: string | null;
  business_date: string;
  staff_name: string | null;
  note: string | null;
  voided_at: Date | null;
  created_at: Date;
};

function mapProduct(row: ProductRow): StockProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unitPrice: Number(row.unit_price),
    quantity: row.quantity === null ? null : Number(row.quantity),
    lowAlert: Number(row.low_alert),
    active: row.active,
    sortOrder: Number(row.sort_order),
    isRental: Boolean(row.is_rental),
  };
}

function mapMovement(row: MovementRow): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.product_name,
    kind: row.kind,
    units: Number(row.units),
    unitPrice: Number(row.unit_price),
    total: Number(row.total),
    shiftId: row.shift_id,
    businessDate: row.business_date,
    staffName: row.staff_name,
    note: row.note,
    voided: Boolean(row.voided_at),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Turno y jornada actuales                                            */
/* ------------------------------------------------------------------ */

function argentinaMinutesNow(now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h * 60 + m;
}

/** Turno en curso según la hora de Argentina (Mañana, Tarde, Noche, Madrugada). */
export function currentShiftId(now = new Date()): VisitorShiftId {
  const m = argentinaMinutesNow(now);
  if (m >= 450 && m < 810) return 'manana';
  if (m >= 810 && m < 1170) return 'tarde';
  if (m >= 1170 || m < 90) return 'noche';
  return 'trasnoche';
}

/**
 * Jornada del parque: arranca 07:30. Lo vendido en Noche (después de medianoche)
 * y Madrugada cuenta para el día en que empezó la jornada.
 */
export function currentBusinessDate(now = new Date()): string {
  return formatArgentinaDate(new Date(now.getTime() - 450 * 60 * 1000));
}

/* ------------------------------------------------------------------ */
/* Carga inicial                                                       */
/* ------------------------------------------------------------------ */

type SeedItem = [name: string, category: StockCategory, price: number, quantity: number | null];

const SEED: SeedItem[] = [
  ['Coca-Cola 1,5 L', 'Bebidas', 5000, 6],
  ['Coca-Cola 3 L', 'Bebidas', 9000, 2],
  ['Fanta 3 L', 'Bebidas', 9000, 1],
  ['Sprite 3 L', 'Bebidas', 9000, 1],
  ['Coca-Cola Zero 2,5 L', 'Bebidas', 6500, 2],
  ['Agua mineral', 'Bebidas', 3000, 2],
  ['Gaseosa en jarra', 'Bebidas', 3000, null],
  ['Cerveza Budweiser 1 L', 'Cervezas', 8000, 12],
  ['Cerveza Budweiser lata', 'Cervezas', 4000, 3],
  ['Cerveza Andes rubia lata', 'Cervezas', 4000, 0],
  ['Cerveza Stella Artois lata', 'Cervezas', 4000, 2],
  ['Cerveza Corona 750 ml', 'Cervezas', 8000, 2],
  ['Corona sin alcohol 330 ml', 'Cervezas', 5000, 1],
  ['Licuado (vaso)', 'Licuados y limonadas', 5000, null],
  ['Licuado (jarra)', 'Licuados y limonadas', 9000, null],
  ['Limonada (vaso)', 'Licuados y limonadas', 4000, null],
  ['Limonada (jarra)', 'Licuados y limonadas', 7000, null],
  ['Gin tonic', 'Tragos', 0, null],
  ['Fernet (medida)', 'Tragos', 0, null],
  ['Papas fritas', 'Comidas', 3000, null],
  ['Sándwich de miga', 'Comidas', 2000, 6],
  ['Galletitas Pepas', 'Galletitas', 3000, 1],
  ['Galletitas Don Satur', 'Galletitas', 3000, 3],
  ['Galletitas Surtido Bagley', 'Galletitas', 5000, 2],
  ['Galletitas Diversión', 'Galletitas', 4000, 1],
  ['Galletitas Serranitas', 'Galletitas', 4000, 2],
  ['Bata (alquiler)', 'Batas', 10000, null],
];

const globalForStock = globalThis as unknown as { __adcStockSeeded?: Promise<void> };

async function ensureSeed(): Promise<void> {
  if (!globalForStock.__adcStockSeeded) {
    globalForStock.__adcStockSeeded = transaction(async (client) => {
      // Solo se carga una vez en la vida de la base (queda marcado en stock_settings).
      const marked = await client.query(
        `INSERT INTO stock_settings (key, value) VALUES ('seeded', '1') ON CONFLICT (key) DO NOTHING RETURNING key`,
      );
      if (marked.rowCount === 0) return;
      let order = 0;
      for (const [name, category, price, quantity] of SEED) {
        order += 10;
        await client.query(
          `INSERT INTO stock_products (id, name, category, unit_price, quantity, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [randomUUID(), name, category, price, quantity, order],
        );
      }
    })
      .then(() => migrateBatas())
      .then(() => migrateLeonardoWeek())
      .catch((error: unknown) => {
        globalForStock.__adcStockSeeded = undefined;
        throw error;
      });
  }
  return globalForStock.__adcStockSeeded;
}

/** Una sola vez: las batas pasan a ser de alquiler con 24 unidades. */
async function migrateBatas(): Promise<void> {
  await transaction(async (client) => {
    const marked = await client.query(
      `INSERT INTO stock_settings (key, value) VALUES ('batas_24_v1', '1') ON CONFLICT (key) DO NOTHING RETURNING key`,
    );
    if (marked.rowCount === 0) return;
    const found = await client.query<ProductRow>(
      `SELECT ${PRODUCT_COLS} FROM stock_products
        WHERE category = 'Batas' OR name ILIKE '%bata%'
        ORDER BY active DESC, sort_order LIMIT 1 FOR UPDATE`,
    );
    const bata = found.rows[0];
    if (!bata) {
      await client.query(
        `INSERT INTO stock_products (id, name, category, unit_price, quantity, sort_order, is_rental)
         VALUES ($1, 'Bata (alquiler)', 'Batas', 10000, 24, 10, true)`,
        [randomUUID()],
      );
      return;
    }
    await client.query(
      `UPDATE stock_products SET quantity = 24, is_rental = true, active = true, updated_at = now() WHERE id = $1`,
      [bata.id],
    );
    await client.query(
      `INSERT INTO stock_movements (id, product_id, product_name, kind, units, business_date, note)
       VALUES ($1, $2, $3, 'adjust', $4, $5, 'Carga de batas en alquiler: 24 unidades')`,
      [randomUUID(), bata.id, bata.name, 24 - (bata.quantity ?? 0), currentBusinessDate()],
    );
  });
}

/** Una sola vez: Leonardo Orellano con asistencia lunes 16 a viernes 20/11/2026 (5 días). */
async function migrateLeonardoWeek(): Promise<void> {
  await transaction(async (client) => {
    const marked = await client.query(
      `INSERT INTO stock_settings (key, value) VALUES ('leonardo_week_2026_11_16', '1') ON CONFLICT (key) DO NOTHING RETURNING key`,
    );
    if (marked.rowCount === 0) return;
    const found = await client.query<{ id: string }>(
      `SELECT id FROM stock_sellers WHERE lower(name) = lower('Leonardo Orellano')`,
    );
    let sellerId = found.rows[0]?.id;
    if (!sellerId) {
      sellerId = randomUUID();
      await client.query(`INSERT INTO stock_sellers (id, name) VALUES ($1, 'Leonardo Orellano')`, [sellerId]);
    } else {
      await client.query(`UPDATE stock_sellers SET active = true WHERE id = $1`, [sellerId]);
    }
    for (const day of ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20']) {
      await client.query(
        `INSERT INTO stock_attendance (id, seller_id, work_date, marked_by)
         VALUES ($1, $2, $3, 'admin') ON CONFLICT (seller_id, work_date) DO NOTHING`,
        [randomUUID(), sellerId, day],
      );
    }
  });
}

/* ------------------------------------------------------------------ */
/* Productos                                                           */
/* ------------------------------------------------------------------ */

export async function listProducts(options: { includeInactive?: boolean } = {}): Promise<StockProduct[]> {
  await ensureSeed();
  const rows = await query<ProductRow>(
    `SELECT ${PRODUCT_COLS}
       FROM stock_products
      ${options.includeInactive ? '' : 'WHERE active = true'}
      ORDER BY active DESC, category, sort_order, name`,
  );
  return rows.map(mapProduct);
}

export type ProductInput = {
  name: string;
  category: string;
  unitPrice: number;
  quantity: number | null;
  lowAlert: number;
  isRental?: boolean;
};

export async function createProduct(input: ProductInput): Promise<StockProduct> {
  await ensureSeed();
  const id = randomUUID();
  const businessDate = currentBusinessDate();
  return transaction(async (client) => {
    const order = await client.query<{ next: number }>(
      `SELECT COALESCE(MAX(sort_order), 0) + 10 AS next FROM stock_products WHERE category = $1`,
      [input.category],
    );
    const result = await client.query<ProductRow>(
      `INSERT INTO stock_products (id, name, category, unit_price, quantity, low_alert, sort_order, is_rental)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${PRODUCT_COLS}`,
      [
        id,
        input.name,
        input.category,
        input.unitPrice,
        input.quantity,
        input.lowAlert,
        order.rows[0]?.next ?? 10,
        Boolean(input.isRental),
      ],
    );
    if (input.quantity && input.quantity > 0) {
      await client.query(
        `INSERT INTO stock_movements (id, product_id, product_name, kind, units, business_date, note)
         VALUES ($1, $2, $3, 'restock', $4, $5, 'Carga inicial')`,
        [randomUUID(), id, input.name, input.quantity, businessDate],
      );
    }
    return mapProduct(result.rows[0]!);
  });
}

export type ProductUpdate = Partial<ProductInput> & { active?: boolean };

/** Edita datos del producto. Si cambia la cantidad, queda registrado como ajuste. */
export async function updateProduct(id: string, update: ProductUpdate): Promise<StockProduct | null> {
  await ensureSeed();
  return transaction(async (client) => {
    const current = await client.query<ProductRow>(
      `SELECT ${PRODUCT_COLS}
         FROM stock_products WHERE id = $1 FOR UPDATE`,
      [id],
    );
    const row = current.rows[0];
    if (!row) return null;

    const next = {
      name: update.name ?? row.name,
      category: update.category ?? row.category,
      unitPrice: update.unitPrice ?? Number(row.unit_price),
      quantity: update.quantity !== undefined ? update.quantity : row.quantity,
      lowAlert: update.lowAlert ?? Number(row.low_alert),
      active: update.active ?? row.active,
      isRental: update.isRental ?? row.is_rental,
    };

    const result = await client.query<ProductRow>(
      `UPDATE stock_products
          SET name = $2, category = $3, unit_price = $4, quantity = $5, low_alert = $6, active = $7,
              is_rental = $8, updated_at = now()
        WHERE id = $1
        RETURNING ${PRODUCT_COLS}`,
      [id, next.name, next.category, next.unitPrice, next.quantity, next.lowAlert, next.active, next.isRental],
    );

    const before = row.quantity === null ? null : Number(row.quantity);
    if (update.quantity !== undefined && next.quantity !== null && next.quantity !== before) {
      await client.query(
        `INSERT INTO stock_movements (id, product_id, product_name, kind, units, business_date, note)
         VALUES ($1, $2, $3, 'adjust', $4, $5, $6)`,
        [
          randomUUID(),
          id,
          next.name,
          next.quantity - (before ?? 0),
          currentBusinessDate(),
          `Ajuste manual: ${before ?? 'sin control'} → ${next.quantity}`,
        ],
      );
    }
    return mapProduct(result.rows[0]!);
  });
}

/** Suma unidades (reposición). */
export async function restockProduct(id: string, units: number, note?: string): Promise<StockProduct | null> {
  await ensureSeed();
  return transaction(async (client) => {
    const result = await client.query<ProductRow>(
      `UPDATE stock_products
          SET quantity = COALESCE(quantity, 0) + $2, updated_at = now()
        WHERE id = $1
        RETURNING ${PRODUCT_COLS}`,
      [id, units],
    );
    const row = result.rows[0];
    if (!row) return null;
    await client.query(
      `INSERT INTO stock_movements (id, product_id, product_name, kind, units, business_date, note)
       VALUES ($1, $2, $3, 'restock', $4, $5, $6)`,
      [randomUUID(), id, row.name, units, currentBusinessDate(), note || null],
    );
    return mapProduct(row);
  });
}

/* ------------------------------------------------------------------ */
/* Ventas                                                              */
/* ------------------------------------------------------------------ */

export class StockError extends Error {}

export async function registerSale(input: {
  productId: string;
  units: number;
  staffName: string;
}): Promise<{ movement: StockMovement; product: StockProduct }> {
  await ensureSeed();
  const shiftId = currentShiftId();
  const businessDate = currentBusinessDate();

  return transaction(async (client) => {
    const current = await client.query<ProductRow>(
      `SELECT ${PRODUCT_COLS}
         FROM stock_products WHERE id = $1 FOR UPDATE`,
      [input.productId],
    );
    const row = current.rows[0];
    if (!row || !row.active) throw new StockError('Ese producto ya no está disponible.');
    if (Number(row.unit_price) <= 0) {
      throw new StockError('Este producto todavía no tiene precio. Avisale al administrador.');
    }
    if (row.quantity !== null && Number(row.quantity) < input.units) {
      throw new StockError(
        Number(row.quantity) === 0
          ? `No queda stock de ${row.name}.`
          : `Solo quedan ${row.quantity} de ${row.name}.`,
      );
    }

    const updated = await client.query<ProductRow>(
      `UPDATE stock_products
          SET quantity = CASE WHEN quantity IS NULL THEN NULL ELSE quantity - $2 END, updated_at = now()
        WHERE id = $1
        RETURNING ${PRODUCT_COLS}`,
      [input.productId, input.units],
    );

    const unitPrice = Number(row.unit_price);
    const movement = await client.query<MovementRow>(
      `INSERT INTO stock_movements
         (id, product_id, product_name, kind, units, unit_price, total, shift_id, business_date, staff_name)
       VALUES ($1, $2, $3, 'sale', $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        randomUUID(),
        input.productId,
        row.name,
        input.units,
        unitPrice,
        unitPrice * input.units,
        shiftId,
        businessDate,
        input.staffName,
      ],
    );

    return { movement: mapMovement(movement.rows[0]!), product: mapProduct(updated.rows[0]!) };
  });
}

/** Devolución de algo alquilado (bata): vuelve al stock, la venta (el cobro) queda. */
export async function returnRental(input: {
  productId: string;
  units: number;
  staffName: string;
}): Promise<StockProduct> {
  await ensureSeed();
  return transaction(async (client) => {
    const updated = await client.query<ProductRow>(
      `UPDATE stock_products
          SET quantity = COALESCE(quantity, 0) + $2, updated_at = now()
        WHERE id = $1 AND is_rental = true
        RETURNING ${PRODUCT_COLS}`,
      [input.productId, input.units],
    );
    const row = updated.rows[0];
    if (!row) throw new StockError('Ese producto no es de alquiler.');
    await client.query(
      `INSERT INTO stock_movements (id, product_id, product_name, kind, units, shift_id, business_date, staff_name, note)
       VALUES ($1, $2, $3, 'return', $4, $5, $6, $7, 'Devolución')`,
      [randomUUID(), row.id, row.name, input.units, currentShiftId(), currentBusinessDate(), input.staffName],
    );
    return mapProduct(row);
  });
}

/** Anula una venta y devuelve las unidades al stock. */
export async function voidSale(
  movementId: string,
  options: { maxAgeMinutes?: number } = {},
): Promise<boolean> {
  await ensureSeed();
  return transaction(async (client) => {
    const found = await client.query<MovementRow>(
      `SELECT * FROM stock_movements WHERE id = $1 AND kind = 'sale' AND voided_at IS NULL FOR UPDATE`,
      [movementId],
    );
    const row = found.rows[0];
    if (!row) return false;
    if (options.maxAgeMinutes !== undefined) {
      const ageMs = Date.now() - new Date(row.created_at).getTime();
      if (ageMs > options.maxAgeMinutes * 60 * 1000) {
        throw new StockError(
          `Pasaron más de ${options.maxAgeMinutes} minutos: pedile al administrador que la anule.`,
        );
      }
    }
    await client.query(`UPDATE stock_movements SET voided_at = now() WHERE id = $1`, [movementId]);
    await client.query(
      `UPDATE stock_products
          SET quantity = CASE WHEN quantity IS NULL THEN NULL ELSE quantity + $2 END, updated_at = now()
        WHERE id = $1`,
      [row.product_id, Number(row.units)],
    );
    return true;
  });
}

export async function listMovements(filter: {
  businessDate: string;
  shiftId?: string;
  kind?: StockMovement['kind'];
}): Promise<StockMovement[]> {
  await ensureSeed();
  const values: unknown[] = [filter.businessDate];
  let where = 'business_date = $1';
  if (filter.shiftId) {
    values.push(filter.shiftId);
    where += ` AND shift_id = $${values.length}`;
  }
  if (filter.kind) {
    values.push(filter.kind);
    where += ` AND kind = $${values.length}`;
  }
  const rows = await query<MovementRow>(
    `SELECT * FROM stock_movements WHERE ${where} ORDER BY created_at DESC LIMIT 1000`,
    values,
  );
  return rows.map(mapMovement);
}

/* ------------------------------------------------------------------ */
/* Ajustes (clave del personal)                                        */
/* ------------------------------------------------------------------ */

export async function getSetting(key: string): Promise<string | null> {
  const rows = await query<{ value: string }>(`SELECT value FROM stock_settings WHERE key = $1`, [key]);
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query(
    `INSERT INTO stock_settings (key, value) VALUES ($1, $2)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [key, value],
  );
}
