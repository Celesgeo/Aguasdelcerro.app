import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { COOKIE_NAME as ADMIN_COOKIE, verifyAdminSessionToken } from '@/lib/admin-auth';
import { currentBusinessDate, currentShiftId, getSetting, setSetting } from '@/lib/stock-store';
import { shiftEndInstant } from '@/lib/visitor-shifts';

/**
 * Acceso del personal a /stock con una clave compartida que define el administrador.
 * Al cambiar la clave, se cierran todas las sesiones del personal (cambia la "versión").
 */

export const STAFF_COOKIE = 'adc_stock_staff';
export const STAFF_NAME_COOKIE = 'adc_stock_name';
export const STAFF_SELLER_COOKIE = 'adc_stock_seller';
export const STAFF_MAX_AGE_SEC = 60 * 60 * 6; // un turno: 6 horas

/** Hasta cuándo dura la sesión del personal: el final del turno en curso. */
export function currentShiftEnd(now = new Date()): Date {
  return shiftEndInstant(currentBusinessDate(now), currentShiftId(now));
}

/** Segundos que faltan para que termine el turno (mínimo 60). */
export function secondsUntilShiftEnd(now = new Date()): number {
  return Math.max(60, Math.floor((currentShiftEnd(now).getTime() - now.getTime()) / 1000));
}

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

/**
 * Clave de respaldo definida en Railway (STOCK_STAFF_PASSWORD). Se usa solo si el
 * administrador todavía no guardó una desde el panel; la del panel siempre tiene prioridad.
 */
function envPin(): StoredPin | null {
  const value = process.env.STOCK_STAFF_PASSWORD?.trim();
  if (!value || !isValidPinFormat(value)) return null;
  const salt = 'env';
  return {
    salt,
    hash: scryptSync(value, salt, 32).toString('base64url'),
    version: `env-${createHmac('sha256', secret()).update(value).digest('base64url').slice(0, 10)}`,
  };
}

async function readPin(): Promise<StoredPin | null> {
  const raw = await getSetting(PIN_KEY);
  if (!raw) return envPin();
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

/** Entre 6 y 40 caracteres (letras, números o símbolos). Distingue mayúsculas. */
export function isValidPinFormat(pin: string): boolean {
  return pin.length >= 6 && pin.length <= 40 && !/[\u0000-\u001F\u007F]/.test(pin);
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

  // La sesión se cierra sola al terminar el turno.
  const exp = currentShiftEnd().getTime();
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
  const exp = Number(expStr);
  if (kind !== 'staff' || !version || !Number.isFinite(exp) || Date.now() > exp) return false;
  // Ninguna sesión pasa del final del turno en curso (también corta sesiones viejas de 14 h).
  if (exp > currentShiftEnd().getTime() + 60_000) return false;
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

/** Nombre de quien atiende el turno (guardado en la sesión, no en el navegador). */
export async function staffNameFromCookie(): Promise<string> {
  const jar = await cookies();
  const raw = jar.get(STAFF_NAME_COOKIE)?.value ?? '';
  try {
    return decodeURIComponent(raw).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 60);
  } catch {
    return '';
  }
}

/** Id del vendedor elegido de la lista (para la asistencia). */
export async function sellerIdFromCookie(): Promise<string | null> {
  const jar = await cookies();
  const value = jar.get(STAFF_SELLER_COOKIE)?.value ?? '';
  return /^[0-9a-f-]{36}$/i.test(value) ? value : null;
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
