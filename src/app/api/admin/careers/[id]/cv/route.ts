import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { COOKIE_NAME, verifyAdminSessionToken } from '@/lib/admin-auth';
import { readCareerCv } from '@/lib/careers-store';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies();
  const session = await verifyAdminSessionToken(jar.get(COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const { id } = await params;
  const file = await readCareerCv(id);
  if (!file) return NextResponse.json({ ok: false, error: 'Sin CV' }, { status: 404 });

  return new NextResponse(new Uint8Array(file.buffer), {
    headers: {
      'Content-Type': file.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file.filename.replace(/"/g, '')}"`,
      'Cache-Control': 'no-store',
    },
  });
}
