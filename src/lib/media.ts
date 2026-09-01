import fs from 'fs';
import path from 'path';

export type MediaCategory =
  | 'termas'
  | 'naturaleza'
  | 'mirador'
  | 'restaurante'
  | 'paisajes'
  | 'gastronomia'
  | 'atardeceres'
  | 'logo'
  | 'experiencia';

export interface MediaImage {
  src: string;
  filename: string;
  category: MediaCategory;
  alt: string;
  orientation: 'landscape' | 'portrait' | 'square';
  isReal?: boolean;
}

export interface MediaVideo {
  src: string;
  filename: string;
  alt: string;
}

export interface HeroSlide {
  src: string;
  alt: string;
  position?: string;
}

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov']);

/** Video principal del hero (optimizado para web). */
export const HERO_VIDEO = '/videos/hero-noche.mp4';

const IMAGE_DIRS = [
  { dir: 'real', urlPrefix: '/images/real' },
  { dir: 'nuevas', urlPrefix: '/images/nuevas' },
  { dir: '', urlPrefix: '/images' },
] as const;

function readDirSafe(dir: string): string[] {
  try {
    return fs.readdirSync(dir).filter((f) => !f.startsWith('.') && !f.startsWith('_'));
  } catch {
    return [];
  }
}

function classifyImage(filename: string): MediaCategory {
  const n = filename.toLowerCase();
  if (n.includes('logo')) return 'logo';
  if (n.includes('real-termas') || n.includes('piletas') || n.includes('piscina')) return 'termas';
  if (n.includes('real-cartel') || n.includes('real-evento') || n.includes('mirador')) return 'mirador';
  if (n.includes('real-naturaleza') || n.includes('lechuza')) return 'naturaleza';
  if (n.includes('real-atardecer') || n.includes('atardecer') || n.includes('sunset')) return 'atardeceres';
  if (n.includes('cactus') || n.includes('luna') || n.includes('paisaje')) return 'paisajes';
  if (n.includes('termas') || n.includes('vip') || n.includes('colina')) return 'termas';
  if (n.includes('restaurante') || n.includes('gastro')) return 'restaurante';
  if (n.includes('montana') || n.includes('montaña')) return 'naturaleza';
  if (n.includes('naturaleza') || n.includes('nature')) return 'naturaleza';
  return 'experiencia';
}

function altFromFilename(filename: string, category: MediaCategory): string {
  const n = filename.toLowerCase();
  if (n.includes('real-cartel')) return 'Cartel iluminado de Aguas del Cerro de noche';
  if (n.includes('real-evento')) return 'Mirador nocturno con vista a la ciudad de La Rioja';
  if (n.includes('real-termas') || n.includes('piletas')) return 'Piletas térmicas de piedra en Aguas del Cerro';
  if (n.includes('real-naturaleza') || n.includes('lechuza')) return 'Fauna y naturaleza de La Rioja';
  if (n.includes('real-atardecer')) return 'Atardecer en las montañas riojanas';

  const map: Record<MediaCategory, string> = {
    logo: 'Logo Aguas del Cerro',
    termas: 'Parque térmico en La Rioja',
    mirador: 'Mirador gastronómico con vista a las montañas',
    atardeceres: 'Atardecer en Aguas del Cerro',
    restaurante: 'Experiencia gastronómica regional',
    gastronomia: 'Gastronomía de montaña',
    paisajes: 'Paisajes de La Rioja',
    naturaleza: 'Naturaleza y montañas',
    experiencia: 'Experiencia Aguas del Cerro',
  };
  return map[category] ?? 'Aguas del Cerro';
}

function guessOrientation(filename: string): 'landscape' | 'portrait' | 'square' {
  const n = filename.toLowerCase();
  if (n.includes('logo')) return 'square';
  if (n.includes('real-cartel') || n.includes('real-termas') || n.includes('real-naturaleza') || n.includes('real-atardecer')) {
    return 'portrait';
  }
  if (n.includes('real-evento')) return 'landscape';
  return 'landscape';
}

export function getImages(): MediaImage[] {
  const publicRoot = path.join(process.cwd(), 'public', 'images');
  const items: MediaImage[] = [];

  for (const { dir, urlPrefix } of IMAGE_DIRS) {
    const absolute = dir ? path.join(publicRoot, dir) : publicRoot;
    for (const filename of readDirSafe(absolute)) {
      if (filename === 'LEEME.txt') continue;
      if (!IMAGE_EXT.has(path.extname(filename).toLowerCase())) continue;
      const category = classifyImage(filename);
      items.push({
        src: `${urlPrefix}/${filename}`,
        filename,
        category,
        alt: altFromFilename(filename, category),
        orientation: guessOrientation(filename),
        isReal: filename.toLowerCase().startsWith('real-') || dir === 'real' || dir === 'nuevas',
      });
    }
  }

  return items;
}

export function getVideos(): MediaVideo[] {
  const dir = path.join(process.cwd(), 'public', 'videos');
  return readDirSafe(dir)
    .filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))
    .map((filename) => ({
      src: `/videos/${filename}`,
      filename,
      alt: filename.includes('piletas') ? 'Piletas térmicas Aguas del Cerro' : 'Video nocturno Aguas del Cerro',
    }));
}

export function getImagesByCategory(category: MediaCategory): MediaImage[] {
  return getImages().filter((img) => img.category === category);
}

function pickImage(images: MediaImage[], predicate: (img: MediaImage) => boolean): MediaImage | undefined {
  return images.find(predicate);
}

export function getHeroMedia() {
  const images = getImages().filter((i) => i.category !== 'logo');
  const heroVideoPath = path.join(process.cwd(), 'public', HERO_VIDEO);
  const video = fs.existsSync(heroVideoPath) ? HERO_VIDEO : getVideos()[0]?.src ?? null;

  const cartel = pickImage(images, (i) => i.filename.includes('real-cartel'));
  const evento = pickImage(images, (i) => i.filename.includes('real-evento'));
  const termas = pickImage(images, (i) => i.filename.includes('real-termas'));
  const atardecer = pickImage(images, (i) => i.filename.includes('real-atardecer'));
  const naturaleza = pickImage(images, (i) => i.filename.includes('real-naturaleza'));

  const slides: HeroSlide[] = [
    cartel && { src: cartel.src, alt: cartel.alt, position: 'center 55%' },
    evento && { src: evento.src, alt: evento.alt, position: 'center 55%' },
    termas && { src: termas.src, alt: termas.alt, position: 'center 42%' },
    atardecer && { src: atardecer.src, alt: atardecer.alt, position: 'center 40%' },
    naturaleza && { src: naturaleza.src, alt: naturaleza.alt, position: 'center 50%' },
  ].filter(Boolean) as HeroSlide[];

  const fallbackImage =
    cartel?.src ??
    evento?.src ??
    slides[0]?.src ??
    '/images/real/real-cartel-noche.jpg';

  return { video, fallbackImage, slides };
}

export function getGalleryImages(): MediaImage[] {
  return getImages().filter((i) => i.category !== 'logo' && i.isReal);
}

/** Imagen principal por sección (fotos reales de mayor impacto). */
export function getSectionMedia() {
  const images = getImages();
  const by = (name: string) => images.find((i) => i.filename.includes(name))?.src;

  return {
    termas: by('real-termas') ?? '/images/real/real-termas-piletas.jpg',
    mirador: by('real-evento') ?? '/images/real/real-evento-mirador-noche.jpg',
    experiencia: by('real-atardecer') ?? '/images/real/real-atardecer-montana.jpg',
    naturaleza: by('real-naturaleza') ?? '/images/real/real-naturaleza-lechuza.jpg',
    cartel: by('real-cartel') ?? '/images/real/real-cartel-noche.jpg',
  };
}
