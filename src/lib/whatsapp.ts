import { SITE } from './constants';

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function buildReservationMessage(data: {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  personas: string;
  fecha: string;
  mensaje?: string;
}): string {
  const lines = [
    'Hola. Quisiera recibir información para reservar una experiencia en Aguas del Cerro.',
    '',
    `Nombre: ${data.nombre} ${data.apellido}`,
    `Email: ${data.email}`,
    `Teléfono: ${data.telefono}`,
    `Personas: ${data.personas}`,
    `Fecha preferida: ${data.fecha}`,
  ];
  if (data.mensaje?.trim()) lines.push(`Mensaje: ${data.mensaje.trim()}`);
  return lines.join('\n');
}

export function buildMembershipMessage(data: {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  membresia: string;
  empresa?: string;
  mensaje?: string;
}): string {
  const lines = [
    'Hola. Quisiera consultar por una membresía de Aguas del Cerro.',
    '',
    `Nombre: ${data.nombre} ${data.apellido}`,
    `Email: ${data.email}`,
    `Teléfono: ${data.telefono}`,
    `Membresía de interés: ${data.membresia}`,
  ];
  if (data.empresa?.trim()) lines.push(`Empresa: ${data.empresa.trim()}`);
  if (data.mensaje?.trim()) lines.push(`Mensaje: ${data.mensaje.trim()}`);
  return lines.join('\n');
}

export const WHATSAPP_PRIMARY_URL = buildWhatsAppUrl(
  SITE.whatsappPrimary,
  'Hola. Quisiera recibir información para reservar una experiencia en Aguas del Cerro.'
);

export const WHATSAPP_SECONDARY_URL = buildWhatsAppUrl(
  SITE.whatsappSecondary,
  'Hola. Quisiera recibir información para reservar una experiencia en Aguas del Cerro.'
);
