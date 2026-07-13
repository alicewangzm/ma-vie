import * as THREE from 'three';
import { theme } from '../theme';
import type { Transition } from '../core/Director';

const DURATION = 1.9; // seconds each way — fast enough to cut, slow enough to read as clouds

/**
 * Fullscreen cloud-wipe between story blocks: procedural fbm clouds roll in
 * from the frame edges, cover, then part again. Rendered as an NDC quad in
 * its own scene, on top of the composed frame.
 */
export class CloudWipe implements Transition {
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private material: THREE.ShaderMaterial;
  private geometry: THREE.PlaneGeometry;
  // boot fully covered: the world is first revealed by clouds parting
  private progress = 1; // 0 open, 1 covered
  private target = 1;
  private resolve: (() => void) | null = null;

  constructor(reducedMotion: boolean) {
    this.geometry = new THREE.PlaneGeometry(2, 2);
    this.material = new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uProgress: { value: 1 },
        uTime: { value: 0 },
        uTint: { value: new THREE.Color(theme.fog.color) },
        uReduced: { value: reducedMotion ? 1 : 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uProgress, uTime, uReduced;
        uniform vec3 uTint;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1, 0)), f.x),
            mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x),
            f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p *= 2.1;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          if (uProgress <= 0.001) discard;
          float n = fbm(vUv * 3.0 + vec2(uTime * 0.04, 0.0));
          float d = distance(vUv, vec2(0.5));
          // clouds roll in from the edges toward the center
          float cover = uProgress * 1.7;
          float a = smoothstep(0.0, 0.25, cover - (1.0 - d) - n * 0.4);
          // reduced motion: plain crossfade, no rolling shapes
          a = mix(a, uProgress, uReduced);
          vec3 col = mix(vec3(1.0), uTint, 0.35 + 0.4 * n);
          gl_FragColor = vec4(col, a);
        }
      `,
    });
    this.scene.add(new THREE.Mesh(this.geometry, this.material));
  }

  close(): Promise<void> {
    return this.animateTo(1);
  }

  open(): Promise<void> {
    return this.animateTo(0);
  }

  private animateTo(target: number): Promise<void> {
    this.resolve?.(); // settle any dangling promise
    this.target = target;
    return new Promise((res) => {
      this.resolve = res;
    });
  }

  /** Advance the tween; call every frame from the main loop. */
  update(dt: number, t: number): void {
    this.material.uniforms.uTime.value = t;
    const dir = Math.sign(this.target - this.progress);
    if (dir !== 0) {
      this.progress = THREE.MathUtils.clamp(this.progress + (dt / DURATION) * dir, 0, 1);
      // ease the tween so the reveal breathes instead of flashing past
      const p = this.progress;
      this.material.uniforms.uProgress.value = p * p * (3 - 2 * p);
      if (this.progress === this.target && this.resolve) {
        const res = this.resolve;
        this.resolve = null;
        res();
      }
    }
  }

  /** Draw on top of the composed frame (autoClear must stay off). */
  render(renderer: THREE.WebGLRenderer): void {
    if (this.progress <= 0.001) return;
    renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
