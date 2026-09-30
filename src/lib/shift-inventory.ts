import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  VISITOR_SHIFT_CAPACITY,
  VISITOR_SHIFT_MAX_PER_PURCHASE,
  VISITOR_SHIFTS,
  isDateInBookingWindow,
  isVisitorShiftId,
  shiftStatus,
  type VisitorShiftId,
  type VisitorShiftStatus,
} from '@/lib/visitor-shifts';

export interface ShiftSale {
  id: string;
  /** YYYY-MM-DD del día en que empieza el turno */
  date: string;
  shiftId: VisitorShiftId;
  quantity: number;
  createdAt: string;
}

interface ShiftStoreFile {
  sales: ShiftSale[];
}

export interface ShiftAvailability {
  id: VisitorShiftId;
  sold: number;
  capacity: number;
  remaining: number;
  status: VisitorShiftStatus;
}

const STORE_PATH = path.join(process.cwd(), 'data', 'shift-inventory.json');

let writeQueue: Promise<unknown> = Promise.resolve();

function withLock<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readStore(): Promise<ShiftStoreFile> {
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as ShiftStoreFile;
    if (!parsed || !Array.isArray(parsed.sales)) return { sales: [] };
    return parsed;
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT') return { sales: [] };
    throw error;
  }
}

async function writeStore(store: ShiftStoreFile): Promise<void> {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  const tempPath = `${STORE_PATH}.${process.pid}.tmp`;
  await fs.writeFile(tempPath, JSON.stringify(store, null, 2), 'utf8');
  await fs.rename(tempPath, STORE_PATH);
}

export function soldForShift(sales: ShiftSale[], date: string, shiftId: VisitorShiftId): number {
  return sales.reduce((total, sale) => {
    if (sale.date === date && sale.shiftId === shiftId) return total + sale.quantity;
    return total;
  }, 0);
}

export function availabilityForDate(sales: ShiftSale[], date: string, now = new Date()): ShiftAvailability[] {
  return VISITOR_SHIFTS.map((shift) => {
    const sold = soldForShift(sales, date, shift.id);
    const status = shiftStatus({ date, shiftId: shift.id, sold, now });
    return {
      id: shift.id,
      sold,
      capacity: VISITOR_SHIFT_CAPACITY,
      remaining: Math.max(0, VISITOR_SHIFT_CAPACITY - sold),
      status,
    };
  });
}

export async function listShiftSales(date?: string): Promise<ShiftSale[]> {
  const store = await readStore();
  const sales = date ? store.sales.filter((sale) => sale.date === date) : store.sales;
  return [...sales].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getShiftAvailability(date: string, now = new Date()): Promise<ShiftAvailability[]> {
  const store = await readStore();
  return availabilityForDate(store.sales, date, now);
}

export class ShiftReserveError extends Error {
  code: 'invalid' | 'ended' | 'sold_out' | 'insufficient';

  constructor(code: ShiftReserveError['code']) {
    super(code);
    this.code = code;
  }
}

export async function reserveShift(input: {
  date: string;
  shiftId: string;
  quantity: number;
  now?: Date;
}): Promise<{ sale: ShiftSale; availability: ShiftAvailability }> {
  return withLock(async () => {
    const now = input.now ?? new Date();
    const quantity = Math.floor(input.quantity);
    if (
      !isDateInBookingWindow(input.date, now) ||
      !isVisitorShiftId(input.shiftId) ||
      !Number.isFinite(quantity) ||
      quantity < 1 ||
      quantity > VISITOR_SHIFT_MAX_PER_PURCHASE
    ) {
      throw new ShiftReserveError('invalid');
    }

    const store = await readStore();
    const snapshot = availabilityForDate(store.sales, input.date, now).find((shift) => shift.id === input.shiftId);
    if (!snapshot || snapshot.status === 'ended') throw new ShiftReserveError('ended');
    if (snapshot.status === 'sold_out') throw new ShiftReserveError('sold_out');
    if (snapshot.remaining < quantity) throw new ShiftReserveError('insufficient');

    const sale: ShiftSale = {
      id: randomUUID(),
      date: input.date,
      shiftId: input.shiftId,
      quantity,
      createdAt: now.toISOString(),
    };
    store.sales.push(sale);
    await writeStore(store);

    const availability = availabilityForDate(store.sales, input.date, now).find((shift) => shift.id === input.shiftId);
    if (!availability) throw new ShiftReserveError('invalid');
    return { sale, availability };
  });
}

export async function voidShiftSale(id: string): Promise<void> {
  await withLock(async () => {
    const store = await readStore();
    const next = store.sales.filter((sale) => sale.id !== id);
    if (next.length === store.sales.length) throw new Error('Registro no encontrado');
    store.sales = next;
    await writeStore(store);
  });
}
