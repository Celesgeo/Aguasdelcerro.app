import type { Reservation } from '@/lib/reservations';

/** Lo que ve el personal de cada membresía (sin email ni teléfono). */
export type ShiftMembership = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  total: number;
  origin: 'online' | 'presencial';
  paymentMethod: string | null;
  soldBy: string | null;
  createdAt: string;
};

export function toShiftMembership(r: Reservation): ShiftMembership {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    quantity: r.quantity,
    total: r.total,
    origin: r.saleOrigin === 'presencial' ? 'presencial' : 'online',
    paymentMethod: r.saleOrigin === 'presencial' ? r.paymentMethod : 'mercadopago',
    soldBy: r.soldBy,
    createdAt: r.paidAt ?? r.createdAt,
  };
}
