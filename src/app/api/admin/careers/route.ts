import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import { listCareerApplications } from '@/lib/careers-store';

export async function GET() {
  const jar = await cookies();
  const session = await verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const applications = await listCareerApplications();
  return NextResponse.json({
    ok: true,
    applications: applications.map((item) => ({
      ...item,
      ip: undefined,
    })),
  });
}
