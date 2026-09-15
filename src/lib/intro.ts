/**
 * Intro cinematográfica de la home.
 *
 * Duración total ≈ INTRO_HOLD_MS + INTRO_REVEAL_MS (~3 s).
 * Para desactivarla, poné INTRO_ENABLED en false.
 */
export const INTRO_ENABLED = true;

/** Tiempo con la escena visible. */
export const INTRO_HOLD_MS = 2200;

/** Fundido hacia el hero. */
export const INTRO_REVEAL_MS = 800;

export const INTRO_DONE_MS = INTRO_HOLD_MS + INTRO_REVEAL_MS;

export const INTRO_REDUCED_HOLD_MS = 700;
export const INTRO_REDUCED_REVEAL_MS = 450;
