import * as THREE from 'three';

const RAIN_HEIGHT = 40;

export interface Rain {
  points: THREE.Points;
  uniforms: { uTime: { value: number }; uOpacity: { value: number } };
  dispose(): void;
}

/**
 * GPU rain: falling + wrapping happens in the vertex shader (zero per-frame
 * CPU work); the fragment draws a thin vertical streak in each point sprite.
 * Shared by the storm chapter (heavy) and the Alethea chapter (light drizzle).
 */
export function makeRain(count: number): Rain {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 70;
    positions[i * 3 + 1] = Math.random() * RAIN_HEIGHT;
    positions[i * 3 + 2] = -6 + (Math.random() - 0.5) * 70;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const uniforms = { uTime: { value: 0 }, uOpacity: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      uniform float uTime;
      void main() {
        vec3 p = position;
        p.y = mod(position.y - uTime * 26.0, ${RAIN_HEIGHT.toFixed(1)});
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 90.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      void main() {
        float x = abs(gl_PointCoord.x - 0.5);
        float a = (1.0 - smoothstep(0.02, 0.07, x)) * uOpacity * 0.5;
        if (a < 0.01) discard;
        gl_FragColor = vec4(0.75, 0.8, 0.9, a);
      }
    `,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return {
    points,
    uniforms,
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
