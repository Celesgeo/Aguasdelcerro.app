import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import {
  hasPathTraversal,
  isBlockedProbePath,
  isDisallowedMethod,
  probeBlockedResponse,
} from '@/lib/probe-guard';
import { clientIp } from '@/lib/request-ip';
import { sanitizeInternalPath } from '@/lib/safe-path';
import { getCanonicalRedirectTarget, shouldNoindexHost } from '@/lib/site-url';

const probeBuckets = new Map<string, { count: number; resetAt: number }>();

function probeRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `probe:${ip}`;
  const current = probeBuckets.get(key);
  const windowMs = 60_000;
  const limit = 30;

  if (!current || now >= current.resetAt) {
    probeBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;
  current.count += 1;
  probeBuckets.set(key, current);
  return true;
}

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
  const ip = clientIp(request);

  if (
    hasPathTraversal(pathname) ||
    isBlockedProbePath(pathname) ||
    isDisallowedMethod(pathname, request.method)
  ) {
    if (!probeRateLimit(ip)) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' },
      });
    }
    return probeBlockedResponse();
  }

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
    res.headers.set('Cache-Control', 'no-store');
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
    res.headers.set('Cache-Control', 'no-store');
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|mp4)$).*)'],
};
