import type { Metadata } from 'next';
import AdminMemberDetail from '@/components/admin/AdminMemberDetail';

export const metadata: Metadata = {
  title: 'Gestionar socio',
  robots: { index: false, follow: false },
};

export default function AdminMemberPage() {
  return <AdminMemberDetail />;
}
