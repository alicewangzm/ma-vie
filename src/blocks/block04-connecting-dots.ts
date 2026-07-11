import * as THREE from 'three';
import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { createWisp, pulseWisp, type Wisp } from '../render/wisp';
import { skyPresets, lerpEnvToPreset } from '../render/skyPresets';
import {
  typewriterLines,
  chapterTitle,
  createButton,
  type TypewriterHandle,
  type OverlayHandle,
} from '../ui/overlay';
import { block04Content } from '../content/block04';

const POINTS_PER_LINK = 28;
const SECONDS_PER_LINK = 4.2;

/**
 * Block 04 — "Connecting the Dots". Dusk falls; one star per chapter so far
 * hangs in the sky, and a gold thread draws between them Sky-style, one link
 * per gratitude beat. Cinematic: the cat rests, the sky does the talking.
 */
class Block04ConnectingDots implements StoryBlock {
  readonly id = 'block04-connecting-dots';

  private ctx!: WorldContext;
  private stars: Wisp[] = [];
  private line: THREE.Line | null = null;
  private lineGeo: THREE.BufferGeometry | null = null;
  private lineMat: THREE.LineBasicMaterial | null = null;
  private totalPoints = 0;
  private linkIndex = 0;
  private linkTime = 0;
  private beatsDone = false;
  private title: OverlayHandle | null = null;
  private typewriter: TypewriterHandle | null = null;
  private continueBtn: HTMLButtonElement | null = null;
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
    cat.position.set(0, 1.2, -6);
    ctx.rig.follow(null);
    ctx.rig.lookAt(new THREE.Vector3(0, 26, -40));

    // one star per chapter walked so far (letter → island → storm → paths)
    const starPos = [
      new THREE.Vector3(-34, 20, -48),
      new THREE.Vector3(-14, 30, -55),
      new THREE.Vector3(6, 24, -50),
      new THREE.Vector3(24, 34, -58),
      new THREE.Vector3(40, 26, -46),
    ];
    this.stars = starPos.map((p) => {
      const w = createWisp('#fff4cf', 2.6, 0.95);
      w.sprite.position.copy(p);
      ctx.scene.add(w.sprite);
      return w;
    });

    // gold thread through the stars, revealed link by link via drawRange
    const curvePoints: THREE.Vector3[] = [];
    for (let i = 0; i < starPos.length - 1; i++) {
      const a = starPos[i];
      const b = starPos[i + 1];
      const mid = a.clone().lerp(b, 0.5);
      mid.y += 3; // gentle arc between stars
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const pts = curve.getPoints(POINTS_PER_LINK - 1);
      // skip duplicated joint point except on the first link
      curvePoints.push(...(i === 0 ? pts : pts.slice(1)));
    }
    this.totalPoints = curvePoints.length;

    this.lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    this.lineGeo.setDrawRange(0, 0);
    this.lineMat = new THREE.LineBasicMaterial({
      color: 0xffe9a8,
      transparent: true,
      opacity: 0.85,
      fog: false,
    });
    this.line = new THREE.Line(this.lineGeo, this.lineMat);
    ctx.scene.add(this.line);

    this.title = chapterTitle(ctx.overlay, block04Content.title);
    this.showBeat(0);
  }

  private showBeat(i: number): void {
    const beats = block04Content.gratitudeBeats;
    if (i >= beats.length) return;
    this.typewriter?.destroy();
    this.typewriter = typewriterLines(this.ctx.overlay, [beats[i]]);
  }

  private finish(): void {
    if (this.beatsDone) return;
    this.beatsDone = true;
    // final beat ("the dots were always connected") + continue button
    this.showBeat(block04Content.gratitudeBeats.length - 1);
    this.continueBtn = createButton(
      this.ctx.overlay,
      block04Content.continueHint,
      'wl-accept',
      () => {
        if (this.advanced) return;
        this.advanced = true;
        this.onAdvance?.();
      },
    );
    requestAnimationFrame(() => this.continueBtn?.classList.add('visible'));
  }

  update(dt: number, t: number): void {
    this.ctx.cat.update(dt);
    lerpEnvToPreset(this.ctx.env, skyPresets.dusk, 1 - Math.exp(-dt * 0.6));

    for (const s of this.stars) pulseWisp(s, t, 0.08);

    const links = this.stars.length - 1;
    if (this.linkIndex < links && this.lineGeo) {
      this.linkTime += dt;
      const speed = this.ctx.reducedMotion ? 4 : 1;
      const kLink = Math.min((this.linkTime / SECONDS_PER_LINK) * speed, 1);
      const shown = Math.floor((this.linkIndex + kLink) * (this.totalPoints / links));
      this.lineGeo.setDrawRange(0, shown);
      if (kLink >= 1) {
        this.linkIndex += 1;
        this.linkTime = 0;
        if (this.linkIndex < links) this.showBeat(this.linkIndex);
        else {
          this.lineGeo.setDrawRange(0, this.totalPoints);
          this.finish();
        }
      }
    }
  }

  async exit(): Promise<void> {}

  dispose(): void {
    this.typewriter?.destroy();
    this.title?.destroy();
    this.continueBtn?.remove();
    for (const s of this.stars) {
      this.ctx.scene.remove(s.sprite);
      s.dispose();
    }
    this.stars = [];
    if (this.line) this.ctx.scene.remove(this.line);
    this.lineGeo?.dispose();
    this.lineMat?.dispose();
  }
}

export function createBlock(): Block04ConnectingDots {
  return new Block04ConnectingDots();
}
