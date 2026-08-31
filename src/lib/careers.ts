export const CAREERS_POSITIONS = [
  { value: 'cocinero', label: 'Cocinero/a' },
  { value: 'mozo', label: 'Mozo/a' },
  { value: 'limpieza', label: 'Limpieza' },
  { value: 'seguridad', label: 'Seguridad' },
] as const;

export type CareerPosition = (typeof CAREERS_POSITIONS)[number]['value'];

export const CV_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const CV_ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp'] as const;

export const CV_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const CV_EXTENSION_SET = new Set(CV_ALLOWED_EXTENSIONS);

export function getCareerPositionLabel(value: string): string {
  return CAREERS_POSITIONS.find((p) => p.value === value)?.label ?? value;
}

export function isValidCareerPosition(value: string): value is CareerPosition {
  return CAREERS_POSITIONS.some((p) => p.value === value);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

export function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  if (dot < 1) return '';
  return filename.slice(dot).toLowerCase();
}

export function isAllowedCvExtension(ext: string): boolean {
  return CV_EXTENSION_SET.has(ext as (typeof CV_ALLOWED_EXTENSIONS)[number]);
}

/** Firmas mínimas para evitar extensiones falsas. */
export function matchesCvMagicBytes(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 4) return false;

  if (ext === '.pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  if (ext === '.doc') {
    return buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  }

  if (ext === '.docx') {
    return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
  }

  if (ext === '.jpg' || ext === '.jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (ext === '.png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  if (ext === '.webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.length >= 12 &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }

  return false;
}

export interface CareerApplicationRecord {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  localidad: string;
  puesto: CareerPosition;
  presentacion: string;
  cvFilename: string;
  cvOriginalName: string;
  cvSize: number;
  cvMimeType: string;
  ip: string;
  createdAt: string;
}
