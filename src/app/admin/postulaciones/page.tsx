import type { Metadata } from 'next';
import AdminCareersInbox from '@/components/admin/AdminCareersInbox';

export const metadata: Metadata = {
  title: 'Postulaciones',
  robots: { index: false, follow: false },
};

export default function AdminCareersPage() {
  return <AdminCareersInbox />;
}
