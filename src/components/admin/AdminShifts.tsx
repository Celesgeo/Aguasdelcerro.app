'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import type { ShiftAvailability, ShiftSale } from '@/lib/shift-inventory';
import type { VisitorShiftId } from '@/lib/visitor-shifts';

const SHIFT_NAME: Record<VisitorShiftId, string> = {
  manana: 'Mañana · 8 a 12 hs',
  siesta: 'Siesta · 12 a 16 hs',
  tarde: 'Tarde · 16 a 21 hs',
  noche: 'Noche · 21 a 05 hs',
};

export default function AdminShifts() {
  const [date, setDate] = useState('');
  const [shifts, setShifts] = useState<ShiftAvailability[]>([]);
  const [sales, setSales] = useState<ShiftSale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (nextDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = nextDate ? `?date=${encodeURIComponent(nextDate)}` : '';
      const response = await fetch(`/api/admin/shifts${query}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'No se pudo cargar');
      setDate(data.date);
      setShifts(data.shifts);
      setSales(data.sales);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const voidSale = async (id: string) => {
    const response = await fetch(`/api/admin/shifts/${id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.error || 'No se pudo anular');
      return;
    }
    void load(date);
  };

  return (
    <AdminShell title="Turnos">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-brand-dark/70 font-body">
        Cada turno arranca en cero y admite 200 membresías individuales. El cupo se descuenta al pagar.
        Si el pago no se completó en Mercado Pago, anulá ese registro para devolver el lugar.
      </p>

      <label className="mb-8 block max-w-xs">
        <span className="mb-2 block text-[11px] tracking-[0.25em] uppercase text-brand-gold font-body">Día</span>
        <input
          type="date"
          value={date}
          onChange={(event) => void load(event.target.value)}
          className="w-full border border-brand-brown/15 bg-white px-3 py-2.5 text-sm text-brand-dark font-body focus:outline-none focus:border-brand-gold"
        />
      </label>

      {error ? <p className="mb-6 text-sm text-red-700 font-body">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-10">
        {shifts.map((shift) => (
          <article key={shift.id} className="border border-brand-brown/15 bg-white p-5">
            <p className="text-sm text-brand-brown font-body">{SHIFT_NAME[shift.id]}</p>
            <p className="mt-3 font-display text-3xl text-brand-brown">
              {shift.sold}
              <span className="text-lg text-brand-dark/40"> / {shift.capacity}</span>
            </p>
            <p className="mt-2 text-xs tracking-[0.14em] uppercase font-body text-brand-dark/50">
              {shift.status === 'sold_out' ? 'Agotado' : shift.status === 'ended' ? 'Finalizado' : 'Disponible'}
            </p>
          </article>
        ))}
      </div>

      <h2 className="mb-4 font-display text-2xl text-brand-brown">Registros del día</h2>
      {loading ? <p className="text-sm font-body text-brand-dark/50">Cargando…</p> : null}
      {!loading && sales.length === 0 ? (
        <p className="text-sm font-body text-brand-dark/50">Todavía no hay membresías descontadas en este día.</p>
      ) : null}
      {sales.length > 0 ? (
        <ul className="divide-y divide-brand-brown/10 border border-brand-brown/15 bg-white">
          {sales.map((sale) => (
            <li key={sale.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <p className="text-sm font-body text-brand-dark">
                {SHIFT_NAME[sale.shiftId]} · {sale.quantity}{' '}
                {sale.quantity === 1 ? 'membresía' : 'membresías'} ·{' '}
                {new Date(sale.createdAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
              </p>
              <button
                type="button"
                onClick={() => void voidSale(sale.id)}
                className="text-xs tracking-[0.14em] uppercase text-brand-gold font-body"
              >
                Anular
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </AdminShell>
  );
}
