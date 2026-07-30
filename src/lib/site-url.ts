/** URL pública canónica del sitio (sin slash final). */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  // Fallback local / Railway hasta configurar el .com.ar
  return 'https://aguasdelcerroapp-production.up.railway.app';
}
