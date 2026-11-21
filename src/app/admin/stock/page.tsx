import type { Metadata } from 'next';
import AdminStock from '@/components/admin/AdminStock';

export const metadata: Metadata = {
  title: 'Stock',
  robots: { index: false, follow: false },
};

export default function AdminStockPage() {
  return <AdminStock />;
}
