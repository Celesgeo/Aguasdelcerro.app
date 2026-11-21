import { NextResponse } from 'next/server';
import { voidInPersonSale } from '@/lib/reservations';
import { staffNameFromCookie, stockViewer } from '@/lib/stock-auth';

export const dynamic = 'force-dynamic';

const STAFF_UNDO_MINUTES = 15;

/** Anula una membresía presencial: el personal dentro de 15 minutos, el administrador siempre. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const viewer = await stockViewer();
  if (!viewer) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ ok: false, error: 'Membresía no encontrada' }, { status: 404 });
  }
  try {
    const voidedBy = viewer === 'admin' ? 'Administración' : (await staffNameFromCookie()) || 'Sin nombre';
    const result = await voidInPersonSale(id, viewer === 'admin' ? undefined : STAFF_UNDO_MINUTES, voidedBy);
    if (result === 'not_found') {
      return NextResponse.json(
        { ok: false, error: 'No se encontró (las compras online se manejan desde Turnos)' },
        { status: 404 },
      );
    }
    if (result === 'too_late') {
      return NextResponse.json(
        { ok: false, error: `Pasaron más de ${STAFF_UNDO_MINUTES} minutos: pedile al administrador que la anule.` },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo anular' }, { status: 500 });
  }
}
