/** Medios reales del Parque Térmico — foto de portada del predio. */
export const TERMAS_HERO_IMAGE = '/images/termas/termas-portada.jpg';
export const TERMAS_OVERVIEW_IMAGE = '/images/termas/termas-overview.jpg';
export const TERMAS_VIP_IMAGE = '/images/termas/termas-overview.jpg';

export function getTermasMedia() {
  return {
    hero: TERMAS_HERO_IMAGE,
    overview: TERMAS_OVERVIEW_IMAGE,
    vip: TERMAS_VIP_IMAGE,
    poster: TERMAS_HERO_IMAGE,
  };
}
