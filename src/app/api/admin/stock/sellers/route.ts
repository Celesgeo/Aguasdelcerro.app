import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stockViewer } from '@/lib/stock-auth';
import { SellerError, createSeller, listSellers } from '@/lib/stock-team';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET() {
  if ((await stockViewer()) !== 'admin') return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, sellers: await listSellers({ includeInactive: true }) });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudieron cargar los vendedores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if ((await stockViewer()) !== 'admin') return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = sanitizeText(body?.name, 60);
  if (!name) return NextResponse.json({ ok: false, error: 'Falta el nombre' }, { status: 400 });
  try {
    return NextResponse.json({ ok: true, seller: await createSeller(name) });
  } catch (error) {
    if (error instanceof SellerError) return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    return NextResponse.json({ ok: false, error: 'No se pudo agregar' }, { status: 500 });
  }
}
