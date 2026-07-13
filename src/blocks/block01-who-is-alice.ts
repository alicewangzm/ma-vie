import * as THREE from 'three';
import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { WalkController } from '../core/walk';
import { createWisp, pulseWisp, type Wisp } from '../render/wisp';
import { skyPresets, lerpEnvToPreset } from '../render/skyPresets';
import { typewriterLines, type TypewriterHandle } from '../ui/overlay';
import { islandContent } from '../content/block01';

const HILL_CENTER = new THREE.Vector3(0, 0, -6);
const HILL_RADIUS_X = 42; // hill sphere r=30 scaled 1.4
const HILL_RADIUS_Y = 15; // scaled 0.5
const WALK_RADIUS = 22; // generous — no invisible walls
const COLLECT_DIST = 4.2;

/** Height of the hill surface at (x, z) — the cat walks on this. */
export function hillY(x: number, z: number): number {
  const dx = x - HILL_CENTER.x;
  const dz = z - -6;
  const f = 1 - (dx * dx + dz * dz) / (HILL_RADIUS_X * HILL_RADIUS_X);
  return -14 + HILL_RADIUS_Y * Math.sqrt(Math.max(f, 0));
}

/** Shared chapter-start staging: cat at the land's center, camera close behind. */
export function stageCat(ctx: WorldContext): void {
  const cat = ctx.cat.object3D;
  cat.position.set(0, hillY(0, -6) + 0.1, -6);
  cat.visible = true;
  ctx.rig.frameCat(cat);
}

type TutorialStep = 'walk' | 'look' | 'chase' | 'done';

/**
 * Block 01 — "Who Is Alice", now also the tutorial. The story beats play
 * while staged prompts teach the two handles; two lights to chase, then
 * the gold beacon opens the way onward.
 */
class Block01WhoIsAlice implements StoryBlock {
  readonly id = 'block01-who-is-alice';

  private ctx!: WorldContext;
  private walk: WalkController | null = null;
  private wisps: { wisp: Wisp; collected: boolean }[] = [];
  private beacon: Wisp | null = null;
  private typewriter: TypewriterHandle | null = null;
  private hintEl: HTMLElement | null = null;
  private step: TutorialStep = 'walk';
  private lookStart: THREE.Vector3 | null = null;
  private collectedCount = 0;
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
      new THREE.Vector3(HILL_CENTER.x, cat.position.y, -6),
      WALK_RADIUS,
      6,
      ctx.moveInput,
    );

    // two lights to chase — the whole exercise
    const spots: [number, number][] = [
      [-8, -11],
      [9, 1],
    ];
    this.wisps = spots.map(([x, z]) => {
      const wisp = createWisp('#fff0b8', 3.4, 0.85);
      wisp.sprite.position.set(x, hillY(x, z) + 1.6, z);
      ctx.scene.add(wisp.sprite);
      return { wisp, collected: false };
    });

    this.typewriter = typewriterLines(ctx.overlay, islandContent.lines, 1700);
    this.lookStart = ctx.camera.position.clone();
    this.showHint(islandContent.tutorial[0]);
  }

  private showHint(text: string): void {
    this.hintEl?.remove();
    const hint = document.createElement('p');
    hint.className = 'wl-hint';
    hint.textContent = text;
    this.ctx.overlay.appendChild(hint);
    this.hintEl = hint;
  }

  private advanceTutorial(): void {
    if (this.step === 'walk') {
      this.step = 'look';
      this.showHint(islandContent.tutorial[1]);
    } else if (this.step === 'look') {
      this.step = 'chase';
      this.showHint(islandContent.tutorial[2]);
    } else if (this.step === 'chase') {
      this.step = 'done';
      this.hintEl?.remove();
      this.hintEl = null;
    }
  }

  private collect(entry: { wisp: Wisp; collected: boolean }): void {
    entry.collected = true;
    entry.wisp.baseScale *= 1.9; // bright flash, then dissolve below
    this.collectedCount += 1;
    if (this.step === 'chase') this.advanceTutorial();

    if (this.collectedCount === this.wisps.length) {
      this.beacon = createWisp('#ffd76a', 5, 1);
      // always forward — at the end of the view the cat faces
      this.beacon.sprite.position.set(0, hillY(0, -25) + 2, -25);
      this.ctx.scene.add(this.beacon.sprite);
      this.showHint(islandContent.continueHint);
    }
  }

  /** Corner "skip step": first press completes the chase, second moves on. */
  skipInteraction(): void {
    if (this.beacon) {
      if (!this.advanced) {
        this.advanced = true;
        this.onAdvance?.();
      }
      return;
    }
    for (const entry of this.wisps) if (!entry.collected) this.collect(entry);
  }

  update(dt: number, t: number): void {
    const cat = this.ctx.cat.object3D;
    this.walk?.update(dt);
    this.ctx.cat.setMoving(this.walk?.moving ?? false);
    cat.position.y = hillY(cat.position.x, cat.position.z) + 0.1;
    this.ctx.cat.update(dt);

    lerpEnvToPreset(this.ctx.env, skyPresets.dawn, 1 - Math.exp(-dt * 0.8));

    // tutorial gating: walked a step → learn to look → chase the lights
    if (this.step === 'walk' && this.walk?.moving) this.advanceTutorial();
    else if (this.step === 'look' && this.lookStart) {
      if (this.ctx.camera.position.distanceTo(this.lookStart) > 2.5) this.advanceTutorial();
    }

    for (const entry of this.wisps) {
      if (entry.collected) {
        entry.wisp.baseOpacity = Math.max(entry.wisp.baseOpacity - dt * 0.5, 0);
      }
      pulseWisp(entry.wisp, t);
      if (!entry.collected && entry.wisp.sprite.position.distanceTo(cat.position) < COLLECT_DIST) {
        this.collect(entry);
      }
    }

    if (this.beacon) {
      pulseWisp(this.beacon, t, 0.2);
      if (!this.advanced && this.beacon.sprite.position.distanceTo(cat.position) < COLLECT_DIST) {
        this.advanced = true;
        this.onAdvance?.();
      }
    }
  }

  async exit(): Promise<void> {}

  dispose(): void {
    this.walk?.dispose();
    this.typewriter?.destroy();
    this.hintEl?.remove();
    for (const { wisp } of this.wisps) {
      this.ctx.scene.remove(wisp.sprite);
      wisp.dispose();
    }
    this.wisps = [];
    if (this.beacon) {
      this.ctx.scene.remove(this.beacon.sprite);
      this.beacon.dispose();
    }
    this.ctx.rig.follow(null);
    // cat is shared world state (WorldContext), not ours to dispose
  }
}

export function createBlock(): Block01WhoIsAlice {
  return new Block01WhoIsAlice();
}
