import * as THREE from 'three';
import { radialTexture } from './textures';

export interface Wisp {
  sprite: THREE.Sprite;
  /** Pulse phase offset so fields of wisps don't blink in sync. */
  phase: number;
  baseScale: number;
  baseOpacity: number;
  dispose(): void;
}

/**
 * A soft glowing light — guide beacon, milestone, memory point. Additive
 * sprite the bloom pass catches. Gold = reality, faded blue = envisioned.
 */
export function createWisp(color: THREE.ColorRepresentation, scale = 3, opacity = 0.9): Wisp {
  const c = new THREE.Color(color);
  const rgb = `${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)}`;
  const tex = radialTexture([
    [0.0, `rgba(255,255,255,${opacity})`],
    [0.25, `rgba(${rgb},${0.75 * opacity})`],
    [1.0, `rgba(${rgb},0)`],
  ]);
  const mat = new THREE.SpriteMaterial({
    map: tex,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    opacity,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.setScalar(scale);
  return {
    sprite,
    phase: Math.random() * Math.PI * 2,
    baseScale: scale,
    baseOpacity: opacity,
    dispose() {
      tex.dispose();
      mat.dispose();
    },
  };
}

/** Gentle breathing pulse; call per frame. */
export function pulseWisp(w: Wisp, t: number, amount = 0.12): void {
  const s = 1 + Math.sin(t * 1.6 + w.phase) * amount;
  w.sprite.scale.setScalar(w.baseScale * s);
  const mat = w.sprite.material;
  mat.opacity = w.baseOpacity * (1 + Math.sin(t * 1.1 + w.phase) * amount * 0.6);
}
