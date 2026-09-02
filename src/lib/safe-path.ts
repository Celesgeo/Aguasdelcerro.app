/** Evita open redirects: solo rutas internas relativas. */
export function sanitizeInternalPath(value: string | null | undefined, fallback = '/admin'): string {
  if (!value) return fallback;
  const path = value.trim();
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return fallback;
  }
  if (path.startsWith('/admin/login')) return '/admin';
  return path;
}
