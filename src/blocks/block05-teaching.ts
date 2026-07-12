import * as THREE from 'three';
import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { WalkController } from '../core/walk';
import { createWisp, pulseWisp, type Wisp } from '../render/wisp';
import { skyPresets, lerpEnvToPreset } from '../render/skyPresets';
import {
  typewriterLines,
  chapterTitle,
  type TypewriterHandle,
  type OverlayHandle,
} from '../ui/overlay';
import { createQMark, type QMark } from '../ui/qmark';
import { openCloudModal } from '../ui/cloudModal';
import { teachingContent } from '../content/block05';
import { hillY, stageCat } from './block01-who-is-alice';

const WALK_RADIUS = 22;
/** Beat index of "Today, Alice teaches." — full color returns here. */
const WARMTH_BEAT = 4;

/**
 * Block 05 — "Where She Is Now" (Teaching). Clouds thicken, the road goes
 * soft and white — then warmth: full color returns, and small lights kindle
 * around the cat, one for each person she lights the road for.
 */
class Block05Teaching implements StoryBlock {
  readonly id = 'block05-teaching';

  private ctx!: WorldContext;
  private walk: WalkController | null = null;
  private title: OverlayHandle | null = null;
  private typewriter: TypewriterHandle | null = null;
  private hintEl: HTMLElement | null = null;
  private lanterns: Wisp[] = [];
  private qmark: QMark | null = null;
  private beacon: Wisp | null = null;
  private warm = false;
  private advanced = false;
  private onAdvance: (() => void) | null = null;

  setAdvanceHandler(fn: () => void): void {
    this.onAdvance = fn;
  }

  async preload(): Promise<void> {}

  enter(ctx: WorldContext): void {
    this.ctx = ctx;
    stageCat(ctx);
    const cat = ctx.cat.object3D;
    this.walk = new WalkController(
      cat,
      ctx.camera,
      ctx.renderer.domElement,
      new THREE.Vector3(0, cat.position.y, -6),
      WALK_RADIUS,
      6,
      ctx.moveInput,
    );

    this.title = chapterTitle(ctx.overlay, teachingContent.title);
    this.typewriter = typewriterLines(ctx.overlay, teachingContent.lines, 2400, 3, (i) => {
      if (i === WARMTH_BEAT) this.kindle();
    });
    void this.typewriter.done.then(() => this.showBeacon());
  }

  /** Full color returns; small warm lights kindle in a ring. */
  private kindle(): void {
    this.warm = true;
    // "look closer": what she actually teaches, in a cloud
    this.qmark = createQMark(
      this.ctx.overlay,
      new THREE.Vector3(4.5, hillY(4.5, -12) + 3, -12),
      teachingContent.modal.title,
      () => openCloudModal(this.ctx.overlay, teachingContent.modal),
    );
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const x = Math.cos(a) * 9;
      const z = -6 + Math.sin(a) * 9;
      const w = createWisp('#ffe1a0', 1.6, 0);
      w.baseOpacity = 0; // fades up in update
      w.sprite.position.set(x, hillY(x, z) + 1.3, z);
      this.ctx.scene.add(w.sprite);
      this.lanterns.push(w);
    }
  }

  private showBeacon(): void {
    this.beacon = createWisp('#ffd76a', 5, 1);
    this.beacon.sprite.position.set(0, hillY(0, 6) + 2, 8);
    this.ctx.scene.add(this.beacon.sprite);
    const hint = document.createElement('p');
    hint.className = 'wl-hint';
    hint.textContent = teachingContent.continueHint;
    this.ctx.overlay.appendChild(hint);
    this.hintEl = hint;
  }

  update(dt: number, t: number): void {
    const cat = this.ctx.cat.object3D;
    this.walk?.update(dt);
    this.ctx.cat.setMoving(this.walk?.moving ?? false);
    cat.position.y = hillY(cat.position.x, cat.position.z) + 0.1;
    this.ctx.cat.update(dt);

    // soft white nothing → warm full color at "Today, Alice teaches."
    const preset = this.warm ? skyPresets.dawn : skyPresets.whiteout;
    lerpEnvToPreset(this.ctx.env, preset, 1 - Math.exp(-dt * (this.warm ? 0.9 : 0.5)));

    for (const w of this.lanterns) {
      w.baseOpacity = Math.min(w.baseOpacity + dt * 0.25, 0.85);
      pulseWisp(w, t);
    }
    this.qmark?.update(this.ctx.camera);

    if (this.beacon) {
      pulseWisp(this.beacon, t, 0.2);
      if (!this.advanced && this.beacon.sprite.position.distanceTo(cat.position) < 4.2) {
        this.advanced = true;
        this.onAdvance?.();
      }
    }
  }

  /** Skip the walking objective; the beats still land. */
  skipInteraction(): void {
    if (this.beacon) {
      if (!this.advanced) {
        this.advanced = true;
        this.onAdvance?.();
      }
      return;
    }
    this.typewriter?.skip();
  }

  async exit(): Promise<void> {}

  dispose(): void {
    this.qmark?.dispose();
    this.walk?.dispose();
    this.typewriter?.destroy();
    this.title?.destroy();
    this.hintEl?.remove();
    for (const w of this.lanterns) {
      this.ctx.scene.remove(w.sprite);
      w.dispose();
    }
    this.lanterns = [];
    if (this.beacon) {
      this.ctx.scene.remove(this.beacon.sprite);
      this.beacon.dispose();
    }
    this.ctx.rig.follow(null);
  }
}

export function createBlock(): Block05Teaching {
  return new Block05Teaching();
}
