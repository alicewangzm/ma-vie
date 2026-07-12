import * as THREE from 'three';

/**
 * Sky-style meadow: one InstancedMesh of little blades, swaying in the
 * vertex shader (per-blade phase, zero per-frame CPU). Blades sit on the
 * spherical hill — the tiny-planet, "non-euclidean" ground the cat roams.
 */

/** Same spherical ground as Environment's hill / the blocks' hillY. */
export function hillHeight(x: number, z: number): number {
  const dx = x;
  const dz = z + 6;
  const f = 1 - (dx * dx + dz * dz) / (42 * 42);
  return -14 + 15 * Math.sqrt(Math.max(f, 0));
}

export class Grass {
  readonly mesh: THREE.InstancedMesh;
  readonly uniforms = {
    uTime: { value: 0 },
    uDream: { value: 0 },
    uFogColor: { value: new THREE.Color('#ecd8e4') },
    uFogDensity: { value: 0.0018 },
  };
  private geometry: THREE.PlaneGeometry;
  private material: THREE.ShaderMaterial;

  constructor(count: number, dreamFactor: { value: number }) {
    this.uniforms.uDream = dreamFactor;
    this.geometry = new THREE.PlaneGeometry(0.16, 0.62, 1, 2);
    this.geometry.translate(0, 0.31, 0);

    const phases = new Float32Array(count);
    for (let i = 0; i < count; i++) phases[i] = Math.random() * Math.PI * 2;
    this.geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1));

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aPhase;
        varying float vTip;
        varying float vFogDepth;
        void main() {
          vTip = position.y / 0.62;
          vec3 p = position;
          // wind: tips lean, roots stay planted
          float sway = sin(uTime * 1.7 + aPhase) * 0.22 + sin(uTime * 0.6 + aPhase * 2.0) * 0.1;
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
        void main() {
          vec3 col = mix(vec3(0.42, 0.58, 0.40), vec3(0.76, 0.88, 0.62), vTip);
          float luma = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(col, vec3(luma), uDream * 0.7);
          float fogK = 1.0 - exp(-uFogDensity * uFogDensity * vFogDepth * vFogDepth);
          col = mix(col, uFogColor, fogK);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, count);
    this.mesh.name = 'grass';

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
      const h = 0.7 + Math.random() * 0.7;
      s.set(1, h, 1);
      m.compose(new THREE.Vector3(x, hillHeight(x, z) - 0.02, z), q, s);
      this.mesh.setMatrixAt(placed, m);
      placed += 1;
    }
    this.mesh.count = placed;
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  update(t: number, fogColor: THREE.Color, fogDensity: number): void {
    this.uniforms.uTime.value = t;
    this.uniforms.uFogColor.value.copy(fogColor);
    this.uniforms.uFogDensity.value = fogDensity;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
