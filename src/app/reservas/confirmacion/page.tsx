import type { Metadata } from 'next';
import ReservationStatus from '@/components/reservas/ReservationStatus';

export const metadata: Metadata = {
  title: 'Estado de tu reserva',
  robots: { index: false, follow: false },
};

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const pick = (key: string) => {
    const value = params[key];
    return typeof value === 'string' ? value : '';
  };
  // Mercado Pago agrega payment_id (o collection_id) al volver.
  const paymentId = pick('payment_id') || pick('collection_id');

  return (
    <div className="pt-28 pb-28 bg-brand-cream min-h-screen">
      <div className="mx-auto max-w-2xl px-6 lg:px-10">
        <ReservationStatus code={pick('code')} paymentId={paymentId} />
      </div>
    </div>
  );
}
