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
  type TypewriterHandle,
  type OverlayHandle,
} from '../ui/overlay';
import { aletheaContent } from '../content/block04';
import { hillY } from './block01-who-is-alice';

const WALK_RADIUS = 15;
const DRIZZLE_OPACITY = 0.35; // rain eases but doesn't fully clear

/**
 * Block 04 — "Building in the Rain" (Alethea Medical). The storm has eased
 * to a drizzle; a steadier, quieter chapter. The Alethea card floats up as
 * the beats speak of quiet, solid work.
 */
class Block04Alethea implements StoryBlock {
  readonly id = 'block04-alethea';

  private ctx!: WorldContext;
  private walk: WalkController | null = null;
  private rain: Rain | null = null;
  private panel: ReturnType<typeof makePanel> | null = null;
  private title: OverlayHandle | null = null;
  private typewriter: TypewriterHandle | null = null;
  private hintEl: HTMLElement | null = null;
  private beacon: Wisp | null = null;
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

    this.rain = makeRain(ctx.quality === 'low' ? 250 : 700);
    this.rain.uniforms.uOpacity.value = DRIZZLE_OPACITY;
    ctx.scene.add(this.rain.points);

    this.title = chapterTitle(ctx.overlay, aletheaContent.title);
    this.typewriter = typewriterLines(ctx.overlay, aletheaContent.lines, 2400, 3, (i) => {
      if (i === 2) {
        // "A medical-software team in Calgary." — the card floats up
        this.panel = makePanel('Alethea Medical', 'Calgary — medical software', '#3b7a6d');
        this.panel.mesh.position.set(0, 2.5, -18);
        this.panel.mesh.scale.setScalar(1.5);
        this.panel.mesh.lookAt(this.ctx.camera.position);
        this.ctx.scene.add(this.panel.mesh);
      }
    });
    void this.typewriter.done.then(() => this.showBeacon());
  }

  private showBeacon(): void {
    this.beacon = createWisp('#ffd76a', 5, 1);
    this.beacon.sprite.position.set(0, hillY(0, 6) + 2, 8);
    this.ctx.scene.add(this.beacon.sprite);
    const hint = document.createElement('p');
    hint.className = 'wl-hint';
    hint.textContent = aletheaContent.continueHint;
    this.ctx.overlay.appendChild(hint);
    this.hintEl = hint;
  }

  update(dt: number, t: number): void {
    const cat = this.ctx.cat.object3D;
    this.walk?.update(dt);
    this.ctx.cat.setMoving(this.walk?.moving ?? false);
    cat.position.y = hillY(cat.position.x, cat.position.z) + 0.1;
    this.ctx.cat.update(dt);
    lerpEnvToPreset(this.ctx.env, skyPresets.afterRain, 1 - Math.exp(-dt * 0.7));

    if (this.rain) this.rain.uniforms.uTime.value = t;
    if (this.panel) {
      this.panel.material.opacity = Math.min(this.panel.material.opacity + dt * 0.6, 0.92);
      const target = 6.5;
      this.panel.mesh.position.y += (target - this.panel.mesh.position.y) * Math.min(dt * 1.2, 1);
    }

    if (this.beacon) {
      pulseWisp(this.beacon, t, 0.2);
      if (!this.advanced && this.beacon.sprite.position.distanceTo(cat.position) < 4.2) {
        this.advanced = true;
        this.onAdvance?.();
      }
    }
  }

  async exit(): Promise<void> {}

  dispose(): void {
    this.walk?.dispose();
    this.typewriter?.destroy();
    this.title?.destroy();
    this.hintEl?.remove();
    if (this.rain) {
      this.ctx.scene.remove(this.rain.points);
      this.rain.dispose();
    }
    if (this.panel) {
      this.ctx.scene.remove(this.panel.mesh);
      this.panel.dispose();
    }
    if (this.beacon) {
      this.ctx.scene.remove(this.beacon.sprite);
      this.beacon.dispose();
    }
    this.ctx.rig.follow(null);
  }
}

export function createBlock(): Block04Alethea {
  return new Block04Alethea();
}
