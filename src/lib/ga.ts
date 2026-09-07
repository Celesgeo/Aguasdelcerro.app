/** ID de Google Analytics 4. Se lee en runtime para que Railway no dependa del build. */
export function getGaMeasurementId(): string {
  const env = process.env as Record<string, string | undefined>;
  const value = String(env['GA_MEASUREMENT_ID'] || env['NEXT_PUBLIC_GA_MEASUREMENT_ID'] || '').trim();
  return /^G-[A-Z0-9]+$/i.test(value) ? value : '';
}
