import { NextResponse } from 'next/server';
import { COOKIE_NAME, adminCookieOptions } from '@/lib/admin-auth';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { ...adminCookieOptions(0), maxAge: 0 });
  return res;
}
