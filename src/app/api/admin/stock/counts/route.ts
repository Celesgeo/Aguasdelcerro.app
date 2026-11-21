import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stockViewer } from '@/lib/stock-auth';
import { listRecentCounts, recordPhysicalCount } from '@/lib/stock-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if ((await stockViewer()) !== 'admin') return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, counts: await listRecentCounts() });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo cargar' }, { status: 500 });
  }
}

/** Body: { items: [{ productId, counted }] } */
export async function POST(request: NextRequest) {
  if ((await stockViewer()) !== 'admin') return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const items: unknown[] = Array.isArray(body?.items) ? body.items.slice(0, 300) : [];
  const results: { productId: string; name: string; before: number; counted: number; difference: number }[] = [];
  try {
    for (const raw of items) {
      const item = raw as { productId?: unknown; counted?: unknown };
      const productId = String(item?.productId ?? '');
      const counted = Number(item?.counted);
      if (!/^[0-9a-f-]{36}$/i.test(productId) || !Number.isInteger(counted) || counted < 0 || counted > 1_000_000) continue;
      const result = await recordPhysicalCount(productId, counted, 'Administración');
      if (result) {
        results.push({ productId, name: result.product.name, before: result.before, counted, difference: result.difference });
      }
    }
    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar el conteo', results }, { status: 500 });
  }
}
