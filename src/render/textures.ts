import * as THREE from 'three';

/** Radial gradient sprite texture (halos, glows). */
export function radialTexture(stops: [number, string][], size = 256): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [t, col] of stops) g.addColorStop(t, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * 3-variant cloud atlas (variants side by side, u ∈ [i/3, (i+1)/3]).
 * Each variant is a cluster of soft radial blobs — the "hand-painted"
 * look-dev clouds, deterministic via seeded PRNG.
 */
export function cloudAtlasTexture(size = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = size * 3;
  c.height = size;
  const ctx = c.getContext('2d')!;

  for (const [variant, seed] of [11, 47, 83].entries()) {
    let s = seed;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const x0 = variant * size;
    const blobs = 10 + Math.floor(rand() * 6);
    for (let i = 0; i < blobs; i++) {
      const bx = x0 + size * (0.28 + rand() * 0.44);
      const by = size * (0.42 + rand() * 0.22);
      const br = size * (0.1 + rand() * 0.14);
      const a = 0.5 + rand() * 0.35;
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(0.6, `rgba(255,255,255,${a * 0.45})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
