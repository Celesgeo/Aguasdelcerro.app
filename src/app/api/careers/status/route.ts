import { NextResponse } from 'next/server';
import {
  getActiveMailProvider,
  isMailConfigured,
  supportsCvEmailAttachment,
} from '@/lib/mail';

/** Diagnóstico interno — deshabilitado en producción por defecto. */
export function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_CAREERS_STATUS !== 'true') {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
  }

  const provider = getActiveMailProvider();

  return NextResponse.json({
    ok: isMailConfigured(),
    provider,
    cvAttachment: supportsCvEmailAttachment(),
  });
}
