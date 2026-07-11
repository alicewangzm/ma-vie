import * as THREE from 'three';
import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { WalkController } from '../core/walk';
import { createWisp, pulseWisp, type Wisp } from '../render/wisp';
import { makePanel } from '../render/panels';
import { makeRain, type Rain } from '../render/rain';
import { skyPresets, lerpEnvToPreset } from '../render/skyPresets';
import {
  typewriterLines,
  chapterTitle,
  sideLog,
  type TypewriterHandle,
  type OverlayHandle,
  type SideLogHandle,
} from '../ui/overlay';
import { stormContent } from '../content/block03';
import { hillY } from './block01-who-is-alice';

const WALK_RADIUS = 15;
const RAIN_COUNT_HIGH = 1400;
const RAIN_COUNT_LOW = 500;

type Phase = 'door' | 'milestones' | 'pre-storm' | 'storm' | 'clearing';

/**
 * Block 03 — "The Storm Before Sunrise" (Google). Pre-dawn pink; a door
 * with a familiar name; three milestones glow as the sun almost rises.
 * Then interview four: cloud rolls in, thunder, rain, desaturation — and
 * quiet self-talk at the edge of the frame.
 */
class Block03Storm implements StoryBlock {
  readonly id = 'block03-storm';

  private ctx!: WorldContext;
  private walk: WalkController | null = null;
  private phase: Phase = 'door';
  private door: ReturnType<typeof makePanel> | null = null;
  private milestones: { wisp: Wisp; reached: boolean; label: string }[] = [];
  private reachedCount = 0;
  private rain: Rain | null = null;
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
    cat.position.y = hillY(cat.position.x, cat.position.z) + 0.1;
    ctx.rig.follow(cat);
    this.walk = new WalkController(
      cat,
      ctx.camera,
      ctx.renderer.domElement,
      new THREE.Vector3(0, cat.position.y, -6),
      WALK_RADIUS,
    );

    this.title = chapterTitle(ctx.overlay, `${stormContent.title} · ${stormContent.date}`);

    // the door with a familiar name (logo placeholder until Stage 3 art)
    this.door = makePanel('Google', 'a door appeared', '#4285f4');
    this.door.mesh.position.set(0, 8, -24);
    this.door.mesh.scale.setScalar(1.6);
    this.door.mesh.lookAt(ctx.camera.position);
    ctx.scene.add(this.door.mesh);

    this.typewriter = typewriterLines(ctx.overlay, stormContent.intro, 2200);
    void this.typewriter.done.then(() => this.startMilestones());

    // full-screen lightning flash element
    const flash = document.createElement('div');
    flash.style.cssText =
      'position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;transition:opacity 0.4s ease;';
    ctx.overlay.appendChild(flash);
    this.flashEl = flash;
  }

  private startMilestones(): void {
    if (this.phase !== 'door') return;
    this.phase = 'milestones';
    // three milestones marching toward the (almost rising) sun
    const spots: [number, number][] = [
      [-8, 0],
      [0, -8],
      [9, -13],
    ];
    this.milestones = spots.map(([x, z], i) => {
      const wisp = createWisp('#ffcf7d', 3.6, 0.95);
      wisp.sprite.position.set(x, hillY(x, z) + 2.2, z);
      this.ctx.scene.add(wisp.sprite);
      return { wisp, reached: false, label: stormContent.milestones[i] };
    });
  }

  private reach(m: (typeof this.milestones)[number]): void {
    m.reached = true;
    m.wisp.baseScale *= 1.8;
    this.reachedCount += 1;
    this.typewriter?.destroy();
    this.typewriter = typewriterLines(this.ctx.overlay, [m.label]);
    if (this.reachedCount === this.milestones.length) this.startPreStorm();
  }

  private startPreStorm(): void {
    this.phase = 'pre-storm';
    this.typewriter?.destroy();
    this.typewriter = typewriterLines(this.ctx.overlay, stormContent.preStorm, 2400);
    void this.typewriter.done.then(() => {
      if (this.phase === 'pre-storm') this.startStorm();
    });
  }

  private startStorm(): void {
    this.phase = 'storm';
    this.ctx.env.setSunVisible(false);
    const rain = makeRain(this.ctx.quality === 'low' ? RAIN_COUNT_LOW : RAIN_COUNT_HIGH);
    this.ctx.scene.add(rain.points);
    this.rain = rain;
    this.typewriter?.destroy();
    this.typewriter = typewriterLines(this.ctx.overlay, [stormContent.stormLine], 2000);
    this.log = sideLog(this.ctx.overlay, stormContent.sideLog);
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
    this.beacon.sprite.position.set(0, hillY(0, 8) + 2, 8);
    this.ctx.scene.add(this.beacon.sprite);
    const hint = document.createElement('p');
    hint.className = 'wl-hint';
    hint.textContent = stormContent.continueHint;
    this.ctx.overlay.appendChild(hint);
    this.hintEl = hint;
  }

  update(dt: number, t: number): void {
    const cat = this.ctx.cat.object3D;
    this.walk?.update(dt);
    this.ctx.cat.setMoving(this.walk?.moving ?? false);
    cat.position.y = hillY(cat.position.x, cat.position.z) + 0.1;
    this.ctx.cat.update(dt);

    const k = 1 - Math.exp(-dt * 0.7);
    const stormy = this.phase === 'storm' || this.phase === 'clearing';
    lerpEnvToPreset(this.ctx.env, stormy ? skyPresets.stormGrey : skyPresets.preDawnPink, k);

    if (this.door) {
      this.door.material.opacity = Math.min(
        this.door.material.opacity + dt * 0.5,
        stormy ? 0.25 : 0.85, // the door dims once the storm takes the sky
      );
    }

    for (const m of this.milestones) {
      if (m.reached) m.wisp.baseOpacity = Math.max(m.wisp.baseOpacity - dt * 0.4, 0.15);
      pulseWisp(m.wisp, t);
      if (
        this.phase === 'milestones' &&
        !m.reached &&
        m.wisp.sprite.position.distanceTo(cat.position) < 4.5
      ) {
        this.reach(m);
      }
    }

    if (stormy && this.rain) {
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

    if (this.beacon) {
      pulseWisp(this.beacon, t, 0.2);
      if (!this.advanced && this.beacon.sprite.position.distanceTo(cat.position) < 4.5) {
        this.advanced = true;
        this.onAdvance?.();
      }
    }
  }

  async exit(): Promise<void> {
    // hand the world back with the sun out; the next chapter brings its own
    // lighter drizzle
    this.ctx.env.setSunVisible(true);
  }

  dispose(): void {
    this.walk?.dispose();
    this.typewriter?.destroy();
    this.title?.destroy();
    this.log?.destroy();
    this.hintEl?.remove();
    this.flashEl?.remove();
    if (this.door) {
      this.ctx.scene.remove(this.door.mesh);
      this.door.dispose();
    }
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

export function createBlock(): Block03Storm {
  return new Block03Storm();
}
