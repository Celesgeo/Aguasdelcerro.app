import nodemailer from 'nodemailer';
import { SITE } from '@/lib/constants';
import { getCareerPositionLabel, type CareerPosition } from '@/lib/careers';
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
  const host = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT ?? '465');

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
}

export type MailProvider = 'resend' | 'web3forms' | 'smtp';

export function isMailConfigured(): boolean {
  return getActiveMailProvider() !== null;
}

/** Proveedor que se usará al enviar (Resend prioriza adjuntos de CV). */
export function getActiveMailProvider(): MailProvider | null {
  if (getResendKey()) return 'resend';
  if (getWeb3FormsKey()) return 'web3forms';
  if (getSmtpConfig()) return 'smtp';
  return null;
}

export function supportsCvEmailAttachment(): boolean {
  const provider = getActiveMailProvider();
  return provider === 'resend' || provider === 'smtp';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        'Contactá al postulante por email o WhatsApp para solicitar el archivo.',
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
    to: process.env.CAREERS_NOTIFY_EMAIL?.trim() || SITE.email,
    subject: `[Postulación] ${puestoLabel} — ${params.nombre}`,
    textBody,
    htmlBody,
  };
}

/**
 * Web3Forms gratuito: datos del formulario sí, adjuntos NO (feature PRO).
 * No enviar `attachment` — rompe el envío en plan free.
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
    body,
  });

  const result = (await response.json()) as { success?: boolean; message?: string };
  if (!response.ok || !result.success) {
    throw new Error(result.message ?? 'Web3Forms rechazó el envío');
  }
}

async function sendViaResend(params: CareerEmailParams, apiKey: string): Promise<void> {
  const { to, subject, htmlBody, textBody } = buildEmailContent(params);
  const safeFilename = sanitizeAttachmentFilename(params.cvFilename);
  const from =
    process.env.RESEND_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    `${SITE.name} <${SITE.email}>`;

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
    const error = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(error?.message ?? 'Resend rechazó el envío');
  }
}

async function sendViaSmtp(params: CareerEmailParams, config: SmtpConfig): Promise<void> {
  const { to, subject, textBody, htmlBody } = buildEmailContent(params);
  const safeFilename = sanitizeAttachmentFilename(params.cvFilename);
  const from = process.env.SMTP_FROM?.trim() || config.auth.user;

  const attempts: Array<{ port: number; secure: boolean; requireTLS?: boolean }> =
    config.port === 465
      ? [{ port: 465, secure: true }, { port: 587, secure: false, requireTLS: true }]
      : [{ port: config.port, secure: config.secure, requireTLS: config.port === 587 }];

  let lastError: unknown;

  for (const attempt of attempts) {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: attempt.port,
      secure: attempt.secure,
      auth: config.auth,
      connectionTimeout: 15_000,
      greetingTimeout: 15_000,
      ...(attempt.requireTLS ? { requireTLS: true } : {}),
      tls: { minVersion: 'TLSv1.2' },
    });

    try {
      await transporter.sendMail({
        from: `"${SITE.name}" <${from}>`,
        to,
        replyTo: `"${params.nombre}" <${params.email}>`,
        subject,
        text: textBody,
        html: htmlBody,
        attachments: [
          {
            filename: safeFilename,
            content: params.cvBuffer,
            contentType: params.cvMimeType,
          },
        ],
      });
      transporter.close();
      return;
    } catch (error) {
      lastError = error;
      transporter.close();
    }
  }

  throw lastError;
}

export async function sendCareerApplicationEmail(params: CareerEmailParams): Promise<void> {
  const resendKey = getResendKey();
  if (resendKey) {
    await sendViaResend(params, resendKey);
    return;
  }

  const web3Key = getWeb3FormsKey();
  if (web3Key) {
    await sendViaWeb3Forms(params, web3Key);
    return;
  }

  const smtp = getSmtpConfig();
  if (smtp) {
    await sendViaSmtp(params, smtp);
    return;
  }

  throw new Error('Email no configurado');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
