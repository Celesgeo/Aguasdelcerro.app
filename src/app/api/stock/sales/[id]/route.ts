import { NextResponse } from 'next/server';
import { stockViewer } from '@/lib/stock-auth';
import { StockError, voidSale } from '@/lib/stock-store';

export const dynamic = 'force-dynamic';

/** El personal puede anular una venta dentro de los 15 minutos; el administrador, siempre. */
const STAFF_UNDO_MINUTES = 15;

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await stockViewer();
  if (!viewer) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: 'Venta no encontrada' }, { status: 404 });
  }
  try {
    const done = await voidSale(id, viewer === 'admin' ? {} : { maxAgeMinutes: STAFF_UNDO_MINUTES });
    if (!done) return NextResponse.json({ ok: false, error: 'Venta no encontrada o ya anulada' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof StockError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: 'No se pudo anular la venta' }, { status: 500 });
  }
}
