/** Medios editoriales del Parque Térmico — fotos HD + video optimizado. */
export const TERMAS_VIDEO = '/videos/termas-piletas.mp4';
export const TERMAS_HERO_IMAGE = '/images/termas/termas-hero.jpg';
export const TERMAS_OVERVIEW_IMAGE = '/images/termas/termas-overview.jpg';
export const TERMAS_VIP_IMAGE = '/images/termas/termas-vip.jpg';

export function getTermasMedia() {
  return {
    video: TERMAS_VIDEO,
    hero: TERMAS_HERO_IMAGE,
    overview: TERMAS_OVERVIEW_IMAGE,
    vip: TERMAS_VIP_IMAGE,
    poster: TERMAS_HERO_IMAGE,
  };
}
