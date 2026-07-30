import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import {
  deleteMember,
  getMemberById,
  updateMember,
  type MemberInput,
} from '@/lib/members-store';
import { getMembershipById, type MembershipTierId } from '@/lib/memberships';
import { isValidDateISO, sanitizeText } from '@/lib/security';

async function requireAdmin() {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value);
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await ctx.params;
  const member = await getMemberById(sanitizeText(id, 80));
  if (!member) return NextResponse.json({ ok: false, error: 'Socio no encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true, member });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const input: Partial<MemberInput> = {};

    if (body.accessNumber !== undefined) input.accessNumber = sanitizeText(body.accessNumber, 40);
    if (body.downloadCode !== undefined) input.downloadCode = sanitizeText(body.downloadCode, 5);
    if (body.firstName !== undefined) input.firstName = sanitizeText(body.firstName, 80);
    if (body.lastName !== undefined) input.lastName = sanitizeText(body.lastName, 80);
    if (body.email !== undefined) input.email = sanitizeText(body.email, 120);
    if (body.phone !== undefined) input.phone = sanitizeText(body.phone, 40);
    if (body.membershipId !== undefined) {
      const membershipId = sanitizeText(body.membershipId, 40) as MembershipTierId;
      if (!getMembershipById(membershipId)) {
        return NextResponse.json({ ok: false, error: 'Membresía inválida' }, { status: 400 });
      }
      input.membershipId = membershipId;
    }
    if (body.startDate !== undefined) {
      input.startDate = sanitizeText(body.startDate, 10);
      if (!isValidDateISO(input.startDate)) {
        return NextResponse.json({ ok: false, error: 'Fecha inicio inválida' }, { status: 400 });
      }
    }
    if (body.endDate !== undefined) {
      input.endDate = sanitizeText(body.endDate, 10);
      if (!isValidDateISO(input.endDate)) {
        return NextResponse.json({ ok: false, error: 'Fecha fin inválida' }, { status: 400 });
      }
    }
    if (body.totalExperiences !== undefined) {
      const n = Number(body.totalExperiences);
      if (!Number.isFinite(n) || n < 0 || n > 10000) {
        return NextResponse.json({ ok: false, error: 'Total de experiencias inválido' }, { status: 400 });
      }
      input.totalExperiences = n;
    }
    if (body.remainingExperiences !== undefined) {
      const n = Number(body.remainingExperiences);
      if (!Number.isFinite(n) || n < 0 || n > 10000) {
        return NextResponse.json({ ok: false, error: 'Experiencias disponibles inválidas' }, { status: 400 });
      }
      input.remainingExperiences = n;
    }

    const member = await updateMember(sanitizeText(id, 80), input);
    return NextResponse.json({ ok: true, member });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo actualizar';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  try {
    const { id } = await ctx.params;
    await deleteMember(sanitizeText(id, 80));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo eliminar';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
