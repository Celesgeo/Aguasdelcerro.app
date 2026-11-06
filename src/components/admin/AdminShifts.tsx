'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import type { Reservation, ShiftAvailability } from '@/lib/reservations';
import type { VisitorShiftId } from '@/lib/visitor-shifts';

const SHIFT_NAME: Record<VisitorShiftId, string> = {
  manana: 'Mañana · 8 a 12 hs',
  siesta: 'Siesta · 12 a 16 hs',
  tarde: 'Tarde · 16 a 21 hs',
  noche: 'Noche · 21 a 05 hs',
};

const ARS = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function AdminShifts() {
  const [date, setDate] = useState('');
  const [shifts, setShifts] = useState<ShiftAvailability[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
      setReservations(data.reservations);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cancel = async (reservation: Reservation) => {
    const label = `${reservation.code} · ${reservation.name}`;
    if (!window.confirm(`¿Anular la reserva ${label}? El lugar vuelve a quedar libre. Esto no devuelve el dinero en Mercado Pago.`)) {
      return;
    }
    const response = await fetch(`/api/admin/shifts/${reservation.id}`, { method: 'DELETE' });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      setError(data.error || 'No se pudo anular');
      return;
    }
    void load(date);
  };

  const paidTotal = reservations
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + r.quantity, 0);

  return (
    <AdminShell title="Turnos">
      <p className="mb-8 max-w-2xl text-sm leading-relaxed text-brand-dark/70 font-body">
        Cada turno admite 200 personas. El lugar queda guardado 30 minutos mientras la persona paga en Mercado
        Pago y se confirma solo cuando el pago se aprueba. Si el pago se rechaza o no se completa, el lugar se libera
        solo.
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

      <h2 className="mb-1 font-display text-2xl text-brand-brown">Reservas del día</h2>
      <p className="mb-4 text-sm font-body text-brand-dark/60">
        {paidTotal} {paidTotal === 1 ? 'persona confirmada' : 'personas confirmadas'}
      </p>
      {loading ? <p className="text-sm font-body text-brand-dark/50">Cargando…</p> : null}
      {!loading && reservations.length === 0 ? (
        <p className="text-sm font-body text-brand-dark/50">Todavía no hay reservas en este día.</p>
      ) : null}
      {reservations.length > 0 ? (
        <ul className="divide-y divide-brand-brown/10 border border-brand-brown/15 bg-white">
          {reservations.map((reservation) => (
            <li key={reservation.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-4">
              <div className="text-sm font-body text-brand-dark">
                <p>
                  <span className="font-semibold">{reservation.code}</span> · {reservation.name} ·{' '}
                  {reservation.quantity} {reservation.quantity === 1 ? 'persona' : 'personas'} ·{' '}
                  {ARS.format(reservation.total)}
                </p>
                <p className="mt-1 text-brand-dark/60">
                  {SHIFT_NAME[reservation.shiftId]} · {reservation.email}
                  {reservation.phone ? ` · ${reservation.phone}` : ''}
                </p>
                <p className="mt-1 text-xs tracking-[0.14em] uppercase">
                  {reservation.status === 'paid' ? (
                    <span className="text-green-800">Pagada</span>
                  ) : (
                    <span className="text-brand-dark/50">Esperando pago</span>
                  )}
                  {reservation.rescheduleCount > 0 ? (
                    <span className="ml-3 text-brand-dark/50">Cambió de turno</span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void cancel(reservation)}
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
