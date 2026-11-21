import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { COOKIE_NAME as ADMIN_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';
import { getSetting, setSetting } from '@/lib/stock-store';

/**
 * Acceso del personal a /stock con una clave numérica compartida que define el administrador.
 * Al cambiar la clave, se cierran todas las sesiones del personal (cambia la "versión").
 */

export const STAFF_COOKIE = 'adc_stock_staff';
export const STAFF_MAX_AGE_SEC = 60 * 60 * 14; // un turno largo con margen

const PIN_KEY = 'staff_pin';

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_SESSION_SECRET debe estar definido (mín. 32 caracteres).');
    }
    return 'dev-only-insecure-secret-do-not-use-in-prod!!';
  }
  return `${value}:stock-staff`;
}

function hmac(body: string): string {
  return createHmac('sha256', secret()).update(body).digest('base64url');
}

type StoredPin = { salt: string; hash: string; version: string };

async function readPin(): Promise<StoredPin | null> {
  const raw = await getSetting(PIN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredPin;
    if (parsed.salt && parsed.hash && parsed.version) return parsed;
  } catch {
    // valor corrupto: se trata como sin clave
  }
  return null;
}

export async function isStaffPinConfigured(): Promise<boolean> {
  return Boolean(await readPin());
}

export function isValidPinFormat(pin: string): boolean {
  return /^\d{6,12}$/.test(pin);
}

export async function setStaffPin(pin: string): Promise<void> {
  const salt = randomBytes(16).toString('base64url');
  const hash = scryptSync(pin, salt, 32).toString('base64url');
  const version = randomBytes(6).toString('base64url');
  await setSetting(PIN_KEY, JSON.stringify({ salt, hash, version }));
}

/** Devuelve un token de sesión si la clave es correcta. */
export async function checkStaffPin(pin: string): Promise<string | null> {
  const stored = await readPin();
  if (!stored) return null;
  const candidate = scryptSync(pin, stored.salt, 32);
  const expected = Buffer.from(stored.hash, 'base64url');
  if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) return null;

  const exp = Date.now() + STAFF_MAX_AGE_SEC * 1000;
  const body = `staff|${stored.version}|${exp}|${randomBytes(6).toString('base64url')}`;
  return `${body}.${hmac(body)}`;
}

async function verifyStaffToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const dot = token.lastIndexOf('.');
  if (dot < 0) return false;
  const body = token.slice(0, dot);
  const sig = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(hmac(body));
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return false;

  const [kind, version, expStr] = body.split('|');
  if (kind !== 'staff' || !version || Date.now() > Number(expStr)) return false;
  const stored = await readPin();
  return Boolean(stored && stored.version === version);
}

export function staffCookieOptions(maxAge = STAFF_MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  };
}

/** Quién está usando /stock: el administrador (con su sesión) o el personal (con la clave). */
export async function stockViewer(): Promise<'admin' | 'staff' | null> {
  const jar = await cookies();
  if (await verifyAdminSessionToken(jar.get(ADMIN_COOKIE)?.value)) return 'admin';
  try {
    if (await verifyStaffToken(jar.get(STAFF_COOKIE)?.value)) return 'staff';
  } catch {
    return null;
  }
  return null;
}
