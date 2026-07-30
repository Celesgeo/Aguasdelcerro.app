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

/** Prefer HD assets; skip low-res duplicates when an -hd version exists. */
function preferHd(filenames: string[]): string[] {
  const hdBases = new Set(
    filenames
      .filter((f) => f.toLowerCase().includes('-hd.'))
      .map((f) => f.toLowerCase().replace(/-hd\./, '.')),
  );
  return filenames.filter((f) => {
    const lower = f.toLowerCase();
    if (lower.includes('-hd.')) return true;
    return !hdBases.has(lower);
  });
}

function classifyImage(filename: string): MediaCategory {
  const n = filename.toLowerCase();
  if (n.includes('logo')) return 'logo';
  if (
    n.includes('termas') ||
    n.includes('piscina') ||
    n.includes('vip') ||
    n.includes('colina') ||
    n.includes('lujo-montana')
  ) {
    return 'termas';
  }
  if (n.includes('mirador')) return 'mirador';
  if (n.includes('cactus') || n.includes('luna') || n.includes('paisaje')) return 'paisajes';
  if (n.includes('atardecer') || n.includes('sunset') || n.includes('nocturna') || n.includes('experiencia-atardecer')) {
    return 'atardeceres';
  }
  if (n.includes('restaurante') || n.includes('gastro')) return 'restaurante';
  if (n.includes('montana') || n.includes('montaña')) return 'paisajes';
  if (n.includes('naturaleza') || n.includes('nature')) return 'naturaleza';
  return 'experiencia';
}

function altFromFilename(filename: string, category: MediaCategory): string {
  const n = filename.toLowerCase();
  if (n.includes('cactus') || n.includes('luna')) {
    return 'Paisaje riojano con cactus y luna en La Rioja';
  }
  if (n.includes('vip')) {
    return 'Sector VIP con deck de madera y cama Bali';
  }
  if (n.includes('colina')) {
    return 'Piletas privadas en la colina al anochecer';
  }
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
  if (n.includes('-hd.') || n.includes('terminada') || n.includes('premium')) return 'landscape';
  if (n.includes('vertical') || n.includes('portrait') || n.includes('mirador-atardecer.png') || n.includes('termas-piscina')) {
    return 'portrait';
  }
  if (n.includes('logo')) return 'square';
  return 'landscape';
}

function readDirSafe(dir: string): string[] {
  try {
    return fs.readdirSync(dir).filter((f) => !f.startsWith('.'));
  } catch {
    return [];
  }
}

export function getImages(): MediaImage[] {
  const dir = path.join(process.cwd(), 'public', 'images');
  return preferHd(readDirSafe(dir))
    .filter((f) => IMAGE_EXT.has(path.extname(f).toLowerCase()))
    .map((filename) => {
      const category = classifyImage(filename);
      return {
        src: `/images/${filename}`,
        filename,
        category,
        alt: altFromFilename(filename, category),
        orientation: guessOrientation(filename),
      };
    });
}

export function getVideos(): MediaVideo[] {
  const dir = path.join(process.cwd(), 'public', 'videos');
  return readDirSafe(dir)
    .filter((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))
    .map((filename) => ({
      src: `/videos/${filename}`,
      filename,
      alt: 'Video Aguas del Cerro',
    }));
}

export function getImagesByCategory(category: MediaCategory): MediaImage[] {
  const images = getImages().filter((img) => img.category === category);
  if (category === 'termas') {
    return images.sort((a, b) => {
      const score = (f: string) => {
        if (f.includes('colina')) return 0;
        if (f.includes('terminada')) return 1;
        if (f.includes('vip')) return 2;
        return 3;
      };
      return score(a.filename) - score(b.filename);
    });
  }
  return images;
}

export function getHeroMedia() {
  const videos = getVideos();
  const images = getImages().filter((i) => i.category !== 'logo');

  const mirador =
    images.find((i) => i.filename.includes('mirador-atardecer-hd')) ??
    images.find((i) => i.category === 'mirador' && i.orientation === 'landscape');
  const termas =
    images.find((i) => i.filename.includes('colina')) ??
    images.find((i) => i.category === 'termas');
  const paisaje =
    images.find((i) => i.filename.includes('cactus')) ??
    images.find((i) => i.category === 'paisajes');

  const slides: HeroSlide[] = [
    mirador && {
      src: mirador.src,
      alt: mirador.alt,
      // Pavilion sits mid-low; keep full facade + warm lights in the crop
      position: 'center 58%',
    },
    termas && {
      src: termas.src,
      alt: termas.alt,
      position: 'center 48%',
    },
    paisaje && {
      src: paisaje.src,
      alt: paisaje.alt,
      // Keep moon (left) and cactus (right) in frame on tall viewports
      position: 'center 42%',
    },
  ].filter(Boolean) as HeroSlide[];

  const fallbackImage =
    slides[0]?.src ??
    images.find((i) => i.orientation === 'landscape')?.src ??
    images[0]?.src ??
    '/images/mirador-atardecer-hd.png';

  return {
    video: videos[0]?.src ?? null,
    fallbackImage,
    slides,
  };
}

export function getGalleryImages(): MediaImage[] {
  return getImages().filter((i) => i.category !== 'logo');
}
