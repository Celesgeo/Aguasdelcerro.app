import nodemailer from 'nodemailer';
import { SITE } from '@/lib/constants';
import { getCareerPositionLabel, getFileExtension, type CareerPosition } from '@/lib/careers';
import { sanitizeAttachmentFilename } from '@/lib/security';

export type CareerEmailParams = {
  nombre: string;
  telefono: string;
  email: string;
  localidad: string;
  puesto: CareerPosition;
  presentacion: string;
  cvBuffer: Buffer;
  cvFilename: string;
  cvMimeType: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
};

const ACTIVE_CAREERS_INBOX = 'celesteorellano14@gmail.com';
const SITE_ORIGIN = `https://${SITE.publicHost}`;
const RESEND_TEST_FROM = `${SITE.name} <onboarding@resend.dev>`;

function getCareersNotifyEmail(): string {
  const configured = process.env.CAREERS_NOTIFY_EMAIL?.trim();
  if (configured && !configured.toLowerCase().endsWith('@aguasdelcerro.net')) {
    return configured;
  }
  return ACTIVE_CAREERS_INBOX;
}

function getWeb3FormsKey(): string | null {
  return process.env.WEB3FORMS_ACCESS_KEY?.trim() || null;
}

function getResendKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
}

function getSmtpConfig(): SmtpConfig | null {
  const rawPass = process.env.SMTP_PASS?.trim();
  if (!rawPass) return null;
  const pass = rawPass.replace(/\s+/g, '');
  const user = process.env.SMTP_USER?.trim() || SITE.email;
  // contacto@aguasdelcerro.net todavía no está activo.
  if (user.toLowerCase().endsWith('@aguasdelcerro.net')) return null;
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT ?? '465');

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
}

export type MailProvider = 'resend' | 'web3forms' | 'formsubmit' | 'smtp';

/** Resend free (100/día) no debe bloquear el formulario: se saltea hasta el reset UTC. */
let resendBlockedUntil = 0;

function isResendQuotaError(message: string): boolean {
  return /quota exceeded|daily quota|rate[_ ]limit|too many requests/i.test(message);
}

function blockResendUntilQuotaReset(): void {
  const now = new Date();
  resendBlockedUntil =
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) + 5 * 60 * 1000;
}

function isResendQuotaBlocked(): boolean {
  return Date.now() < resendBlockedUntil;
}

export function isMailConfigured(): boolean {
  return getActiveMailProvider() !== null;
}

/** Primer proveedor que se intenta. Resend free no se usa: su cuota diaria tumba el formulario. */
export function getActiveMailProvider(): MailProvider | null {
  return 'formsubmit';
}

export function supportsCvEmailAttachment(): boolean {
  return true;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function cvAttachmentFilename(params: CareerEmailParams): string {
  const ext = getFileExtension(params.cvFilename) || '.bin';
  return sanitizeAttachmentFilename(`cv-${params.puesto}${ext}`, `cv${ext}`);
}

function buildEmailContent(params: CareerEmailParams, options?: { cvAttached?: boolean }) {
  const puestoLabel = getCareerPositionLabel(params.puesto);
  const cvSize = formatFileSize(params.cvBuffer.length);
  const cvAttached = options?.cvAttached ?? true;

  const cvLines = cvAttached
    ? [`Archivo CV adjunto: ${params.cvFilename} (${cvSize})`]
    : [
        `Archivo CV subido en la web: ${params.cvFilename} (${cvSize})`,
        'El CV no se adjunta en este email (plan gratuito del servicio).',
        'Contactá al postulante por email o teléfono para solicitar el archivo.',
      ];

  const textBody = [
    `Nueva postulación laboral — ${SITE.name}`,
    '',
    `Nombre: ${params.nombre}`,
    `Teléfono: ${params.telefono}`,
    `Email: ${params.email}`,
    `Localidad: ${params.localidad}`,
    `Puesto: ${puestoLabel}`,
    '',
    ...cvLines,
    '',
    'Presentación / experiencia:',
    params.presentacion,
  ].join('\n');

  const cvHtml = cvAttached
    ? `<p><strong>Archivo CV adjunto:</strong> ${escapeHtml(params.cvFilename)} (${cvSize})</p>`
    : `<p><strong>Archivo CV subido:</strong> ${escapeHtml(params.cvFilename)} (${cvSize})</p>
       <p><em>El CV no viene adjunto en este email. Contactá al postulante para solicitarlo.</em></p>`;

  const htmlBody = `
    <h2>Nueva postulación laboral — ${SITE.name}</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(params.nombre)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(params.telefono)}</p>
    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(params.email)}">${escapeHtml(params.email)}</a></p>
    <p><strong>Localidad:</strong> ${escapeHtml(params.localidad)}</p>
    <p><strong>Puesto:</strong> ${escapeHtml(puestoLabel)}</p>
    ${cvHtml}
    <p><strong>Presentación / experiencia:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(params.presentacion)}</p>
  `;

  return {
    puestoLabel,
    to: getCareersNotifyEmail(),
    subject: `[Postulación] ${puestoLabel} — ${params.nombre}`,
    textBody,
    htmlBody,
  };
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  return (await response.json().catch(() => null)) as Record<string, unknown> | null;
}

/**
 * Web3Forms gratuito: datos del formulario sí, adjuntos NO (feature PRO).
 * No enviar `attachment` — rompe el envío en plan free.
 * Origin/Referer: las keys con dominio restringido rechazan llamadas server-side sin esos headers.
 */
async function sendViaWeb3Forms(params: CareerEmailParams, accessKey: string): Promise<void> {
  const { puestoLabel, subject, textBody } = buildEmailContent(params, { cvAttached: false });

  const body = new FormData();
  body.append('access_key', accessKey);
  body.append('subject', subject);
  body.append('from_name', SITE.name);
  body.append('name', params.nombre);
  body.append('email', params.email);
  body.append('replyto', params.email);
  body.append('phone', params.telefono);
  body.append('localidad', params.localidad);
  body.append('puesto', puestoLabel);
  body.append('message', textBody);
  body.append('botcheck', '');

  const response = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: {
      Origin: SITE_ORIGIN,
      Referer: `${SITE_ORIGIN}/trabaja-con-nosotros`,
    },
    body,
  });

  const result = await readJson(response);
  const success = result?.success === true;
  if (!response.ok || !success) {
    throw new Error(String(result?.message ?? `Web3Forms rechazó el envío (${response.status})`));
  }
}

async function sendViaResend(params: CareerEmailParams, apiKey: string, from: string): Promise<void> {
  const { to, subject, htmlBody, textBody } = buildEmailContent(params);
  const safeFilename = cvAttachmentFilename(params);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: params.email,
      subject,
      html: htmlBody,
      text: textBody,
      attachments: [
        {
          filename: safeFilename,
          content: params.cvBuffer.toString('base64'),
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await readJson(response);
    throw new Error(String(error?.message ?? `Resend rechazó el envío (${response.status})`));
  }
}

/**
 * FormSubmit AJAX: datos sí, archivos no. No redirige al postulante.
 */
async function sendViaFormSubmit(params: CareerEmailParams): Promise<void> {
  const { to, subject, textBody } = buildEmailContent(params, { cvAttached: false });

  const response = await fetch(`https://formsubmit.co/ajax/${to}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: params.nombre,
      email: params.email,
      phone: params.telefono,
      localidad: params.localidad,
      puesto: getCareerPositionLabel(params.puesto),
      _subject: subject,
      message: textBody,
      _template: 'table',
      _captcha: 'false',
    }),
  });

  const result = await readJson(response);
  const success = result?.success === true || result?.success === 'true';
  if (!response.ok || !success) {
    throw new Error(String(result?.message ?? `FormSubmit rechazó el envío (${response.status})`));
  }
}

async function sendViaSmtp(params: CareerEmailParams, config: SmtpConfig): Promise<void> {
  const hasCv = params.cvBuffer.length > 0;
  const { to, subject, textBody, htmlBody } = buildEmailContent(params, { cvAttached: hasCv });
  const safeFilename = cvAttachmentFilename(params);
  const from = process.env.SMTP_FROM?.trim() || config.auth.user;

  const attempts: Array<{ port: number; secure: boolean; requireTLS?: boolean }> = [
    { port: 587, secure: false, requireTLS: true },
    { port: 465, secure: true },
  ];

  let lastError: unknown;

  for (const attempt of attempts) {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: attempt.port,
      secure: attempt.secure,
      auth: config.auth,
      family: 4,
      connectionTimeout: 12_000,
      greetingTimeout: 12_000,
      socketTimeout: 20_000,
      requireTLS: Boolean(attempt.requireTLS),
      tls: { minVersion: 'TLSv1.2' },
    } as nodemailer.TransportOptions);

    try {
      await transporter.sendMail({
        from: `"${SITE.name}" <${from}>`,
        to,
        replyTo: `"${params.nombre}" <${params.email}>`,
        subject,
        text: textBody,
        html: htmlBody,
        ...(hasCv
          ? {
              attachments: [
                {
                  filename: safeFilename,
                  content: params.cvBuffer,
                  contentType: params.cvMimeType,
                },
              ],
            }
          : {}),
      });
      transporter.close();
      return;
    } catch (error) {
      lastError = error;
      transporter.close();
    }
  }

  throw lastError instanceof Error ? lastError : new Error(errorMessage(lastError));
}

async function tryResend(params: CareerEmailParams, errors: string[]): Promise<boolean> {
  const resendKey = getResendKey();
  if (!resendKey || isResendQuotaBlocked()) return false;

  const fromCandidates = [process.env.RESEND_FROM?.trim(), RESEND_TEST_FROM].filter(
    (value, index, list): value is string => Boolean(value) && list.indexOf(value) === index,
  );

  for (const from of fromCandidates) {
    try {
      await sendViaResend(params, resendKey, from);
      return true;
    } catch (error) {
      const message = errorMessage(error);
      console.error(`[mail] Resend (${from}) falló:`, message);
      errors.push(`resend: ${message}`);
      if (isResendQuotaError(message)) {
        blockResendUntilQuotaReset();
        break;
      }
    }
  }

  return false;
}

export async function sendCareerApplicationEmail(params: CareerEmailParams): Promise<void> {
  const errors: string[] = [];

  try {
    await sendViaFormSubmit(params);
    return;
  } catch (error) {
    const message = errorMessage(error);
    console.error('[mail] FormSubmit falló:', message);
    errors.push(`formsubmit: ${message}`);
  }

  const web3Key = getWeb3FormsKey();
  if (web3Key) {
    try {
      await sendViaWeb3Forms(params, web3Key);
      return;
    } catch (error) {
      const message = errorMessage(error);
      console.error('[mail] Web3Forms falló:', message);
      errors.push(`web3forms: ${message}`);
    }
  }

  const smtp = getSmtpConfig();
  if (smtp) {
    try {
      await sendViaSmtp(params, smtp);
      return;
    } catch (error) {
      const message = errorMessage(error);
      console.error('[mail] SMTP falló:', message);
      errors.push(`smtp: ${message}`);
    }
  }

  if (await tryResend(params, errors)) return;

  throw new Error(errors.length ? errors.join(' | ') : 'Email no configurado');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
