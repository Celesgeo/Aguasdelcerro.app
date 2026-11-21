import type { Metadata } from 'next';
import StockStaff from '@/components/stock/StockStaff';

export const metadata: Metadata = {
  title: 'Stock del turno',
  robots: { index: false, follow: false },
};

export default function StockPage() {
  return <StockStaff />;
}
