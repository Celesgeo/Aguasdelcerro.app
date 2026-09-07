import { connection } from 'next/server';
import GoogleAnalytics from '@/components/seo/GoogleAnalytics';
import { getGaMeasurementId } from '@/lib/ga';

export default async function GoogleAnalyticsLoader() {
  await connection();
  const measurementId = getGaMeasurementId();
  if (!measurementId) return null;
  return <GoogleAnalytics measurementId={measurementId} />;
}
