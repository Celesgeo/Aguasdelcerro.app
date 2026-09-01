import { EXPERIENCES } from '@/lib/constants';

/** Imágenes editoriales HD por experiencia (generadas a partir del material real). */
export const EXPERIENCE_IMAGES: Record<(typeof EXPERIENCES)[number]['slug'], string> = {
  relax: '/images/experiencias/exp-relax.jpg',
  naturaleza: '/images/experiencias/exp-naturaleza.jpg',
  fotografia: '/images/experiencias/exp-fotografia.jpg',
  senderismo: '/images/experiencias/exp-senderismo.jpg',
  gastronomia: '/images/experiencias/exp-gastronomia.jpg',
  atardeceres: '/images/experiencias/exp-atardeceres.jpg',
  descanso: '/images/experiencias/exp-descanso.jpg',
};

export function getExperienceImage(slug: string): string {
  return EXPERIENCE_IMAGES[slug as keyof typeof EXPERIENCE_IMAGES] ?? '/images/experiencias/exp-relax.jpg';
}

export function getAllExperienceImages(): { slug: string; src: string; title: string; description: string }[] {
  return EXPERIENCES.map((exp) => ({
    slug: exp.slug,
    src: getExperienceImage(exp.slug),
    title: exp.title,
    description: exp.description,
  }));
}

/** Hero editorial de la página Experiencias. */
export const EXPERIENCES_HERO = '/images/experiencias/exp-atardeceres.jpg';
