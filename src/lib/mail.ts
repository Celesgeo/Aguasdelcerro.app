import nodemailer from 'nodemailer';
import { SITE } from '@/lib/constants';
import { getCareerPositionLabel, type CareerPosition } from '@/lib/careers';

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string };
};

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  const port = Number(process.env.SMTP_PORT ?? '587');
  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  };
}

export function isMailConfigured(): boolean {
  return getSmtpConfig() !== null;
}

export async function sendCareerApplicationEmail(params: {
  nombre: string;
  telefono: string;
  email: string;
  localidad: string;
  puesto: CareerPosition;
  presentacion: string;
  cvBuffer: Buffer;
  cvFilename: string;
  cvMimeType: string;
}): Promise<void> {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error('SMTP no configurado');
  }

  const to = process.env.CAREERS_NOTIFY_EMAIL?.trim() || SITE.email;
  const from = process.env.SMTP_FROM?.trim() || config.auth.user;
  const puestoLabel = getCareerPositionLabel(params.puesto);

  const transporter = nodemailer.createTransport(config);

  const textBody = [
    `Nueva postulación laboral — ${SITE.name}`,
    '',
    `Nombre: ${params.nombre}`,
    `Teléfono: ${params.telefono}`,
    `Email: ${params.email}`,
    `Localidad: ${params.localidad}`,
    `Puesto: ${puestoLabel}`,
    '',
    'Presentación / experiencia:',
    params.presentacion,
  ].join('\n');

  const htmlBody = `
    <h2>Nueva postulación laboral — ${SITE.name}</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(params.nombre)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(params.telefono)}</p>
    <p><strong>Email:</strong> <a href="mailto:${escapeHtml(params.email)}">${escapeHtml(params.email)}</a></p>
    <p><strong>Localidad:</strong> ${escapeHtml(params.localidad)}</p>
    <p><strong>Puesto:</strong> ${escapeHtml(puestoLabel)}</p>
    <p><strong>Presentación / experiencia:</strong></p>
    <p style="white-space:pre-wrap">${escapeHtml(params.presentacion)}</p>
  `;

  await transporter.sendMail({
    from: `"${SITE.name}" <${from}>`,
    to,
    replyTo: `"${params.nombre}" <${params.email}>`,
    subject: `[Postulación] ${puestoLabel} — ${params.nombre}`,
    text: textBody,
    html: htmlBody,
    attachments: [
      {
        filename: params.cvFilename,
        content: params.cvBuffer,
        contentType: params.cvMimeType,
      },
    ],
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
