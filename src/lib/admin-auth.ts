const COOKIE_NAME = 'adc_admin_session';
const MAX_AGE_SEC = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_SESSION_SECRET debe estar definido (mín. 32 caracteres).');
    }
    // Solo desarrollo local si falta .env.local
    return 'dev-only-insecure-secret-do-not-use-in-prod!!';
  }
  return secret;
}

export function getAdminCredentials(): { username: string; password: string } {
  const username = process.env.ADMIN_USERNAME?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      'Faltan ADMIN_USERNAME o ADMIN_PASSWORD. Configuralos en .env.local o en Railway.',
    );
  }

  if (password.length < 10) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 10 caracteres.');
  }

  return { username, password };
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]!);
  const b64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(arr).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
  if (typeof atob === 'function') {
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

async function getKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(payload: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return toBase64Url(sig);
}

function randomNonce(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes).slice(0, 12);
}

export async function createAdminSessionToken(username: string): Promise<string> {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const body = `${username}|${exp}|${randomNonce()}`;
  const sig = await sign(body);
  return `${body}.${sig}`;
}

export async function verifyAdminSessionToken(
  token: string | undefined | null,
): Promise<{ username: string } | null> {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  try {
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(sig) as BufferSource,
      new TextEncoder().encode(body),
    );
    if (!valid) return null;
  } catch {
    return null;
  }

  const [username, expStr] = body.split('|');
  const exp = Number(expStr);
  if (!username || !Number.isFinite(exp) || Date.now() > exp) return null;
  return { username };
}

export function adminCookieOptions(maxAge = MAX_AGE_SEC) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
  };
}

export { COOKIE_NAME, MAX_AGE_SEC };
