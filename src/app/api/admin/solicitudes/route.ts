import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import { listRecentRequests } from '@/lib/cancellation-requests';

export async function GET() {
  const jar = await cookies();
  if (!(await verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value))) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, requests: await listRecentRequests(40) });
  } catch (error) {
    console.error('[admin/solicitudes]', error);
    return NextResponse.json({ ok: false, error: 'No se pudo leer la base de datos' }, { status: 500 });
  }
}
