import * as THREE from 'three';
import { theme } from '../theme';

/**
 * Full-screen-ish gradient sky on an inverted sphere.
 * Colors are uniforms so blocks can lerp time-of-day (Google block:
 * pre-sunrise pink → storm grey). dreamFactor desaturates + slow-flickers.
 */
export class Sky {
  readonly mesh: THREE.Mesh;
  readonly uniforms: {
    uTop: { value: THREE.Color };
    uMiddle: { value: THREE.Color };
    uBottom: { value: THREE.Color };
    uSunTint: { value: THREE.Color };
    uSunTintFalloff: { value: number };
    uSunDir: { value: THREE.Vector3 };
    uDream: { value: number };
    uTime: { value: number };
  };
  private geometry: THREE.SphereGeometry;
  private material: THREE.ShaderMaterial;

  constructor(sunDir: THREE.Vector3, dreamFactor: { value: number }) {
    this.uniforms = {
      uTop: { value: new THREE.Color(theme.sky.top) },
      uMiddle: { value: new THREE.Color(theme.sky.middle) },
      uBottom: { value: new THREE.Color(theme.sky.bottom) },
      uSunTint: { value: new THREE.Color(theme.sky.sunTint) },
      uSunTintFalloff: { value: theme.sky.sunTintFalloff },
      uSunDir: { value: sunDir },
      uDream: dreamFactor,
      uTime: { value: 0 },
    };

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uTop, uMiddle, uBottom, uSunTint;
        uniform float uSunTintFalloff, uDream, uTime;
        uniform vec3 uSunDir;
        varying vec3 vDir;
        void main() {
          vec3 dir = normalize(vDir);
          float h = dir.y;
          vec3 col = mix(uBottom, uMiddle, smoothstep(-0.08, 0.22, h));
          col = mix(col, uTop, smoothstep(0.22, 0.85, h));
          float s = max(dot(dir, uSunDir), 0.0);
          col = mix(col, uSunTint, pow(s, uSunTintFalloff) * 0.6);
          // dream state: desaturate + gentle slow flicker
          float luma = dot(col, vec3(0.299, 0.587, 0.114));
          float flicker = 1.0 - 0.06 * uDream * (0.5 + 0.5 * sin(uTime * 2.1));
          col = mix(col, vec3(luma), uDream * 0.7) * flicker;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    this.geometry = new THREE.SphereGeometry(900, 32, 24);
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.name = 'sky';
  }

  update(t: number): void {
    this.uniforms.uTime.value = t;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
