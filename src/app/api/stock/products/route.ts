import { NextResponse } from 'next/server';
import { stockViewer } from '@/lib/stock-auth';
import { listProducts } from '@/lib/stock-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await stockViewer())) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    const products = await listProducts();
    return NextResponse.json({ ok: true, products });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo cargar el stock' }, { status: 500 });
  }
}
