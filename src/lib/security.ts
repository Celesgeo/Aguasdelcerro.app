import { timingSafeEqual } from 'node:crypto';
import { clientIp } from '@/lib/request-ip';

export { clientIp };

/** Comparación en tiempo constante para strings (Node runtime). */
export function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Rate limit simple en memoria (por instancia). */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return { ok: true, retryAfterSec: 0 };
}

/** Nombre seguro para adjuntos de email. */
export function sanitizeAttachmentFilename(name: string, fallback = 'cv.pdf'): string {
  const base = name.split(/[/\\]/).pop() ?? fallback;
  const cleaned = base.replace(/[^\w.\- ()áéíóúÁÉÍÓÚñÑ]/g, '_').slice(0, 120);
  return cleaned || fallback;
}

export async function uniformResponseDelay(minMs = 450): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, minMs));
}

export function sanitizeText(value: unknown, maxLen = 200): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLen);
}

export function isValidDateISO(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function isValidTimeHHMM(value: string): boolean {
  return /^\d{2}:\d{2}$/.test(value);
}
