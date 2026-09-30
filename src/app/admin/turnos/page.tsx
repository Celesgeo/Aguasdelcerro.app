import type { Metadata } from 'next';
import AdminShifts from '@/components/admin/AdminShifts';

export const metadata: Metadata = {
  title: 'Turnos',
  robots: { index: false, follow: false },
};

export default function AdminShiftsPage() {
  return <AdminShifts />;
}
