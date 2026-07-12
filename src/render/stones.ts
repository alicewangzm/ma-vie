import * as THREE from 'three';
import { hillHeight } from './grass';

/**
 * Stone road: staggered flat stones instanced along a path over the
 * spherical ground. One draw call per road; shared by the Environment's
 * main road and the Three Roads chapter's branches.
 */
export interface StonePath {
  mesh: THREE.InstancedMesh;
  dispose(): void;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);

export function createStonePath(
  from: THREE.Vector3,
  to: THREE.Vector3,
  opts: { stonesPerMeter?: number; width?: number; color?: THREE.ColorRepresentation } = {},
): StonePath {
  const { stonesPerMeter = 0.9, width = 1.6, color = 0xb9b2c4 } = opts;
  const length = from.distanceTo(to);
  const count = Math.max(4, Math.round(length * stonesPerMeter) * 2);

  const geometry = new THREE.CylinderGeometry(0.52, 0.6, 0.14, 7);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = 'stone-path';

  const dir = to.clone().sub(from);
  dir.y = 0;
  const side = new THREE.Vector3(-dir.z, 0, dir.x).normalize();

  for (let i = 0; i < count; i++) {
    const k = Math.floor(i / 2) / Math.max(count / 2 - 1, 1);
    const lateral = (i % 2 === 0 ? -1 : 1) * (width / 4) + (Math.random() - 0.5) * 0.35;
    const p = from
      .clone()
      .lerp(to, k)
      .addScaledVector(side, lateral)
      .add(new THREE.Vector3((Math.random() - 0.5) * 0.3, 0, (Math.random() - 0.5) * 0.3));
    p.y = hillHeight(p.x, p.z) + 0.02;
    _q.setFromAxisAngle(_up, Math.random() * Math.PI);
    const s = 0.75 + Math.random() * 0.5;
    _m.compose(p, _q, new THREE.Vector3(s, 1, s * (0.8 + Math.random() * 0.4)));
    mesh.setMatrixAt(i, _m);
  }
  mesh.instanceMatrix.needsUpdate = true;

  return {
    mesh,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
