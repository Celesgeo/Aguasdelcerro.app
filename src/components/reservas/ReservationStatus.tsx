'use client';

import { useEffect, useRef, useState } from 'react';
import Tx from '@/components/i18n/Tx';
import Button from '@/components/shared/Button';
import { useT } from '@/components/i18n/LanguageProvider';
import { formatARS } from '@/lib/memberships';
import type { VisitorShiftId } from '@/lib/visitor-shifts';

type Status = 'loading' | 'paid' | 'pending' | 'cancelled' | 'expired' | 'not_found';

interface PublicReservation {
  code: string;
  status: 'paid' | 'pending' | 'cancelled' | 'expired';
  date: string;
  shiftId: VisitorShiftId;
  quantity: number;
  total: number;
  email: string;
}

const MAX_POLLS = 20;

function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

export default function ReservationStatus({ code, paymentId }: { code: string; paymentId: string }) {
  const t = useT();
  const [status, setStatus] = useState<Status>('loading');
  const [reservation, setReservation] = useState<PublicReservation | null>(null);
  const polls = useRef(0);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      try {
        const params = new URLSearchParams({ code });
        if (paymentId) params.set('payment_id', paymentId);
        const response = await fetch(`/api/reservas/estado?${params.toString()}`, { cache: 'no-store' });
        const data = (await response.json()) as { ok: boolean; reservation?: PublicReservation };
        if (cancelled) return;
        if (!response.ok || !data.ok || !data.reservation) {
          setStatus('not_found');
          return;
        }
        setReservation(data.reservation);
        setStatus(data.reservation.status);
        // Si todavía está pendiente, vuelve a consultar cada 6 segundos (hasta 2 minutos).
        if (data.reservation.status === 'pending' && polls.current < MAX_POLLS) {
          polls.current += 1;
          timer = setTimeout(check, 6_000);
        }
      } catch {
        if (!cancelled) setStatus('not_found');
      }
    };

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [code, paymentId]);

  const titleKey: Record<Exclude<Status, 'loading'>, string> = {
    paid: 'pages.confirmation.paidTitle',
    pending: 'pages.confirmation.pendingTitle',
    cancelled: 'pages.confirmation.rejectedTitle',
    expired: 'pages.confirmation.expiredTitle',
    not_found: 'pages.confirmation.notFoundTitle',
  };
  const textKey: Record<Exclude<Status, 'loading'>, string> = {
    paid: 'pages.confirmation.paidText',
    pending: 'pages.confirmation.pendingText',
    cancelled: 'pages.confirmation.rejectedText',
    expired: 'pages.confirmation.expiredText',
    not_found: 'pages.confirmation.notFoundText',
  };

  return (
    <article className="border border-brand-gold/40 bg-white px-8 py-10 md:px-12" aria-live="polite">
      <p className="mb-3 text-[11px] tracking-[0.3em] uppercase text-brand-gold font-body">
        <Tx k="pages.confirmation.kicker" />
      </p>

      {status === 'loading' ? (
        <p className="font-display text-3xl text-brand-brown">
          <Tx k="pages.confirmation.loading" />
        </p>
      ) : (
        <>
          <h1 className="font-display text-4xl text-brand-brown">{t(titleKey[status])}</h1>
          <p className="mt-4 text-base leading-relaxed font-body text-brand-dark/70">
            {t(textKey[status]).replace('{email}', reservation?.email ?? '')}
          </p>
        </>
      )}

      {reservation && status !== 'loading' && status !== 'not_found' ? (
        <dl className="mt-8 grid gap-4 border-y border-brand-brown/10 py-6 sm:grid-cols-2 font-body">
          <div>
            <dt className="text-[11px] tracking-[0.25em] uppercase text-brand-gold">
              <Tx k="pages.confirmation.codeLabel" />
            </dt>
            <dd className="mt-1 font-mono text-2xl tracking-widest text-brand-brown">{reservation.code}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.25em] uppercase text-brand-gold">
              <Tx k="pages.reservations.dateLabel" />
            </dt>
            <dd className="mt-1 text-brand-dark">
              {formatDate(reservation.date)} · {t(`pages.reservations.shifts.${reservation.shiftId}`)}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.25em] uppercase text-brand-gold">
              <Tx k="pages.reservations.quantityLabel" />
            </dt>
            <dd className="mt-1 text-brand-dark">{reservation.quantity}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.25em] uppercase text-brand-gold">
              <Tx k="pages.reservations.totalLabel" />
            </dt>
            <dd className="mt-1 text-brand-dark">{formatARS(reservation.total)}</dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-4">
        {status === 'paid' ? (
          <Button href={`/mi-reserva?code=${encodeURIComponent(reservation?.code ?? code)}`}>
            <Tx k="pages.confirmation.manage" />
          </Button>
        ) : null}
        {status === 'cancelled' || status === 'expired' || status === 'not_found' ? (
          <Button href="/reservas">
            <Tx k="pages.confirmation.retry" />
          </Button>
        ) : null}
      </div>
    </article>
  );
}
