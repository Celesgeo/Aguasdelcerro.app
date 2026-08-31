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
  type CareerPosition,
} from '@/lib/careers';
import { saveCareerApplication } from '@/lib/careers-store';
import { isMailConfigured, sendCareerApplicationEmail } from '@/lib/mail';
import { clientIp, rateLimit, sanitizeText } from '@/lib/security';

const MIN_FORM_SECONDS = 3;

export async function POST(request: Request) {
  try {
    const ip = clientIp(request);
    const limited = rateLimit(`careers:${ip}`, 5, 60 * 60 * 1000);
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
    if (!(cvEntry instanceof File) || cvEntry.size === 0) {
      return NextResponse.json({ ok: false, error: 'Adjuntá tu CV.' }, { status: 400 });
    }

    if (cvEntry.size > CV_MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'El archivo supera el límite de 5 MB.' },
        { status: 400 },
      );
    }

    const ext = getFileExtension(cvEntry.name);
    if (!isAllowedCvExtension(ext)) {
      return NextResponse.json(
        { ok: false, error: 'Formato no permitido. Usá PDF, Word (.doc/.docx) o imagen (JPG, PNG, WEBP).' },
        { status: 400 },
      );
    }

    const mime = cvEntry.type || 'application/octet-stream';
    if (mime !== 'application/octet-stream' && !CV_ALLOWED_MIME_TYPES.has(mime)) {
      return NextResponse.json(
        { ok: false, error: 'Tipo de archivo no permitido.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await cvEntry.arrayBuffer());
    if (!matchesCvMagicBytes(buffer, ext)) {
      return NextResponse.json(
        { ok: false, error: 'El archivo no coincide con el formato indicado.' },
        { status: 400 },
      );
    }

    if (!isMailConfigured()) {
      return NextResponse.json(
        { ok: false, error: 'El envío por email no está disponible. Contactanos por WhatsApp.' },
        { status: 503 },
      );
    }

    const cvOriginalName = cvEntry.name.slice(0, 200);
    const applicationData = {
      nombre,
      telefono,
      email,
      localidad,
      puesto: puesto as CareerPosition,
      presentacion,
      cvOriginalName,
      cvSize: cvEntry.size,
      cvMimeType: mime,
      ip,
    };

    await sendCareerApplicationEmail({
      ...applicationData,
      cvBuffer: buffer,
      cvFilename: cvOriginalName,
    });

    try {
      await saveCareerApplication(applicationData, buffer, ext);
    } catch {
      // El email ya salió; el backup en disco es opcional en producción efímera.
    }

    return NextResponse.json({
      ok: true,
      message: '¡Gracias! Recibimos tu postulación. Nos contactaremos si tu perfil encaja con la búsqueda.',
    });
  } catch (error) {
    console.error('[careers] postulación fallida:', error);
    return NextResponse.json(
      { ok: false, error: 'No se pudo enviar la postulación. Intentá de nuevo o escribinos por WhatsApp.' },
      { status: 500 },
    );
  }
}
