/** IP del cliente — compatible con Edge y Node (sin dependencias de Node). */
export function clientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    return hops[hops.length - 1] ?? 'unknown';
  }

  return 'unknown';
}
