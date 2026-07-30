import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import { addUsage, deleteUsage } from '@/lib/members-store';
import { isValidDateISO, isValidTimeHHMM, sanitizeText } from '@/lib/security';

async function requireAdmin() {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value);
}

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const date = sanitizeText(body.date, 10);
    const time = sanitizeText(body.time, 5);
    const experiencesUsed = Number(body.experiencesUsed ?? 1);
    const note = body.note ? sanitizeText(body.note, 300) : undefined;

    if (!isValidDateISO(date) || !isValidTimeHHMM(time)) {
      return NextResponse.json({ ok: false, error: 'Fecha u hora inválida' }, { status: 400 });
    }
    if (!Number.isFinite(experiencesUsed) || experiencesUsed < 1 || experiencesUsed > 500) {
      return NextResponse.json({ ok: false, error: 'Cantidad de experiencias inválida' }, { status: 400 });
    }

    const member = await addUsage(sanitizeText(id, 80), {
      date,
      time,
      experiencesUsed,
      note,
    });
    return NextResponse.json({ ok: true, member });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo registrar el uso';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request, ctx: Ctx) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const usageId = sanitizeText(body.usageId, 80);
    if (!usageId) {
      return NextResponse.json({ ok: false, error: 'Falta usageId' }, { status: 400 });
    }
    const member = await deleteUsage(sanitizeText(id, 80), usageId);
    return NextResponse.json({ ok: true, member });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo eliminar el uso';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
