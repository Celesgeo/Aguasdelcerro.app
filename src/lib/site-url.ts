import { SITE } from '@/lib/constants';

/** Hosts de despliegue temporal (Railway, Vercel, local). */
const PROVISIONAL_HOST_RE = /\.(railway\.app|vercel\.app)$|^localhost$|^127\.0\.0\.1$/i;

/** URL pública canónica del sitio (sin slash final). Siempre con www. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  return `https://${SITE.publicHost}`;
}

export function getCanonicalHost(): string {
  return new URL(getSiteUrl()).hostname.toLowerCase();
}

export function normalizeHost(host: string): string {
  return host.split(':')[0].toLowerCase();
}

export function isProvisionalHost(host: string): boolean {
  return PROVISIONAL_HOST_RE.test(normalizeHost(host));
}

/** true cuando el host de la petición no coincide con el dominio canónico. */
export function isNonCanonicalHost(requestHost: string): boolean {
  return normalizeHost(requestHost) !== getCanonicalHost();
}

/**
 * Redirigir 301 desde dominio provisional hacia el canónico.
 * Solo aplica si el canónico ya es un dominio definitivo (no Railway/Vercel).
 */
export function shouldRedirectToCanonical(requestHost: string): boolean {
  const host = normalizeHost(requestHost);
  const canonicalHost = getCanonicalHost();

  if (host === canonicalHost) return false;
  if (!isProvisionalHost(host)) return false;
  return !isProvisionalHost(canonicalHost);
}

/** Redirigir apex (sin www) → www cuando el canónico usa www. */
export function shouldRedirectApexToWww(requestHost: string): boolean {
  const host = normalizeHost(requestHost);
  const canonicalHost = getCanonicalHost();

  if (host === canonicalHost) return false;
  if (!canonicalHost.startsWith('www.')) return false;

  const apexHost = canonicalHost.slice(4);
  return host === apexHost;
}

/** URL de redirección 301 hacia el host canónico (Railway o apex sin www). */
export function getCanonicalRedirectTarget(
  requestHost: string,
  pathname: string,
  search: string,
): URL | null {
  if (shouldRedirectToCanonical(requestHost) || shouldRedirectApexToWww(requestHost)) {
    return new URL(`${pathname}${search}`, getSiteUrl());
  }
  return null;
}

/** Bloquear indexación en hosts que no sean el canónico (evita duplicados en Google). */
export function shouldNoindexHost(requestHost: string): boolean {
  if (process.env.NODE_ENV !== 'production') return false;
  return isNonCanonicalHost(requestHost);
}

/** Construye URL absoluta a partir de un path relativo. */
export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === '/') return base;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
