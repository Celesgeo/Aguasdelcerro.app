import { NextResponse } from 'next/server';
import {
  CV_MAX_BYTES,
  CV_ALLOWED_MIME_TYPES,
  getFileExtension,
  isAllowedCvExtension,
  isValidCareerPosition,
  isValidEmail,
  isValidPhone,
  matchesCvMagicBytes,
  explainCareersMailError,
  type CareerPosition,
} from '@/lib/careers';
import { saveCareerApplication, incrementApplicationCount } from '@/lib/careers-store';
import { isMailConfigured, sendCareerApplicationEmail } from '@/lib/mail';
import { clientIp, rateLimit, sanitizeText } from '@/lib/security';

export const maxDuration = 60;

const MIN_FORM_SECONDS = 3;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`careers:${ip}`, 20, 60 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { ok: false, error: 'Demasiados intentos. Probá más tarde.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
      );
    }

    const formData = await request.formData();

    // Honeypot: bots suelen completar campos ocultos
    const honeypot = sanitizeText(formData.get('_gotcha'), 100);
    if (honeypot) {
      return NextResponse.json({ ok: true, message: 'Postulación recibida.' });
    }

    const startedAt = Number(formData.get('_startedAt'));
    if (!Number.isFinite(startedAt) || Date.now() - startedAt < MIN_FORM_SECONDS * 1000) {
      return NextResponse.json(
        { ok: false, error: 'No se pudo enviar la postulación. Intentá de nuevo.' },
        { status: 400 },
      );
    }

    const nombre = sanitizeText(formData.get('nombre'), 120);
    const telefono = sanitizeText(formData.get('telefono'), 30);
    const email = sanitizeText(formData.get('email'), 120);
    const localidad = sanitizeText(formData.get('localidad'), 80);
    const puesto = sanitizeText(formData.get('puesto'), 20);
    const presentacion = sanitizeText(formData.get('presentacion'), 2000);

    if (!nombre || !telefono || !email || !localidad || !puesto || !presentacion) {
      return NextResponse.json(
        { ok: false, error: 'Completá todos los campos obligatorios.' },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: 'Ingresá un email válido.' }, { status: 400 });
    }

    if (!isValidPhone(telefono)) {
      return NextResponse.json(
        { ok: false, error: 'Ingresá un teléfono válido (mínimo 8 dígitos).' },
        { status: 400 },
      );
    }

    if (!isValidCareerPosition(puesto)) {
      return NextResponse.json({ ok: false, error: 'Seleccioná un puesto válido.' }, { status: 400 });
    }

    const cvEntry = formData.get('cv');
    const hasCv = cvEntry instanceof File && cvEntry.size > 0;
    let buffer = Buffer.alloc(0);
    let ext = '';
    let mime = 'application/octet-stream';
    let cvOriginalName = 'sin-cv';

    if (hasCv) {
      if (cvEntry.size > CV_MAX_BYTES) {
        return NextResponse.json(
          { ok: false, error: 'El archivo supera el límite de 5 MB.' },
          { status: 400 },
        );
      }

      ext = getFileExtension(cvEntry.name);
      if (!isAllowedCvExtension(ext)) {
        return NextResponse.json(
          { ok: false, error: 'Formato no permitido. Usá PDF, Word (.doc/.docx) o imagen (JPG, PNG, WEBP).' },
          { status: 400 },
        );
      }

      mime = cvEntry.type || 'application/octet-stream';
      if (mime !== 'application/octet-stream' && !CV_ALLOWED_MIME_TYPES.has(mime)) {
        return NextResponse.json(
          { ok: false, error: 'Tipo de archivo no permitido.' },
          { status: 400 },
        );
      }

      buffer = Buffer.from(await cvEntry.arrayBuffer());
      if (!matchesCvMagicBytes(buffer, ext)) {
        return NextResponse.json(
          { ok: false, error: 'El archivo no coincide con el formato indicado.' },
          { status: 400 },
        );
      }

      cvOriginalName = cvEntry.name.slice(0, 200);
    }

    if (!isMailConfigured()) {
      return NextResponse.json(
        { ok: false, error: 'El envío por email no está disponible. Intentá de nuevo en unos minutos.' },
        { status: 503 },
      );
    }

    const applicationData = {
      nombre,
      telefono,
      email,
      localidad,
      puesto: puesto as CareerPosition,
      presentacion,
      cvOriginalName,
      cvSize: buffer.length,
      cvMimeType: mime,
      ip,
    };

    await sendCareerApplicationEmail({
      ...applicationData,
      cvBuffer: buffer,
      cvFilename: cvOriginalName,
    });

    try {
      if (hasCv) {
        await saveCareerApplication(applicationData, buffer, ext);
      }
    } catch {
      // El email ya salió; el backup en disco es opcional en producción efímera.
    }

    let count: number | undefined;
    try {
      count = await incrementApplicationCount();
    } catch {
      count = undefined;
    }

    return NextResponse.json({
      ok: true,
      count,
      message: '¡Gracias! Recibimos tu postulación. Nos contactaremos si tu perfil encaja con la búsqueda.',
    });
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    console.error('[careers] postulación fallida:', raw);
    return NextResponse.json(
      { ok: false, error: explainCareersMailError(raw) },
      { status: 500 },
    );
  }
}
