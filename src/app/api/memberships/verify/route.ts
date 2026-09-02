import { NextResponse } from 'next/server';
import { findMemberByDownloadCode } from '@/lib/members-store';
import { getMembershipById } from '@/lib/memberships';
import { clientIp, rateLimit, sanitizeText, uniformResponseDelay } from '@/lib/security';

const GENERIC_ERROR = 'Código no encontrado o aún no habilitado.';

export async function POST(request: Request) {
  const startedAt = Date.now();

  try {
    const ip = clientIp(request);
    const limited = rateLimit(`membership-verify:${ip}`, 10, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: 'Demasiados intentos. Probá más tarde.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
      );
    }

    const body = await request.json();
    const code = sanitizeText(body?.code, 5);

    if (!/^\d{5}$/.test(code)) {
      await uniformResponseDelay(Math.max(0, 450 - (Date.now() - startedAt)));
      return NextResponse.json(
        { ok: false, error: GENERIC_ERROR },
        { status: 404 },
      );
    }

    const member = await findMemberByDownloadCode(code);
    if (!member) {
      await uniformResponseDelay(Math.max(0, 450 - (Date.now() - startedAt)));
      return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 404 });
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
    await uniformResponseDelay(Math.max(0, 450 - (Date.now() - startedAt)));
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 404 });
  }
}
