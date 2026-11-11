import type { Metadata } from 'next';
import Link from 'next/link';
import LegalPage from '@/components/legal/LegalPage';
import CancellationRequestForm from '@/components/legal/CancellationRequestForm';
import { REFUND_POLICY_MIN_HOURS, WITHDRAWAL_DAYS, WITHDRAWAL_MIN_HOURS } from '@/lib/reservations';

export const metadata: Metadata = {
  title: 'Botón de arrepentimiento',
  description: 'Revocá tu compra o solicitá la baja de tu reserva en Aguas del Cerro, sin registro previo.',
  alternates: { canonical: '/arrepentimiento' },
};

export default async function ArrepentimientoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const kind = params.tipo === 'baja' ? 'baja' : 'arrepentimiento';
  const code = typeof params.code === 'string' ? params.code : '';

  return (
    <LegalPage
      eyebrow={kind === 'baja' ? 'Botón de baja de servicio' : 'Botón de arrepentimiento'}
      title={kind === 'baja' ? 'Solicitar la baja de una reserva' : 'Revocar una compra'}
    >
      <p>
        Puede revocar su compra dentro de los {WITHDRAWAL_DAYS} días corridos desde que recibió la confirmación, con al
        menos {WITHDRAWAL_MIN_HOURS} horas de anticipación al turno y sin haber utilizado el servicio. También puede
        cancelar con devolución total hasta {REFUND_POLICY_MIN_HOURS} horas antes del turno. No necesita registrarse:
        complete el formulario y recibirá en el momento un código de trámite, también por correo.
      </p>
      <p>
        Si prefiere conservar la visita en otra fecha, puede cambiarla sin costo desde{' '}
        <Link href="/mi-reserva">Mi reserva</Link>.
      </p>
      <CancellationRequestForm kind={kind} initialCode={code} />
      <p className="text-sm text-brand-dark/60">
        Condiciones completas en{' '}
        <Link href="/contratos-de-adhesion">Contratos de adhesión - Ley N° 24.240 de Defensa del Consumidor</Link>.
      </p>
    </LegalPage>
  );
}
