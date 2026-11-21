import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stockViewer } from '@/lib/stock-auth';
import { createProduct, isStockCategory, listProducts } from '@/lib/stock-store';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  return (await stockViewer()) === 'admin';
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    const products = await listProducts({ includeInactive: true });
    return NextResponse.json({ ok: true, products });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo cargar el stock' }, { status: 500 });
  }
}

function intOrNull(value: unknown): number | null | 'invalid' {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 100_000_000) return 'invalid';
  return n;
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const name = sanitizeText(body?.name, 80);
  const category = sanitizeText(body?.category, 40);
  const unitPrice = intOrNull(body?.unitPrice);
  const quantity = body?.tracked === false ? null : intOrNull(body?.quantity ?? 0);
  const lowAlert = intOrNull(body?.lowAlert ?? 2);

  if (!name) return NextResponse.json({ ok: false, error: 'Falta el nombre' }, { status: 400 });
  if (!isStockCategory(category)) return NextResponse.json({ ok: false, error: 'Categoría inválida' }, { status: 400 });
  if (unitPrice === 'invalid' || unitPrice === null) {
    return NextResponse.json({ ok: false, error: 'Precio inválido' }, { status: 400 });
  }
  if (quantity === 'invalid') return NextResponse.json({ ok: false, error: 'Cantidad inválida' }, { status: 400 });
  if (lowAlert === 'invalid') return NextResponse.json({ ok: false, error: 'Aviso de stock bajo inválido' }, { status: 400 });

  try {
    const product = await createProduct({
      name,
      category,
      unitPrice,
      quantity: body?.tracked === false ? null : (quantity ?? 0),
      lowAlert: lowAlert ?? 2,
      isRental: body?.tracked !== false && Boolean(body?.isRental),
    });
    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo crear el producto' }, { status: 500 });
  }
}
