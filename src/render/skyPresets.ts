import * as THREE from 'three';
import { theme } from '../theme';
import type { Environment } from './Environment';

/**
 * Time-of-day looks blocks lerp between. `dawn` is the locked look-dev
 * baseline; the others are per-block moods derived from it.
 */
export interface SkyPreset {
  top: string;
  middle: string;
  bottom: string;
  sunTint: string;
  fogColor: string;
  fogDensity: number;
  sunIntensity: number;
}

export const skyPresets = {
  /** Locked look-dev baseline. */
  dawn: {
    top: theme.sky.top,
    middle: theme.sky.middle,
    bottom: theme.sky.bottom,
    sunTint: theme.sky.sunTint,
    fogColor: theme.fog.color,
    fogDensity: theme.fog.density,
    sunIntensity: theme.sun.lightIntensity,
  },
  /** Google block opening: the sun almost rises. */
  preDawnPink: {
    top: '#7d7fb5',
    middle: '#c98ab5',
    bottom: '#ffb3c8',
    sunTint: '#ffe3c2',
    fogColor: '#e3c4d8',
    fogDensity: 0.0022,
    sunIntensity: 1.2,
  },
  /** The storm — heavy and dark, the pink fully swallowed. */
  stormGrey: {
    top: '#3f4654',
    middle: '#565e70',
    bottom: '#787f8d',
    sunTint: '#9599a3',
    fogColor: '#6e7482',
    fogDensity: 0.0042,
    sunIntensity: 0.32,
  },
  /** After the storm: rain easing, light coming back, not sunny yet. */
  afterRain: {
    top: '#7b86a0',
    middle: '#9d9ab4',
    bottom: '#c8b6c4',
    sunTint: '#e8dccc',
    fogColor: '#b0aab8',
    fogDensity: 0.0026,
    sunIntensity: 0.9,
  },
  /** Clouds thicken; the road forward goes soft and white. */
  whiteout: {
    top: '#cfd6e4',
    middle: '#ded8e2',
    bottom: '#efe4e6',
    sunTint: '#fff4e0',
    fogColor: '#e8dee6',
    fogDensity: 0.0055,
    sunIntensity: 0.8,
  },
  /** Constellation chapter: deep dusk, stars readable. */
  dusk: {
    top: '#2c3560',
    middle: '#4a4a7d',
    bottom: '#8c6a96',
    sunTint: '#d3b3d9',
    fogColor: '#5c5878',
    fogDensity: 0.0014,
    sunIntensity: 0.6,
  },
  /** Finale: warm golden send-off. */
  goldenHour: {
    top: '#93b4e8',
    middle: '#c99ab8',
    bottom: '#ffd2a8',
    sunTint: '#fff2cc',
    fogColor: '#ecd8cf',
    fogDensity: 0.0016,
    sunIntensity: 1.8,
  },
} as const satisfies Record<string, SkyPreset>;

export type SkyPresetName = keyof typeof skyPresets;

const _a = new THREE.Color();
const _b = new THREE.Color();

/**
 * Blend the environment toward a preset. k=1 applies it fully; call every
 * frame with a small k (e.g. 1 - exp(-dt)) for a smooth time-of-day drift.
 */
export function lerpEnvToPreset(env: Environment, preset: SkyPreset, k: number): void {
  const u = env.sky.uniforms;
  u.uTop.value.lerp(_a.set(preset.top), k);
  u.uMiddle.value.lerp(_a.set(preset.middle), k);
  u.uBottom.value.lerp(_a.set(preset.bottom), k);
  u.uSunTint.value.lerp(_a.set(preset.sunTint), k);
  env.fog.color.lerp(_b.set(preset.fogColor), k);
  env.setBaseFogDensity(THREE.MathUtils.lerp(env.getBaseFogDensity(), preset.fogDensity, k));
  env.setSunIntensity(THREE.MathUtils.lerp(env.getSunIntensity(), preset.sunIntensity, k));
}
