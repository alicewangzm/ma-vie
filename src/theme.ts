/**
 * Locked look-dev values ("LOOK LOCKED", 2026-07-11).
 * Source of truth for the whole experience — tuned live in lookdev.html.
 * Per-block overrides (e.g. the Google storm) lerp *from* these values.
 */
export const theme = {
  sky: {
    top: '#a8c8f0', // powder blue
    middle: '#8c83b9', // dusk lavender
    bottom: '#ffc2d4', // soft pink
    sunTint: '#fff0d0',
    sunTintFalloff: 3.0,
  },
  sun: {
    azimuth: 25, // degrees around Y
    elevation: 12, // degrees above horizon
    haloSize: 140,
    haloIntensity: 1.0,
    lightIntensity: 1.6,
    lightColor: '#ffe8c8',
  },
  fog: {
    color: '#ecd8e4',
    density: 0.0018,
  },
  clouds: {
    opacity: 0.26,
    driftSpeed: 1.2,
    scale: 1.0,
    tint: '#ffffff',
  },
  bloom: {
    strength: 0.55,
    radius: 0.5,
    threshold: 0.82,
  },
  letter: {
    glowIntensity: 0.23,
    bobAmplitude: 1.41,
    bobSpeed: 1.21,
    paper: '#fff3c8',
    emissive: '#ffdf8f',
  },
  hill: {
    color: '#c3e1b7',
    fade: 0.0,
  },
} as const;

export type Theme = typeof theme;
