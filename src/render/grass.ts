import * as THREE from 'three';

/**
 * Sky-style meadow: instanced blades in varied greens plus a scattering of
 * little flowers, all swaying in the vertex shader (per-instance phase and
 * color, zero per-frame CPU). Everything sits on the spherical hill — the
 * tiny-planet, "non-euclidean" ground the cat roams.
 */

/** Same spherical ground as Environment's hill / the blocks' hillY. */
export function hillHeight(x: number, z: number): number {
  const dx = x;
  const dz = z + 6;
  const f = 1 - (dx * dx + dz * dz) / (42 * 42);
  return -14 + 15 * Math.sqrt(Math.max(f, 0));
}

/** Blade tints — greens with the occasional minty / straw surprise. */
const BLADE_TINTS = ['#6f9a68', '#7fae74', '#8fbc80', '#a5c98e', '#b9d29a', '#8fc4a5'];
/** Flower petals — soft Sky pastels. */
const FLOWER_TINTS = ['#ffd9e8', '#fff3f6', '#ffe9a8', '#d9c9f2', '#ffc9b8'];

interface Patch {
  mesh: THREE.InstancedMesh;
  geometry: THREE.BufferGeometry;
  material: THREE.ShaderMaterial;
}

function makeSwayMaterial(
  uniforms: Grass['uniforms'],
  swayAmount: number,
  tipLightness: number,
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      uniform float uTime;
      attribute float aPhase;
      attribute vec3 aColor;
      varying float vTip;
      varying float vFogDepth;
      varying vec3 vColor;
      void main() {
        vTip = clamp(position.y / 0.62, 0.0, 1.0);
        vColor = aColor;
        vec3 p = position;
        // wind: tips lean, roots stay planted
        float sway = sin(uTime * 1.7 + aPhase) * ${swayAmount.toFixed(2)}
                   + sin(uTime * 0.6 + aPhase * 2.0) * ${(swayAmount * 0.45).toFixed(2)};
        p.x += sway * vTip * vTip;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
        vFogDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uDream, uFogDensity;
      uniform vec3 uFogColor;
      varying float vTip;
      varying float vFogDepth;
      varying vec3 vColor;
      void main() {
        vec3 col = mix(vColor * 0.62, vColor + vec3(${tipLightness.toFixed(2)}), vTip);
        float luma = dot(col, vec3(0.299, 0.587, 0.114));
        col = mix(col, vec3(luma), uDream * 0.7);
        float fogK = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
        col = mix(col, uFogColor, fogK);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
}

export class Grass {
  readonly group = new THREE.Group();
  readonly uniforms = {
    uTime: { value: 0 },
    uDream: { value: 0 },
    uFogColor: { value: new THREE.Color('#ecd8e4') },
    uFogDensity: { value: 0.0018 },
  };
  private patches: Patch[] = [];

  constructor(count: number, dreamFactor: { value: number }) {
    this.uniforms.uDream = dreamFactor;
    this.group.name = 'meadow';

    // blades
    const bladeGeo = new THREE.PlaneGeometry(0.16, 0.62, 1, 2);
    bladeGeo.translate(0, 0.31, 0);
    this.addPatch(bladeGeo, count, BLADE_TINTS, 0.22, 0.14, 0.7, 1.4);

    // little flowers riding the same wind, a touch stiffer
    const flowerGeo = new THREE.CircleGeometry(0.11, 6);
    flowerGeo.translate(0, 0.46, 0);
    this.addPatch(flowerGeo, Math.round(count * 0.09), FLOWER_TINTS, 0.12, 0.22, 0.8, 1.1);
  }

  private addPatch(
    geometry: THREE.BufferGeometry,
    count: number,
    tints: string[],
    swayAmount: number,
    tipLightness: number,
    minH: number,
    maxH: number,
  ): void {
    const phases = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const tint = new THREE.Color();
    for (let i = 0; i < count; i++) {
      phases[i] = Math.random() * Math.PI * 2;
      tint.set(tints[Math.floor(Math.random() * tints.length)]);
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }
    geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));
    geometry.setAttribute('aColor', new THREE.InstancedBufferAttribute(colors, 3));

    const material = makeSwayMaterial(this.uniforms, swayAmount, tipLightness);
    const mesh = new THREE.InstancedMesh(geometry, material, count);

    // scatter on the planet crest, thinning near the stone road (|x| small)
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const s = new THREE.Vector3();
    let placed = 0;
    let guard = 0;
    while (placed < count && guard < count * 30) {
      guard += 1;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 24;
      const x = Math.cos(a) * r;
      const z = -6 + Math.sin(a) * r;
      if (Math.abs(x) < 1.6 && z > -8) continue; // keep the road clear
      q.setFromAxisAngle(up, Math.random() * Math.PI);
      const h = minH + Math.random() * (maxH - minH);
      s.set(1, h, 1);
      m.compose(new THREE.Vector3(x, hillHeight(x, z) - 0.02, z), q, s);
      mesh.setMatrixAt(placed, m);
      placed += 1;
    }
    mesh.count = placed;
    mesh.instanceMatrix.needsUpdate = true;

    this.patches.push({ mesh, geometry, material });
    this.group.add(mesh);
  }

  update(t: number, fogColor: THREE.Color, fogDensity: number): void {
    this.uniforms.uTime.value = t;
    this.uniforms.uFogColor.value.copy(fogColor);
    this.uniforms.uFogDensity.value = fogDensity;
  }

  dispose(): void {
    for (const p of this.patches) {
      p.geometry.dispose();
      p.material.dispose();
    }
  }
}
