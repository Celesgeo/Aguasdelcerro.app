import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isStaffPinConfigured, isValidPinFormat, setStaffPin, stockViewer } from '@/lib/stock-auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if ((await stockViewer()) !== 'admin') {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, configured: await isStaffPinConfigured() });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo consultar la clave' }, { status: 500 });
  }
}

/** Define o cambia la clave del personal. Cierra todas las sesiones abiertas del personal. */
export async function PUT(request: NextRequest) {
  if ((await stockViewer()) !== 'admin') {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const pin = String(body?.pin ?? '').trim();
  if (!isValidPinFormat(pin)) {
    return NextResponse.json({ ok: false, error: 'La clave tiene que tener entre 6 y 40 caracteres' }, { status: 400 });
  }
  try {
    await setStaffPin(pin);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar la clave' }, { status: 500 });
  }
}
