import { NextResponse } from 'next/server';

/** Endpoint para healthcheck de Railway (no redirige a www). */
export function GET() {
  return NextResponse.json({ ok: true });
}
