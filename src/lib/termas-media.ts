/** Medios reales del Parque Térmico — fotos del predio + video sin audio. */
export const TERMAS_VIDEO = '/videos/termas-portada.mp4';
export const TERMAS_HERO_IMAGE = '/images/termas/termas-hero.jpg';
export const TERMAS_OVERVIEW_IMAGE = '/images/termas/termas-overview.jpg';
export const TERMAS_VIP_IMAGE = '/images/termas/termas-overview.jpg';

export function getTermasMedia() {
  return {
    video: TERMAS_VIDEO,
    hero: TERMAS_HERO_IMAGE,
    overview: TERMAS_OVERVIEW_IMAGE,
    vip: TERMAS_VIP_IMAGE,
    poster: TERMAS_HERO_IMAGE,
  };
}
