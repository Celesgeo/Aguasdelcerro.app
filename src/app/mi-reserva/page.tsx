import type { Metadata } from 'next';
import SectionHeading from '@/components/shared/SectionHeading';
import ManageReservation from '@/components/reservas/ManageReservation';

export const metadata: Metadata = {
  title: 'Mi reserva',
  robots: { index: false, follow: false },
};

export default async function MiReservaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.code === 'string' ? params.code : '';

  return (
    <div className="pt-28 pb-28 bg-brand-cream min-h-screen">
      <div className="mx-auto max-w-2xl px-6 lg:px-10">
        <SectionHeading
          i18n={{
            eyebrow: 'pages.myReservation.kicker',
            title: 'pages.myReservation.title',
            description: 'pages.myReservation.description',
          }}
        />
        <ManageReservation initialCode={code} />
      </div>
    </div>
  );
}
