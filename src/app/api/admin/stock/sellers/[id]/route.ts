import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stockViewer } from '@/lib/stock-auth';
import { SellerError, updateSeller } from '@/lib/stock-team';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if ((await stockViewer()) !== 'admin') return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const update: { name?: string; active?: boolean } = {};
  if (body?.name !== undefined) {
    const name = sanitizeText(body.name, 60);
    if (!name) return NextResponse.json({ ok: false, error: 'Falta el nombre' }, { status: 400 });
    update.name = name;
  }
  if (body?.active !== undefined) update.active = Boolean(body.active);
  try {
    const seller = await updateSeller(id, update);
    if (!seller) return NextResponse.json({ ok: false, error: 'Vendedor no encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true, seller });
  } catch (error) {
    if (error instanceof SellerError) return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    return NextResponse.json({ ok: false, error: 'No se pudo guardar' }, { status: 500 });
  }
}
