'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Check, Info } from 'lucide-react';
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
  tarde: 'pages.reservations.shifts.tarde',
  noche: 'pages.reservations.shifts.noche',
  trasnoche: 'pages.reservations.shifts.trasnoche',
};

const ERROR_LABEL: Record<string, string> = {
  sold_out: 'pages.reservations.soldOut',
  ended: 'pages.reservations.ended',
  insufficient: 'pages.reservations.insufficient',
  invalid: 'pages.reservations.invalid',
  name: 'pages.reservations.nameError',
  email: 'pages.reservations.emailError',
  terms: 'pages.reservations.termsError',
  rate_limit: 'pages.reservations.rateLimit',
  unavailable: 'pages.reservations.unavailable',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const labelClass = 'mb-2 block text-[11px] tracking-[0.25em] uppercase text-brand-gold font-body';
const inputClass =
  'w-full border border-brand-brown/15 bg-white px-4 py-3.5 text-brand-dark font-body focus:outline-none focus:border-brand-gold';

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] tracking-[0.25em] uppercase text-brand-gold font-body">
        <Tx k={title} />
      </p>
      <div className="text-sm leading-relaxed font-body text-brand-dark/70">{children}</div>
    </div>
  );
}

export default function VisitorShiftBooking() {
  const t = useT();
  const [date, setDate] = useState('');
  const [bounds, setBounds] = useState({ minDate: '', maxDate: '' });
  const [shifts, setShifts] = useState<PublicShift[]>([]);
  const [selected, setSelected] = useState<VisitorShiftId | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
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
  const shiftOpen = Boolean(selectedShift && selectedShift.status === 'available');
  const canPay = shiftOpen && !paying && !loading;

  const pay = async () => {
    if (!selected || !canPay) return;
    if (name.trim().length < 2) return setErrorCode('name');
    if (!EMAIL_RE.test(email.trim())) return setErrorCode('email');
    if (!acceptTerms) return setErrorCode('terms');

    setPaying(true);
    setErrorCode(null);
    try {
      const response = await fetch('/api/reservas/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          shiftId: selected,
          quantity,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          acceptTerms,
        }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        code?: string;
        paymentUrl?: string;
        shifts?: PublicShift[];
      };
      if (!response.ok || !data.ok || !data.paymentUrl) {
        if (data.shifts) applyShifts(data.shifts, selected);
        else if (data.code === 'sold_out' || data.code === 'insufficient' || data.code === 'ended') void load(date);
        setErrorCode(data.code || 'unavailable');
        setPaying(false);
        return;
      }
      // Se paga en la misma pestaña; al terminar, Mercado Pago vuelve a /reservas/confirmacion.
      window.location.href = data.paymentUrl;
    } catch {
      setErrorCode('unavailable');
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

        <div className="mt-8 grid gap-6 border-y border-brand-brown/10 py-6 sm:grid-cols-2">
          <InfoBlock title="pages.reservations.includesTitle">
            <ul className="space-y-1.5">
              {['include1', 'include2', 'include3'].map((key) => (
                <li key={key} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" aria-hidden="true" />
                  <Tx k={`pages.reservations.${key}`} />
                </li>
              ))}
            </ul>
          </InfoBlock>
          <InfoBlock title="pages.reservations.extrasTitle">
            <ul className="space-y-1.5">
              {['extra1', 'extra2'].map((key) => (
                <li key={key} className="flex gap-2">
                  <span aria-hidden="true" className="text-brand-gold">·</span>
                  <Tx k={`pages.reservations.${key}`} />
                </li>
              ))}
            </ul>
          </InfoBlock>
          <InfoBlock title="pages.reservations.entryTitle">
            <Tx k="pages.reservations.entry" />
          </InfoBlock>
          <InfoBlock title="pages.reservations.minorsTitle">
            <Tx k="pages.reservations.minors" />
          </InfoBlock>
          <InfoBlock title="pages.reservations.bringTitle">
            <Tx k="pages.reservations.bring" />
          </InfoBlock>
          <InfoBlock title="pages.reservations.policyTitle">
            <Tx k="pages.reservations.policy" />
          </InfoBlock>
        </div>

        <p className="mt-5 flex gap-2 text-sm font-body text-brand-dark/60">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-gold" aria-hidden="true" />
          <Tx k="pages.reservations.sectorNote" />
        </p>

        <div className="mt-8 space-y-6">
          <label className="block">
            <span className={labelClass}>
              <Tx k="pages.reservations.dateLabel" />
            </span>
            <input
              type="date"
              value={date}
              min={bounds.minDate || undefined}
              max={bounds.maxDate || undefined}
              onChange={(event) => void load(event.target.value)}
              className={inputClass}
            />
          </label>

          <fieldset>
            <legend className={`${labelClass} mb-3`}>
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
                    aria-pressed={active}
                    onClick={() => {
                      setSelected(shift.id);
                      setErrorCode(null);
                    }}
                    className={`border px-4 py-4 text-left font-body transition-colors disabled:cursor-not-allowed ${
                      active ? 'border-brand-gold bg-brand-gold/10' : 'border-brand-brown/15 bg-white'
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
            <span className={labelClass}>
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
              className={inputClass}
            />
            <span className="mt-2 block text-xs font-body text-brand-dark/50">
              <Tx k="pages.reservations.quantityHint" />
            </span>
          </label>

          <fieldset className="space-y-4 border-t border-brand-brown/10 pt-6">
            <legend className="mb-1 font-display text-2xl text-brand-brown">
              <Tx k="pages.reservations.contactTitle" />
            </legend>
            <label className="block">
              <span className={labelClass}>
                <Tx k="pages.reservations.nameLabel" />
              </span>
              <input
                type="text"
                autoComplete="name"
                maxLength={80}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className={labelClass}>
                <Tx k="pages.reservations.emailLabel" />
              </span>
              <input
                type="email"
                autoComplete="email"
                inputMode="email"
                maxLength={120}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClass}
              />
              <span className="mt-2 block text-xs font-body text-brand-dark/50">
                <Tx k="pages.reservations.emailHint" />
              </span>
            </label>
            <label className="block">
              <span className={labelClass}>
                <Tx k="pages.reservations.phoneLabel" />
              </span>
              <input
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                maxLength={40}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="flex items-start gap-3 text-sm font-body text-brand-dark/70">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(event) => {
                  setAcceptTerms(event.target.checked);
                  if (event.target.checked && errorCode === 'terms') setErrorCode(null);
                }}
                className="mt-1 h-4 w-4 shrink-0 accent-brand-gold"
              />
              <span>
                <Tx k="pages.reservations.termsLabel" />
              </span>
            </label>
          </fieldset>

          {loading ? null : shiftOpen ? (
            <div className="space-y-4 border-t border-brand-brown/10 pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <span className={labelClass}>
                  <Tx k="pages.reservations.totalLabel" />
                </span>
                <p className="font-display text-3xl text-brand-brown">
                  {quantity} × {formatARS(TICKET_PRICE_ARS)} = {formatARS(TICKET_PRICE_ARS * quantity)}
                </p>
              </div>
              <Button type="button" onClick={() => void pay()} disabled={!canPay} className="w-full">
                {paying ? <Tx k="pages.reservations.paying" /> : <Tx k="pages.reservations.payCta" />}
              </Button>
              <p className="text-xs font-body text-brand-dark/50">
                <Tx k="pages.reservations.payNote" />
              </p>
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

          {errorCode ? (
            <p role="alert" className="text-sm text-red-700 font-body">
              {t(ERROR_LABEL[errorCode] ?? ERROR_LABEL.unavailable)}
            </p>
          ) : null}

          <div className="border-t border-brand-brown/10 pt-6">
            <p className="mb-3 font-display text-2xl text-brand-brown">
              <Tx k="pages.reservations.stepsTitle" />
            </p>
            <ol className="space-y-2 text-sm leading-relaxed font-body text-brand-dark/70">
              {['step1', 'step2', 'step3'].map((key, index) => (
                <li key={key} className="flex gap-3">
                  <span className="font-display text-lg leading-none text-brand-gold">{index + 1}</span>
                  <Tx k={`pages.reservations.${key}`} />
                </li>
              ))}
            </ol>
          </div>

          <p className="text-sm font-body">
            <Link href="/mi-reserva" className="text-brand-brown underline underline-offset-4 hover:text-brand-gold">
              <Tx k="pages.reservations.manageLink" />
            </Link>
          </p>
        </div>
      </article>
    </ScrollReveal>
  );
}
