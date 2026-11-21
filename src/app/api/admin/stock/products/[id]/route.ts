import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stockViewer } from '@/lib/stock-auth';
import { isStockCategory, restockProduct, updateProduct, type ProductUpdate } from '@/lib/stock-store';
import { sanitizeText } from '@/lib/security';

export const dynamic = 'force-dynamic';

function nonNegativeInt(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 100_000_000 ? n : null;
}

/**
 * Body:
 *  - { restock: 12, note? }  → suma unidades
 *  - { name?, category?, unitPrice?, quantity?, tracked?, lowAlert?, active? } → edita
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  if ((await stockViewer()) !== 'admin') {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: 'Producto no encontrado' }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));

  try {
    if (body?.restock !== undefined) {
      const units = Number(body.restock);
      if (!Number.isInteger(units) || units < 1 || units > 10_000) {
        return NextResponse.json({ ok: false, error: 'Cantidad a reponer inválida' }, { status: 400 });
      }
      const product = await restockProduct(id, units, sanitizeText(body?.note, 120));
      if (!product) return NextResponse.json({ ok: false, error: 'Producto no encontrado' }, { status: 404 });
      return NextResponse.json({ ok: true, product });
    }

    const update: ProductUpdate = {};
    if (body?.name !== undefined) {
      const name = sanitizeText(body.name, 80);
      if (!name) return NextResponse.json({ ok: false, error: 'Falta el nombre' }, { status: 400 });
      update.name = name;
    }
    if (body?.category !== undefined) {
      const category = sanitizeText(body.category, 40);
      if (!isStockCategory(category)) return NextResponse.json({ ok: false, error: 'Categoría inválida' }, { status: 400 });
      update.category = category;
    }
    if (body?.unitPrice !== undefined) {
      const price = nonNegativeInt(body.unitPrice);
      if (price === null) return NextResponse.json({ ok: false, error: 'Precio inválido' }, { status: 400 });
      update.unitPrice = price;
    }
    if (body?.tracked === false) {
      update.quantity = null;
    } else if (body?.quantity !== undefined) {
      const quantity = nonNegativeInt(body.quantity);
      if (quantity === null) return NextResponse.json({ ok: false, error: 'Cantidad inválida' }, { status: 400 });
      update.quantity = quantity;
    }
    if (body?.lowAlert !== undefined) {
      const lowAlert = nonNegativeInt(body.lowAlert);
      if (lowAlert === null) return NextResponse.json({ ok: false, error: 'Aviso inválido' }, { status: 400 });
      update.lowAlert = lowAlert;
    }
    if (body?.active !== undefined) update.active = Boolean(body.active);
    if (body?.isRental !== undefined) update.isRental = body?.tracked !== false && Boolean(body.isRental);

    const product = await updateProduct(id, update);
    if (!product) return NextResponse.json({ ok: false, error: 'Producto no encontrado' }, { status: 404 });
    return NextResponse.json({ ok: true, product });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar el producto' }, { status: 500 });
  }
}
