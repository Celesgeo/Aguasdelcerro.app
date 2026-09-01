import { NextResponse } from 'next/server';
import {
  getActiveMailProvider,
  isMailConfigured,
  supportsCvEmailAttachment,
} from '@/lib/mail';

/** Diagnóstico de envío de postulaciones (sin exponer claves). */
export function GET() {
  const provider = getActiveMailProvider();

  return NextResponse.json({
    ok: isMailConfigured(),
    provider,
    cvAttachment: supportsCvEmailAttachment(),
  });
}
