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
import { block01Content } from '../content/block01';

const HILL_CENTER = new THREE.Vector3(0, 0, -6);
const HILL_RADIUS_X = 42; // hill sphere r=30 scaled 1.4
const HILL_RADIUS_Y = 15; // scaled 0.5
const WALK_RADIUS = 15;
const COLLECT_DIST = 2.6;

/** Height of the hill surface at (x, z) — the cat walks on this. */
function hillY(x: number, z: number): number {
  const dx = x - HILL_CENTER.x;
  const dz = z - -6;
  const f = 1 - (dx * dx + dz * dz) / (HILL_RADIUS_X * HILL_RADIUS_X);
  return -14 + HILL_RADIUS_Y * Math.sqrt(Math.max(f, 0));
}

/**
 * Block 01 — "Who is Alice". First exploration: the cat lands on the intro
 * island; Sky-style hints teach look/walk; three memory wisps each reveal a
 * story beat; a gold beacon opens the way onward.
 */
class Block01WhoIsAlice implements StoryBlock {
  readonly id = 'block01-who-is-alice';

  private ctx!: WorldContext;
  private walk: WalkController | null = null;
  private wisps: { wisp: Wisp; collected: boolean; line: string }[] = [];
  private beacon: Wisp | null = null;
  private title: OverlayHandle | null = null;
  private typewriter: TypewriterHandle | null = null;
  private hintEl: HTMLElement | null = null;
  private hintIndex = 0;
  private hintTime = 0;
  private collectedCount = 0;
  private advanced = false;
  private onAdvance: (() => void) | null = null;

  setAdvanceHandler(fn: () => void): void {
    this.onAdvance = fn;
  }

  async preload(): Promise<void> {
    // wisps are procedural sprites — nothing heavy to fetch
  }

  enter(ctx: WorldContext): void {
    this.ctx = ctx;

    const cat = ctx.cat.object3D;
    cat.position.set(0, hillY(0, -6) + 0.1, -6);
    cat.visible = true;
    ctx.rig.follow(cat);

    this.walk = new WalkController(
      cat,
      ctx.camera,
      ctx.renderer.domElement,
      new THREE.Vector3(HILL_CENTER.x, cat.position.y, -6),
      WALK_RADIUS,
    );

    // three memory wisps around the crest
    const spots: [number, number][] = [
      [-9, -12],
      [10, -9],
      [3, 4],
    ];
    this.wisps = spots.map(([x, z], i) => {
      const wisp = createWisp('#fff0b8', 3.4, 0.85);
      wisp.sprite.position.set(x, hillY(x, z) + 1.6, z);
      ctx.scene.add(wisp.sprite);
      return { wisp, collected: false, line: block01Content.wisps[i] };
    });

    this.title = chapterTitle(ctx.overlay, block01Content.title);
    this.showHint(block01Content.tutorialHints[0]);
  }

  private showHint(text: string): void {
    this.hintEl?.remove();
    const hint = document.createElement('p');
    hint.className = 'wl-hint';
    hint.textContent = text;
    this.ctx.overlay.appendChild(hint);
    this.hintEl = hint;
    this.hintTime = 0;
  }

  private collect(entry: { wisp: Wisp; collected: boolean; line: string }): void {
    entry.collected = true;
    entry.wisp.baseScale *= 1.9; // bloom flash, then we fade it below
    this.collectedCount += 1;

    this.typewriter?.destroy();
    this.typewriter = typewriterLines(this.ctx.overlay, [entry.line]);

    if (this.collectedCount === this.wisps.length) {
      this.beacon = createWisp('#ffd76a', 5, 1);
      this.beacon.sprite.position.set(0, hillY(0, 6) + 2, 8);
      this.ctx.scene.add(this.beacon.sprite);
      this.showHint(block01Content.continueHint);
      this.hintIndex = block01Content.tutorialHints.length; // stop cycling
    }
  }

  update(dt: number, t: number): void {
    const cat = this.ctx.cat.object3D;
    this.walk?.update(dt);
    cat.position.y = hillY(cat.position.x, cat.position.z) + 0.1;
    this.ctx.cat.update(dt);

    // ease from the letter's dawn into this chapter's baseline (same preset,
    // still runs so re-entry from any future block converges)
    lerpEnvToPreset(this.ctx.env, skyPresets.dawn, 1 - Math.exp(-dt * 0.8));

    // cycle tutorial hints until the beacon phase takes over
    this.hintTime += dt;
    if (this.hintIndex < block01Content.tutorialHints.length && this.hintTime > 5) {
      this.hintIndex += 1;
      if (this.hintIndex < block01Content.tutorialHints.length) {
        this.showHint(block01Content.tutorialHints[this.hintIndex]);
      } else {
        this.hintEl?.remove();
        this.hintEl = null;
      }
    }

    for (const entry of this.wisps) {
      if (entry.collected) {
        // collected wisps burn bright then dissolve
        entry.wisp.baseOpacity = Math.max(entry.wisp.baseOpacity - dt * 0.5, 0);
      }
      pulseWisp(entry.wisp, t);
      if (
        !entry.collected &&
        entry.wisp.sprite.position.distanceTo(cat.position) < COLLECT_DIST + 1.6
      ) {
        this.collect(entry);
      }
    }

    if (this.beacon) {
      pulseWisp(this.beacon, t, 0.2);
      if (
        !this.advanced &&
        this.beacon.sprite.position.distanceTo(cat.position) < COLLECT_DIST + 2
      ) {
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
