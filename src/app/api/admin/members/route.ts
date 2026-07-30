import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import { createMember, listMembers, type MemberInput } from '@/lib/members-store';
import type { MembershipTierId } from '@/lib/memberships';
import { isValidDateISO, sanitizeText } from '@/lib/security';

async function requireAdmin() {
  const jar = await cookies();
  return verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value);
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const members = await listMembers();
  return NextResponse.json({ ok: true, members });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  try {
    const body = await request.json();
    const input: MemberInput = {
      accessNumber: body.accessNumber ? sanitizeText(body.accessNumber, 40) : undefined,
      downloadCode: body.downloadCode ? sanitizeText(body.downloadCode, 5) : undefined,
      firstName: sanitizeText(body.firstName, 80),
      lastName: sanitizeText(body.lastName, 80),
      email: body.email ? sanitizeText(body.email, 120) : undefined,
      phone: body.phone ? sanitizeText(body.phone, 40) : undefined,
      membershipId: sanitizeText(body.membershipId, 40) as MembershipTierId,
      totalExperiences: body.totalExperiences != null ? Number(body.totalExperiences) : undefined,
      remainingExperiences:
        body.remainingExperiences != null ? Number(body.remainingExperiences) : undefined,
      startDate: sanitizeText(body.startDate, 10),
      endDate: sanitizeText(body.endDate, 10),
    };

    if (!input.firstName || !input.lastName || !input.membershipId || !input.startDate || !input.endDate) {
      return NextResponse.json({ ok: false, error: 'Faltan datos obligatorios' }, { status: 400 });
    }
    if (!isValidDateISO(input.startDate) || !isValidDateISO(input.endDate)) {
      return NextResponse.json({ ok: false, error: 'Fechas inválidas' }, { status: 400 });
    }
    if (
      input.totalExperiences != null &&
      (!Number.isFinite(input.totalExperiences) || input.totalExperiences < 0 || input.totalExperiences > 10000)
    ) {
      return NextResponse.json({ ok: false, error: 'Total de experiencias inválido' }, { status: 400 });
    }

    const member = await createMember(input);
    return NextResponse.json({ ok: true, member });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo crear el socio';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
