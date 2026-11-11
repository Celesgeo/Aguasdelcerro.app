'use client';

import Link from 'next/link';
import { useState } from 'react';
import Button from '@/components/shared/Button';

const labelClass = 'mb-2 block text-[11px] tracking-[0.25em] uppercase text-brand-gold font-body';
const inputClass =
  'w-full border border-brand-brown/15 bg-white px-4 py-3.5 text-brand-dark font-body focus:outline-none focus:border-brand-gold';

const ERRORS: Record<string, string> = {
  name: 'Ingrese su nombre y apellido.',
  email: 'Revise su correo electrónico.',
  rate_limit: 'Realizó varios intentos seguidos. Aguarde unos minutos e intente nuevamente.',
  invalid: 'Revise los datos ingresados.',
  unavailable: `No pudimos registrar la solicitud en este momento. Puede escribirnos a contacto@aguasdelcerro.net y la tramitaremos igual.`,
};

export default function CancellationRequestForm({
  kind,
  initialCode,
}: {
  kind: 'arrepentimiento' | 'baja';
  initialCode: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reservationCode, setReservationCode] = useState(initialCode);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ trackingCode: string; message: string } | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/arrepentimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, name, email, phone, reservationCode, reason }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(ERRORS[data.code] ?? ERRORS.unavailable);
        return;
      }
      setResult({ trackingCode: data.trackingCode, message: data.message });
    } catch {
      setError(ERRORS.unavailable);
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    return (
      <div role="status" className="border border-brand-gold/40 bg-white px-8 py-8 font-body">
        <p className="text-[11px] tracking-[0.25em] uppercase text-brand-gold">Código de trámite</p>
        <p className="mt-2 font-mono text-3xl tracking-widest text-brand-brown">{result.trackingCode}</p>
        <p className="mt-4 text-brand-dark/80">{result.message}</p>
        <p className="mt-3 text-sm text-brand-dark/60">Le enviamos esta constancia por correo electrónico.</p>
      </div>
    );
  }

  return (
    <form
      className="space-y-5 border border-brand-gold/40 bg-white px-8 py-8"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label className="block">
        <span className={labelClass}>Código de reserva (si lo tiene)</span>
        <input
          type="text"
          value={reservationCode}
          onChange={(event) => setReservationCode(event.target.value.toUpperCase())}
          placeholder="ADC-XXXXXX"
          maxLength={12}
          className={`${inputClass} font-mono tracking-widest`}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Nombre y apellido</span>
        <input
          type="text"
          autoComplete="name"
          required
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Correo electrónico (el mismo de la compra)</span>
        <input
          type="email"
          autoComplete="email"
          required
          maxLength={120}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Teléfono (opcional)</span>
        <input
          type="tel"
          autoComplete="tel"
          maxLength={40}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block">
        <span className={labelClass}>Motivo (opcional)</span>
        <textarea
          rows={3}
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={inputClass}
        />
      </label>
      <p className="text-xs leading-relaxed font-body text-brand-dark/55">
        Los datos se usan únicamente para tramitar esta solicitud. Ver{' '}
        <Link href="/privacidad" className="underline underline-offset-2">
          Política de privacidad
        </Link>
        .
      </p>
      {error ? (
        <p role="alert" className="text-sm text-red-700 font-body">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? 'Enviando…' : kind === 'baja' ? 'Solicitar la baja' : 'Revocar la compra'}
      </Button>
    </form>
  );
}
