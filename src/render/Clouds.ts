import * as THREE from 'three';
import { theme } from '../theme';
import { cloudAtlasTexture } from './textures';

const WRAP_X = 420; // drift wraps at ±this, so the field never empties

/**
 * Layered soft-particle billboard clouds — the deliberate alternative to
 * raymarched volumetrics (see README). One InstancedMesh, one draw call:
 * billboarding, drift and wrap all happen in the vertex shader, so the CPU
 * touches nothing per frame. Fragments fade where they approach opaque
 * geometry (classic soft particles) using the depth prepass texture.
 */
export class Clouds {
  readonly mesh: THREE.InstancedMesh;
  readonly uniforms: {
    uMap: { value: THREE.Texture };
    uDepth: { value: THREE.Texture | null };
    uTime: { value: number };
    uDriftSpeed: { value: number };
    uOpacity: { value: number };
    uTint: { value: THREE.Color };
    uFogColor: { value: THREE.Color };
    uFogDensity: { value: number };
    uSoftness: { value: number };
    uResolution: { value: THREE.Vector2 };
    uCameraNear: { value: number };
    uCameraFar: { value: number };
    uDream: { value: number };
  };
  private geometry: THREE.PlaneGeometry;
  private material: THREE.ShaderMaterial;
  private atlas: THREE.Texture;

  constructor(
    count: number,
    fog: THREE.FogExp2,
    camera: THREE.PerspectiveCamera,
    dreamFactor: { value: number },
  ) {
    this.atlas = cloudAtlasTexture();

    this.uniforms = {
      uMap: { value: this.atlas },
      uDepth: { value: null },
      uTime: { value: 0 },
      uDriftSpeed: { value: theme.clouds.driftSpeed },
      uOpacity: { value: theme.clouds.opacity },
      uTint: { value: new THREE.Color(theme.clouds.tint) },
      uFogColor: { value: fog.color },
      uFogDensity: { value: fog.density },
      uSoftness: { value: 14 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uCameraNear: { value: camera.near },
      uCameraFar: { value: camera.far },
      uDream: dreamFactor,
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      vertexShader: /* glsl */ `
        attribute vec4 aParams; // x drift mult, y phase, z atlas index, w unused
        uniform float uTime, uDriftSpeed;
        varying vec2 vUv;
        varying float vTexIndex;
        varying float vViewZ;
        void main() {
          vec3 ipos = (instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
          float x = ipos.x + uTime * uDriftSpeed * aParams.x;
          ipos.x = mod(x + ${WRAP_X.toFixed(1)}, ${(WRAP_X * 2).toFixed(1)}) - ${WRAP_X.toFixed(1)};
          ipos.y += sin(uTime * 0.3 + aParams.y) * 1.5;
          vec2 scale = vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));
          vec4 mv = modelViewMatrix * vec4(ipos, 1.0);
          mv.xy += position.xy * scale; // view-space billboard
          vUv = uv;
          vTexIndex = aParams.z;
          vViewZ = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform sampler2D uDepth;
        uniform float uOpacity, uSoftness, uFogDensity, uCameraNear, uCameraFar, uDream, uTime;
        uniform vec3 uTint, uFogColor;
        uniform vec2 uResolution;
        varying vec2 vUv;
        varying float vTexIndex;
        varying float vViewZ;

        float linearizeDepth(float z) {
          float ndc = z * 2.0 - 1.0;
          return (2.0 * uCameraNear * uCameraFar) /
                 (uCameraFar + uCameraNear - ndc * (uCameraFar - uCameraNear));
        }

        void main() {
          vec2 uv = vec2((vUv.x + vTexIndex) / 3.0, vUv.y);
          float alpha = texture2D(uMap, uv).a * uOpacity;

          // soft particles: fade out near opaque geometry intersections
          vec2 screenUV = gl_FragCoord.xy / uResolution;
          float sceneZ = linearizeDepth(texture2D(uDepth, screenUV).x);
          alpha *= clamp((sceneZ - vViewZ) / uSoftness, 0.0, 1.0);

          // FogExp2, same curve three.js uses for the rest of the scene
          float fogFactor = 1.0 - exp(-uFogDensity * uFogDensity * vViewZ * vViewZ);
          vec3 col = mix(uTint, uFogColor, fogFactor);

          // dream state: clouds breathe/flicker very slightly
          alpha *= 1.0 - 0.1 * uDream * (0.5 + 0.5 * sin(uTime * 1.7));

          gl_FragColor = vec4(col, alpha);
        }
      `,
    });

    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, count);
    this.mesh.frustumCulled = false; // instances move in the shader
    this.mesh.name = 'clouds';

    // deterministic field, same distribution as the locked look-dev
    let s = 7;
    const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const params = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 55 + rand() * 320;
      const pos = new THREE.Vector3(
        Math.cos(angle) * radius,
        -22 + rand() * 75,
        Math.sin(angle) * radius,
      );
      const w = 40 + rand() * 90;
      m.compose(pos, q, new THREE.Vector3(w, w * (0.35 + rand() * 0.2), 1));
      this.mesh.setMatrixAt(i, m);
      params[i * 4 + 0] = 0.5 + rand() * 1.0; // drift multiplier
      params[i * 4 + 1] = rand() * Math.PI * 2; // phase
      params[i * 4 + 2] = i % 3; // atlas variant
      params[i * 4 + 3] = 0;
    }
    this.geometry.setAttribute('aParams', new THREE.InstancedBufferAttribute(params, 4));
  }

  setDepthTexture(tex: THREE.Texture, width: number, height: number): void {
    this.uniforms.uDepth.value = tex;
    this.uniforms.uResolution.value.set(width, height);
  }

  update(t: number): void {
    this.uniforms.uTime.value = t;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
    this.atlas.dispose();
    this.mesh.dispose();
  }
}
