import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import { getCanonicalRedirectTarget, shouldNoindexHost } from '@/lib/site-url';
import { sanitizeInternalPath } from '@/lib/safe-path';

function applySeoHeaders(res: NextResponse, request: NextRequest): NextResponse {
  const host = request.headers.get('host') ?? '';
  if (shouldNoindexHost(host)) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // Railway o dominio sin www → www.aguasdelcerro.com.ar (301)
  if (pathname !== '/api/health') {
    const canonicalTarget = getCanonicalRedirectTarget(host, pathname, request.nextUrl.search);
    if (canonicalTarget) {
      return NextResponse.redirect(canonicalTarget, 301);
    }
  }

  // Proteger APIs admin (excepto login y logout)
  if (
    pathname.startsWith('/api/admin') &&
    pathname !== '/api/admin/login' &&
    pathname !== '/api/admin/logout'
  ) {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (!(await verifyAdminSessionToken(token))) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
    }
    return applySeoHeaders(NextResponse.next(), request);
  }

  // noindex en rutas API (robots.txt no impide indexación; esto sí)
  if (pathname.startsWith('/api')) {
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
    return applySeoHeaders(res, request);
  }

  if (!pathname.startsWith('/admin')) {
    return applySeoHeaders(NextResponse.next(), request);
  }

  if (pathname === '/admin/login') {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    if (await verifyAdminSessionToken(token)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    const res = NextResponse.next();
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return res;
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!(await verifyAdminSessionToken(token))) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', sanitizeInternalPath(pathname));
    return NextResponse.redirect(loginUrl);
  }

  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
