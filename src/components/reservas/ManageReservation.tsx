'use client';

import { useState } from 'react';
import Tx from '@/components/i18n/Tx';
import Button from '@/components/shared/Button';
import { useLanguage, useT } from '@/components/i18n/LanguageProvider';
import { VISITOR_SHIFTS, type VisitorShiftId, type VisitorShiftStatus } from '@/lib/visitor-shifts';

interface MyReservation {
  code: string;
  name: string;
  status: string;
  date: string;
  shiftId: VisitorShiftId;
  quantity: number;
  total: number;
  canReschedule: boolean;
  rescheduleDeadline: string;
}

const ERROR_KEY: Record<string, string> = {
  not_found: 'pages.myReservation.notFound',
  not_paid: 'pages.myReservation.notFound',
  too_late: 'pages.myReservation.tooLate',
  insufficient: 'pages.myReservation.insufficient',
  sold_out: 'pages.myReservation.insufficient',
  same_slot: 'pages.myReservation.sameSlot',
  ended: 'pages.myReservation.ended',
  invalid: 'pages.myReservation.invalid',
  rate_limit: 'pages.myReservation.rateLimit',
  unavailable: 'pages.myReservation.unavailable',
};

const labelClass = 'mb-2 block text-[11px] tracking-[0.25em] uppercase text-brand-gold font-body';
const inputClass =
  'w-full border border-brand-brown/15 bg-white px-4 py-3.5 text-brand-dark font-body focus:outline-none focus:border-brand-gold';

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export default function ManageReservation({ initialCode }: { initialCode: string }) {
  const t = useT();
  const { locale } = useLanguage();
  const [code, setCode] = useState(initialCode);
  const [email, setEmail] = useState('');
  const [reservation, setReservation] = useState<MyReservation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [newDate, setNewDate] = useState('');
  const [bounds, setBounds] = useState({ minDate: '', maxDate: '' });
  const [shifts, setShifts] = useState<Array<{ id: VisitorShiftId; status: VisitorShiftStatus }>>([]);
  const [newShift, setNewShift] = useState<VisitorShiftId | null>(null);

  const call = async (body: Record<string, unknown>) => {
    const response = await fetch('/api/reservas/mi-reserva', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim(), email: email.trim(), ...body }),
    });
    const data = (await response.json()) as { ok: boolean; code?: string; reservation?: MyReservation };
    if (!response.ok || !data.ok || !data.reservation) throw new Error(data.code || 'unavailable');
    return data.reservation;
  };

  const loadShifts = async (date?: string) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const response = await fetch(`/api/reservas/turnos${query}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok || !data.ok) return;
    setNewDate(data.date);
    setBounds({ minDate: data.minDate, maxDate: data.maxDate });
    setShifts(data.shifts);
    setNewShift(null);
  };

  const lookup = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const found = await call({ action: 'lookup' });
      setReservation(found);
      if (found.canReschedule) await loadShifts();
    } catch (cause) {
      setReservation(null);
      setError(cause instanceof Error ? cause.message : 'unavailable');
    } finally {
      setBusy(false);
    }
  };

  const reschedule = async () => {
    if (!newShift || !newDate) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await call({ action: 'reschedule', date: newDate, shiftId: newShift });
      setReservation(updated);
      setNotice('pages.myReservation.changed');
      if (updated.canReschedule) await loadShifts(newDate);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'unavailable');
    } finally {
      setBusy(false);
    }
  };

  const deadlineText = reservation
    ? new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(new Date(reservation.rescheduleDeadline))
    : '';

  return (
    <div className="space-y-8">
      <form
        className="space-y-4 border border-brand-gold/40 bg-white px-8 py-8 md:px-12"
        onSubmit={(event) => {
          event.preventDefault();
          void lookup();
        }}
      >
        <label className="block">
          <span className={labelClass}>
            <Tx k="pages.myReservation.codeLabel" />
          </span>
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="ADC-XXXXXX"
            autoCapitalize="characters"
            maxLength={12}
            required
            className={`${inputClass} font-mono tracking-widest`}
          />
        </label>
        <label className="block">
          <span className={labelClass}>
            <Tx k="pages.myReservation.emailLabel" />
          </span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            maxLength={120}
            required
            className={inputClass}
          />
        </label>
        <Button type="submit" disabled={busy} className="w-full">
          {busy && !reservation ? <Tx k="pages.myReservation.searching" /> : <Tx k="pages.myReservation.lookupCta" />}
        </Button>
      </form>

      {error ? (
        <p role="alert" className="text-sm text-red-700 font-body">
          {t(ERROR_KEY[error] ?? ERROR_KEY.unavailable)}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-green-800 font-body">
          {t(notice)}
        </p>
      ) : null}

      {reservation ? (
        <article className="border border-brand-brown/15 bg-white px-8 py-8 md:px-12 font-body">
          <p className="font-mono text-2xl tracking-widest text-brand-brown">{reservation.code}</p>
          <p className="mt-1 text-brand-dark/70">{reservation.name}</p>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className={labelClass}>
                <Tx k="pages.myReservation.dayLabel" />
              </dt>
              <dd className="text-brand-dark">{formatDate(reservation.date)}</dd>
            </div>
            <div>
              <dt className={labelClass}>
                <Tx k="pages.myReservation.shiftLabel" />
              </dt>
              <dd className="text-brand-dark">{t(`pages.reservations.shifts.${reservation.shiftId}`)}</dd>
            </div>
            <div>
              <dt className={labelClass}>
                <Tx k="pages.myReservation.peopleLabel" />
              </dt>
              <dd className="text-brand-dark">{reservation.quantity}</dd>
            </div>
          </dl>

          <p className="mt-6 text-sm text-brand-dark/70">
            {reservation.canReschedule
              ? t('pages.myReservation.deadline').replace('{deadline}', deadlineText)
              : t('pages.myReservation.tooLateInfo')}
          </p>

          <p className="mt-3 text-sm">
            <a
              href={`/arrepentimiento?code=${encodeURIComponent(reservation.code)}`}
              className="text-brand-brown underline underline-offset-4 hover:text-brand-gold"
            >
              {locale === 'en' ? 'Request a refund or cancel this reservation' : 'Solicitar la devolución o la baja de esta reserva'}
            </a>
          </p>

          {reservation.canReschedule ? (
            <div className="mt-8 space-y-5 border-t border-brand-brown/10 pt-6">
              <p className="font-display text-2xl text-brand-brown">
                <Tx k="pages.myReservation.changeTitle" />
              </p>
              <label className="block">
                <span className={labelClass}>
                  <Tx k="pages.reservations.dateLabel" />
                </span>
                <input
                  type="date"
                  value={newDate}
                  min={bounds.minDate || undefined}
                  max={bounds.maxDate || undefined}
                  onChange={(event) => void loadShifts(event.target.value)}
                  className={inputClass}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {VISITOR_SHIFTS.map((shift) => {
                  const state = shifts.find((item) => item.id === shift.id);
                  const closed = state?.status !== 'available';
                  const active = newShift === shift.id;
                  return (
                    <button
                      key={shift.id}
                      type="button"
                      disabled={closed || busy}
                      aria-pressed={active}
                      onClick={() => setNewShift(shift.id)}
                      className={`border px-4 py-4 text-left text-sm transition-colors disabled:cursor-not-allowed ${
                        active ? 'border-brand-gold bg-brand-gold/10' : 'border-brand-brown/15 bg-white'
                      } ${closed ? 'opacity-55' : 'hover:border-brand-gold/60'}`}
                    >
                      {t(`pages.reservations.shifts.${shift.id}`)}
                    </button>
                  );
                })}
              </div>
              <Button type="button" onClick={() => void reschedule()} disabled={busy || !newShift} className="w-full">
                {busy ? <Tx k="pages.myReservation.changing" /> : <Tx k="pages.myReservation.changeCta" />}
              </Button>
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
