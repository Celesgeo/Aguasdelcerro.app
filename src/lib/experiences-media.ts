import { EXPERIENCES } from '@/lib/constants';

/** Imágenes editoriales HD por experiencia (generadas a partir del material real). */
export const EXPERIENCE_IMAGES: Record<(typeof EXPERIENCES)[number]['slug'], string> = {
  relax: '/images/real/real-termas-luz-calida.jpg',
  naturaleza: '/images/real/real-cardon-noche-cielo.jpg',
  fotografia: '/images/real/real-cardon-ciudad-noche.jpg',
  senderismo: '/images/real/real-mirador-sierras.jpg',
  gastronomia: '/images/real/real-evento-mirador-noche.jpg',
  atardeceres: '/images/real/real-atardecer-parque.jpg',
  descanso: '/images/real/real-spa-masajes-hombros.jpg',
};

export function getExperienceImage(slug: string): string {
  return EXPERIENCE_IMAGES[slug as keyof typeof EXPERIENCE_IMAGES] ?? '/images/real/real-termas-luz-calida.jpg';
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
export const EXPERIENCES_HERO = '/images/real/real-cardon-ciudad-noche.jpg';
