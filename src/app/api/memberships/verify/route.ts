import { NextResponse } from 'next/server';
import { findMemberByDownloadCode } from '@/lib/members-store';
import { getMembershipById } from '@/lib/memberships';
import { clientIp, rateLimit, sanitizeText } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`membership-verify:${ip}`, 20, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: 'Demasiados intentos. Probá más tarde.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
      );
    }

    const body = await request.json();
    const code = sanitizeText(body?.code, 5);

    if (!/^\d{5}$/.test(code)) {
      return NextResponse.json(
        { ok: false, error: 'Ingresá un código válido de 5 dígitos.' },
        { status: 400 },
      );
    }

    const member = await findMemberByDownloadCode(code);
    if (!member) {
      return NextResponse.json(
        { ok: false, error: 'Código no encontrado o aún no habilitado.' },
        { status: 404 },
      );
    }

    const tier = getMembershipById(member.membershipId);

    return NextResponse.json({
      ok: true,
      card: {
        memberNumber: member.accessNumber,
        membershipName: tier?.name ?? member.membershipId,
        firstName: member.firstName,
        lastName: member.lastName,
        startDate: member.startDate,
        endDate: member.endDate,
        experiences: member.totalExperiences || null,
        remainingExperiences: member.remainingExperiences,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'No se pudo validar el código.' }, { status: 500 });
  }
}
