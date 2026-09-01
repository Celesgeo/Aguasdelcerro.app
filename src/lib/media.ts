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
  /** Fotos reales del cliente (prioridad en hero y galería). */
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

const IMAGE_DIRS = [
  { dir: 'real', urlPrefix: '/images/real' },
  { dir: 'nuevas', urlPrefix: '/images/nuevas' },
  { dir: '', urlPrefix: '/images' },
] as const;

const VIDEO_DIRS = [
  { dir: 'nuevos', urlPrefix: '/videos/nuevos' },
  { dir: '', urlPrefix: '/videos' },
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
  if (
    n.includes('termas') ||
    n.includes('vip') ||
    n.includes('colina') ||
    n.includes('lujo-montana')
  ) {
    return 'termas';
  }
  if (n.includes('restaurante') || n.includes('gastro')) return 'restaurante';
  if (n.includes('montana') || n.includes('montaña')) return 'paisajes';
  if (n.includes('naturaleza') || n.includes('nature')) return 'naturaleza';
  return 'experiencia';
}

function altFromFilename(filename: string, category: MediaCategory): string {
  const n = filename.toLowerCase();
  if (n.includes('real-cartel')) return 'Cartel iluminado de Aguas del Cerro de noche';
  if (n.includes('real-evento')) return 'Evento nocturno en el mirador con vista a la ciudad';
  if (n.includes('real-termas') || n.includes('piletas')) return 'Piletas térmicas de piedra en Aguas del Cerro';
  if (n.includes('real-naturaleza') || n.includes('lechuza')) return 'Fauna y naturaleza de La Rioja';
  if (n.includes('real-atardecer')) return 'Atardecer en las montañas riojanas';
  if (n.includes('cactus') || n.includes('luna')) {
    return 'Paisaje riojano con cactus y luna en La Rioja';
  }
  if (n.includes('vip')) return 'Sector VIP con deck de madera y cama Bali';
  if (n.includes('colina')) return 'Piletas privadas en la colina al anochecer';

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
  if (n.includes('real-naturaleza') || n.includes('real-termas') || n.includes('real-atardecer')) {
    return 'portrait';
  }
  if (n.includes('real-cartel') || n.includes('real-evento') || n.includes('-hd.')) return 'landscape';
  if (n.includes('mirador-atardecer.png') || n.includes('termas-piscina')) return 'portrait';
  return 'landscape';
}

function realPhotoScore(filename: string): number {
  const n = filename.toLowerCase();
  if (n.startsWith('real-')) return 0;
  if (n.includes('-hd.')) return 2;
  return 1;
}

export function getImages(): MediaImage[] {
  const publicRoot = path.join(process.cwd(), 'public', 'images');
  const items: MediaImage[] = [];

  for (const { dir, urlPrefix } of IMAGE_DIRS) {
    const absolute = dir ? path.join(publicRoot, dir) : publicRoot;
    for (const filename of readDirSafe(absolute)) {
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

  return items.sort((a, b) => realPhotoScore(a.filename) - realPhotoScore(b.filename));
}

export function getVideos(): MediaVideo[] {
  const publicRoot = path.join(process.cwd(), 'public', 'videos');
  const videos: MediaVideo[] = [];

  for (const { dir, urlPrefix } of VIDEO_DIRS) {
    const absolute = dir ? path.join(publicRoot, dir) : publicRoot;
    for (const filename of readDirSafe(absolute)) {
      if (filename === 'LEEME.txt') continue;
      if (!VIDEO_EXT.has(path.extname(filename).toLowerCase())) continue;
      videos.push({
        src: `${urlPrefix}/${filename}`,
        filename,
        alt: 'Video Aguas del Cerro',
      });
    }
  }

  return videos;
}

export function getImagesByCategory(category: MediaCategory): MediaImage[] {
  return getImages().filter((img) => img.category === category);
}

function pickImage(
  images: MediaImage[],
  predicate: (img: MediaImage) => boolean,
  fallback?: string,
): MediaImage | undefined {
  return images.find(predicate) ?? (fallback ? images.find((i) => i.src.includes(fallback)) : undefined);
}

export function getHeroMedia() {
  const videos = getVideos();
  const images = getImages().filter((i) => i.category !== 'logo');

  const miradorEvento = pickImage(images, (i) => i.filename.includes('real-evento'));
  const miradorCartel = pickImage(images, (i) => i.filename.includes('real-cartel'));
  const termas = pickImage(images, (i) => i.filename.includes('real-termas'));
  const atardecer = pickImage(images, (i) => i.filename.includes('real-atardecer'));
  const naturaleza = pickImage(images, (i) => i.filename.includes('real-naturaleza'));

  const slides: HeroSlide[] = [
    miradorEvento && {
      src: miradorEvento.src,
      alt: miradorEvento.alt,
      position: 'center 55%',
    },
    miradorCartel && {
      src: miradorCartel.src,
      alt: miradorCartel.alt,
      position: 'center 58%',
    },
    termas && {
      src: termas.src,
      alt: termas.alt,
      position: 'center 45%',
    },
    atardecer && {
      src: atardecer.src,
      alt: atardecer.alt,
      position: 'center 40%',
    },
    naturaleza && {
      src: naturaleza.src,
      alt: naturaleza.alt,
      position: 'center 50%',
    },
  ].filter(Boolean) as HeroSlide[];

  const fallbackImage =
    slides[0]?.src ??
    images.find((i) => i.isReal)?.src ??
    images[0]?.src ??
    '/images/real/real-evento-mirador-noche.jpg';

  return {
    video: videos[0]?.src ?? null,
    fallbackImage,
    slides,
  };
}

export function getGalleryImages(): MediaImage[] {
  const images = getImages().filter((i) => i.category !== 'logo');
  const real = images.filter((i) => i.isReal);
  return real.length > 0 ? real : images;
}
