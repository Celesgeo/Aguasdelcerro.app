'use client';

import { useCallback, useEffect, useState } from 'react';
import Tx from '@/components/i18n/Tx';
import Button from '@/components/shared/Button';
import ScrollReveal from '@/components/shared/ScrollReveal';
import { useT } from '@/components/i18n/LanguageProvider';
import { formatARS, TICKET_PRICE_ARS } from '@/lib/memberships';
import { VISITOR_SHIFT_MAX_PER_PURCHASE, VISITOR_SHIFTS, type VisitorShiftId, type VisitorShiftStatus } from '@/lib/visitor-shifts';

interface PublicShift {
  id: VisitorShiftId;
  status: VisitorShiftStatus;
}

interface AvailabilityResponse {
  ok: boolean;
  code?: string;
  date: string;
  minDate: string;
  maxDate: string;
  shifts: PublicShift[];
}

const SHIFT_LABEL: Record<VisitorShiftId, string> = {
  manana: 'pages.reservations.shifts.manana',
  siesta: 'pages.reservations.shifts.siesta',
  tarde: 'pages.reservations.shifts.tarde',
  noche: 'pages.reservations.shifts.noche',
};

const ERROR_LABEL: Record<string, string> = {
  sold_out: 'pages.reservations.soldOut',
  ended: 'pages.reservations.ended',
  insufficient: 'pages.reservations.insufficient',
  invalid: 'pages.reservations.invalid',
  rate_limit: 'pages.reservations.rateLimit',
  unavailable: 'pages.reservations.unavailable',
};

export default function VisitorShiftBooking() {
  const t = useT();
  const [date, setDate] = useState('');
  const [bounds, setBounds] = useState({ minDate: '', maxDate: '' });
  const [shifts, setShifts] = useState<PublicShift[]>([]);
  const [selected, setSelected] = useState<VisitorShiftId | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const applyShifts = useCallback((next: PublicShift[], preferred?: VisitorShiftId | null) => {
    setShifts(next);
    setSelected((current) => {
      const candidate = preferred ?? current;
      if (candidate && next.some((shift) => shift.id === candidate && shift.status === 'available')) {
        return candidate;
      }
      return next.find((shift) => shift.status === 'available')?.id ?? null;
    });
  }, []);

  const load = useCallback(
    async (nextDate?: string) => {
      setLoading(true);
      setErrorCode(null);
      try {
        const query = nextDate ? `?date=${encodeURIComponent(nextDate)}` : '';
        const response = await fetch(`/api/reservas/turnos${query}`, { cache: 'no-store' });
        const data = (await response.json()) as AvailabilityResponse;
        if (!response.ok || !data.ok) {
          setErrorCode(data.code || 'unavailable');
          return;
        }
        setDate(data.date);
        setBounds({ minDate: data.minDate, maxDate: data.maxDate });
        applyShifts(data.shifts);
      } catch {
        setErrorCode('unavailable');
      } finally {
        setLoading(false);
      }
    },
    [applyShifts],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const selectedShift = shifts.find((shift) => shift.id === selected) ?? null;
  const canPay = Boolean(selectedShift && selectedShift.status === 'available' && !paying && !loading);

  const pay = async () => {
    if (!selected || !canPay) return;
    setPaying(true);
    setErrorCode(null);
    const popup = window.open('', '_blank');
    try {
      const response = await fetch('/api/reservas/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, shiftId: selected, quantity }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        code?: string;
        paymentUrl?: string;
        shifts?: PublicShift[];
      };
      if (!response.ok || !data.ok || !data.paymentUrl) {
        popup?.close();
        if (data.shifts) applyShifts(data.shifts, selected);
        else void load(date);
        setErrorCode(data.code || 'unavailable');
        return;
      }
      if (data.shifts) applyShifts(data.shifts, selected);
      if (popup) popup.location.href = data.paymentUrl;
      else window.location.href = data.paymentUrl;
    } catch {
      popup?.close();
      setErrorCode('unavailable');
    } finally {
      setPaying(false);
    }
  };

  return (
    <ScrollReveal className="max-w-2xl mx-auto">
      <article id="pagar" className="border border-brand-gold/40 bg-white px-8 py-10 md:px-12">
        <p className="mb-3 text-[11px] tracking-[0.3em] uppercase text-brand-gold font-body">
          <Tx k="pages.reservations.ticketEyebrow" />
        </p>
        <h2 className="font-display text-4xl text-brand-brown">
          <Tx k="pages.reservations.ticketTitle" />
        </h2>
        <p className="mt-4 font-display text-5xl text-brand-brown">{formatARS(TICKET_PRICE_ARS)}</p>
        <p className="mt-4 text-sm leading-relaxed font-body text-brand-dark/60">
          <Tx k="pages.reservations.ticketDetail" />
        </p>

        <div className="mt-8 space-y-6">
          <label className="block">
            <span className="mb-2 block text-[11px] tracking-[0.25em] uppercase text-brand-gold font-body">
              <Tx k="pages.reservations.dateLabel" />
            </span>
            <input
              type="date"
              value={date}
              min={bounds.minDate || undefined}
              max={bounds.maxDate || undefined}
              onChange={(event) => void load(event.target.value)}
              className="w-full border border-brand-brown/15 bg-white px-4 py-3.5 text-brand-dark font-body focus:outline-none focus:border-brand-gold"
            />
          </label>

          <fieldset>
            <legend className="mb-3 text-[11px] tracking-[0.25em] uppercase text-brand-gold font-body">
              <Tx k="pages.reservations.shiftLabel" />
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {VISITOR_SHIFTS.map((shift) => {
                const state = shifts.find((item) => item.id === shift.id);
                const status = state?.status;
                const closed = status !== 'available';
                const active = selected === shift.id;
                return (
                  <button
                    key={shift.id}
                    type="button"
                    disabled={loading || closed}
                    onClick={() => {
                      setSelected(shift.id);
                      setErrorCode(null);
                    }}
                    className={`border px-4 py-4 text-left font-body transition-colors disabled:cursor-not-allowed ${
                      active
                        ? 'border-brand-gold bg-brand-gold/10'
                        : 'border-brand-brown/15 bg-white'
                    } ${closed ? 'opacity-55' : 'hover:border-brand-gold/60'}`}
                  >
                    <span className="block text-sm text-brand-brown">{t(SHIFT_LABEL[shift.id])}</span>
                    {status === 'sold_out' ? (
                      <span className="mt-1 block text-xs tracking-[0.14em] uppercase text-red-700">
                        <Tx k="pages.reservations.soldOut" />
                      </span>
                    ) : null}
                    {status === 'ended' ? (
                      <span className="mt-1 block text-xs tracking-[0.14em] uppercase text-brand-dark/45">
                        <Tx k="pages.reservations.ended" />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-2 block text-[11px] tracking-[0.25em] uppercase text-brand-gold font-body">
              <Tx k="pages.reservations.quantityLabel" />
            </span>
            <input
              type="number"
              min={1}
              max={VISITOR_SHIFT_MAX_PER_PURCHASE}
              value={quantity}
              onChange={(event) => {
                const next = Math.floor(Number(event.target.value));
                if (!Number.isFinite(next)) return;
                setQuantity(Math.min(VISITOR_SHIFT_MAX_PER_PURCHASE, Math.max(1, next)));
              }}
              className="w-full border border-brand-brown/15 bg-white px-4 py-3.5 text-brand-dark font-body focus:outline-none focus:border-brand-gold"
            />
          </label>

          {loading ? null : canPay ? (
            <div className="space-y-3">
              <p className="font-display text-2xl text-brand-brown">
                {formatARS(TICKET_PRICE_ARS * quantity)}
              </p>
              <Button type="button" onClick={() => void pay()} disabled={paying} className="w-full md:w-auto">
                {paying ? <Tx k="pages.reservations.paying" /> : <Tx k="pages.reservations.payCta" />}
              </Button>
            </div>
          ) : (
            <p className="text-sm tracking-[0.14em] uppercase text-brand-brown font-body">
              {shifts.some((shift) => shift.status === 'sold_out') ? (
                <Tx k="pages.reservations.soldOut" />
              ) : (
                <Tx k="pages.reservations.noShift" />
              )}
            </p>
          )}

          {errorCode && errorCode !== 'sold_out' ? (
            <p className="text-sm text-red-700 font-body">{t(ERROR_LABEL[errorCode] ?? ERROR_LABEL.unavailable)}</p>
          ) : null}

          <p className="text-sm font-body text-brand-dark/50">
            <Tx k="pages.reservations.payNote" />
          </p>
        </div>
      </article>
    </ScrollReveal>
  );
}
