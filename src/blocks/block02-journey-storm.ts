import * as THREE from 'three';
import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { WalkController } from '../core/walk';
import { createWisp, pulseWisp, type Wisp } from '../render/wisp';
import { skyPresets, lerpEnvToPreset } from '../render/skyPresets';
import {
  typewriterLines,
  chapterTitle,
  sideLog,
  type TypewriterHandle,
  type OverlayHandle,
  type SideLogHandle,
} from '../ui/overlay';
import { block02Content } from '../content/block02';

const WALK_CENTER = new THREE.Vector3(0, 1.1, -6);
const WALK_RADIUS = 15;
const RAIN_COUNT_HIGH = 1400;
const RAIN_COUNT_LOW = 500;
const RAIN_HEIGHT = 40;

type Phase = 'milestones' | 'storm' | 'clearing';

function makeRain(count: number): {
  points: THREE.Points;
  uniforms: { uTime: { value: number }; uOpacity: { value: number } };
  dispose(): void;
} {
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
        // fall + wrap, all on the GPU — zero per-frame CPU work
        p.y = mod(position.y - uTime * 26.0, ${RAIN_HEIGHT.toFixed(1)});
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 90.0 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      void main() {
        // thin vertical streak inside the point sprite
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

/**
 * Block 02 — "The Journey / Google Storm". Pre-dawn pink; three glowing
 * milestones as the sun nearly rises — then the storm rolls in: grey sky,
 * thunder, rain, and Alice's side-log self-talk about sunny and rainy days.
 */
class Block02JourneyStorm implements StoryBlock {
  readonly id = 'block02-journey-storm';

  private ctx!: WorldContext;
  private walk: WalkController | null = null;
  private phase: Phase = 'milestones';
  private milestones: { wisp: Wisp; reached: boolean; date: string; label: string }[] = [];
  private reachedCount = 0;
  private rain: ReturnType<typeof makeRain> | null = null;
  private beacon: Wisp | null = null;
  private title: OverlayHandle | null = null;
  private typewriter: TypewriterHandle | null = null;
  private log: SideLogHandle | null = null;
  private hintEl: HTMLElement | null = null;
  private flashEl: HTMLElement | null = null;
  private logTimer = 0;
  private thunderTimer = 4;
  private advanced = false;
  private onAdvance: (() => void) | null = null;

  setAdvanceHandler(fn: () => void): void {
    this.onAdvance = fn;
  }

  async preload(): Promise<void> {}

  enter(ctx: WorldContext): void {
    this.ctx = ctx;
    const cat = ctx.cat.object3D;
    cat.visible = true;
    ctx.rig.follow(cat);
    this.walk = new WalkController(
      cat,
      ctx.camera,
      ctx.renderer.domElement,
      WALK_CENTER.clone().setY(cat.position.y),
      WALK_RADIUS,
    );

    // three milestones marching toward the (almost rising) sun
    const spots: [number, number][] = [
      [-8, 0],
      [0, -8],
      [9, -13],
    ];
    this.milestones = spots.map(([x, z], i) => {
      const wisp = createWisp('#ffcf7d', 3.6, 0.95);
      wisp.sprite.position.set(x, 2.4, z);
      ctx.scene.add(wisp.sprite);
      return { wisp, reached: false, ...block02Content.milestones[i] };
    });

    this.title = chapterTitle(ctx.overlay, block02Content.title);

    // full-screen lightning flash element
    const flash = document.createElement('div');
    flash.style.cssText =
      'position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity 0.4s ease;';
    ctx.overlay.appendChild(flash);
    this.flashEl = flash;
  }

  private reach(m: (typeof this.milestones)[number]): void {
    m.reached = true;
    m.wisp.baseScale *= 1.8;
    this.reachedCount += 1;
    this.typewriter?.destroy();
    this.typewriter = typewriterLines(this.ctx.overlay, [`${m.date} — ${m.label}`]);
    if (this.reachedCount === this.milestones.length) this.startStorm();
  }

  private startStorm(): void {
    this.phase = 'storm';
    this.ctx.env.setSunVisible(false);
    const rain = makeRain(this.ctx.quality === 'low' ? RAIN_COUNT_LOW : RAIN_COUNT_HIGH);
    this.ctx.scene.add(rain.points);
    this.rain = rain;
    this.log = sideLog(this.ctx.overlay, block02Content.stormLog);
    this.log.next();
    this.logTimer = 0;
    this.lightning(1);
  }

  private lightning(intensity: number): void {
    this.ctx.audio.thunder(intensity);
    if (this.flashEl && !this.ctx.reducedMotion) {
      this.flashEl.style.opacity = '0.5';
      setTimeout(() => this.flashEl && (this.flashEl.style.opacity = '0'), 120);
    }
  }

  private startClearing(): void {
    this.phase = 'clearing';
    this.beacon = createWisp('#ffd76a', 5, 1);
    this.beacon.sprite.position.set(0, 3, 8);
    this.ctx.scene.add(this.beacon.sprite);
    const hint = document.createElement('p');
    hint.className = 'wl-hint';
    hint.textContent = block02Content.continueHint;
    this.ctx.overlay.appendChild(hint);
    this.hintEl = hint;
  }

  update(dt: number, t: number): void {
    const cat = this.ctx.cat.object3D;
    this.walk?.update(dt);
    this.ctx.cat.update(dt);

    const k = 1 - Math.exp(-dt * 0.7);
    if (this.phase === 'milestones') {
      lerpEnvToPreset(this.ctx.env, skyPresets.preDawnPink, k);
    } else {
      lerpEnvToPreset(this.ctx.env, skyPresets.stormGrey, k);
    }

    for (const m of this.milestones) {
      if (m.reached) m.wisp.baseOpacity = Math.max(m.wisp.baseOpacity - dt * 0.4, 0.15);
      pulseWisp(m.wisp, t);
      if (
        this.phase === 'milestones' &&
        !m.reached &&
        m.wisp.sprite.position.distanceTo(cat.position) < 4
      ) {
        this.reach(m);
      }
    }

    if (this.phase === 'storm' || this.phase === 'clearing') {
      if (this.rain) {
        this.rain.uniforms.uTime.value = t;
        const target = this.phase === 'storm' ? 1 : 0.35;
        const u = this.rain.uniforms.uOpacity;
        u.value += (target - u.value) * Math.min(dt * 0.8, 1);
      }

      if (this.phase === 'storm') {
        this.thunderTimer -= dt;
        if (this.thunderTimer <= 0) {
          this.lightning(0.5 + Math.random() * 0.5);
          this.thunderTimer = 5 + Math.random() * 6;
        }
        this.logTimer += dt;
        if (this.logTimer > 4.5 && this.log) {
          this.logTimer = 0;
          if (!this.log.next()) this.startClearing();
        }
      }
    }

    if (this.beacon) {
      pulseWisp(this.beacon, t, 0.2);
      if (!this.advanced && this.beacon.sprite.position.distanceTo(cat.position) < 4.5) {
        this.advanced = true;
        this.onAdvance?.();
      }
    }
  }

  async exit(): Promise<void> {
    // hand the world back sunny: next block lerps its own sky from here
    this.ctx.env.setSunVisible(true);
  }

  dispose(): void {
    this.walk?.dispose();
    this.typewriter?.destroy();
    this.title?.destroy();
    this.log?.destroy();
    this.hintEl?.remove();
    this.flashEl?.remove();
    for (const { wisp } of this.milestones) {
      this.ctx.scene.remove(wisp.sprite);
      wisp.dispose();
    }
    this.milestones = [];
    if (this.rain) {
      this.ctx.scene.remove(this.rain.points);
      this.rain.dispose();
    }
    if (this.beacon) {
      this.ctx.scene.remove(this.beacon.sprite);
      this.beacon.dispose();
    }
    this.ctx.rig.follow(null);
  }
}

export function createBlock(): Block02JourneyStorm {
  return new Block02JourneyStorm();
}
