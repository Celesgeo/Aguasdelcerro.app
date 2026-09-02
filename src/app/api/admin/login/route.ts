import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  COOKIE_NAME,
  adminCookieOptions,
  createAdminSessionToken,
  getAdminCredentials,
} from '@/lib/admin-auth';
import { clientIp, rateLimit, safeEqualString, sanitizeText, uniformResponseDelay } from '@/lib/security';

export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`admin-login:${ip}`, 5, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: 'Demasiados intentos. Probá más tarde.' },
        {
          status: 429,
          headers: { 'Retry-After': String(limited.retryAfterSec) },
        },
      );
    }

    const body = await request.json();
    const username = sanitizeText(body?.username, 80);
    const password = String(body?.password ?? '');

    if (!username || !password || password.length > 200) {
      return NextResponse.json({ ok: false, error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    let creds: { username: string; password: string };
    try {
      creds = getAdminCredentials();
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Admin no configurado en el servidor.' },
        { status: 503 },
      );
    }

    const userOk = safeEqualString(username, creds.username);
    const passOk = safeEqualString(password, creds.password);
    if (!userOk || !passOk) {
      await uniformResponseDelay();
      return NextResponse.json({ ok: false, error: 'Usuario o contraseña incorrectos' }, { status: 401 });
    }

    const token = await createAdminSessionToken(username);
    const res = NextResponse.json({ ok: true, username });
    res.cookies.set(COOKIE_NAME, token, adminCookieOptions());
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo iniciar sesión' }, { status: 500 });
  }
}
