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
import { createStonePath, type StonePath } from '../render/stones';
import { createQMark, type QMark } from '../ui/qmark';
import { openCloudModal } from '../ui/cloudModal';
import { pathsContent } from '../content/block06';
import { stageCat } from './block01-who-is-alice';

const WALK_CENTER = new THREE.Vector3(0, 1.1, -6);
const WALK_RADIUS = 22;
// the cat faces -z at the node; roads run 15 units out from it
const ROAD_LEN = 15;
const TILT = (30 * Math.PI) / 180;
const GOLD = '#ffd76a';
const ENVISIONED_BLUE = '#9fc4ef';

interface PathDef {
  key: 'teaching' | 'pilot' | 'pawhearth';
  color: string;
  end: THREE.Vector3;
  lines: readonly string[];
  /** How dreamy standing here feels (teaching = reality = 0). */
  dream: number;
}

/** Placeholder "screenshot" texture until Alice drops real images in /assets. */
function panelTexture(label: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const g = c.getContext('2d')!;
  g.fillStyle = '#dfe9f5';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#b7c9e2';
  g.fillRect(0, 0, c.width, 54);
  g.fillStyle = '#5b7396';
  g.font = '26px sans-serif';
  g.textAlign = 'center';
  g.fillText(label, c.width / 2, c.height / 2);
  g.font = '18px sans-serif';
  g.fillText('[placeholder screenshot]', c.width / 2, c.height / 2 + 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Block 06 — "Three Roads From Here". The gold trail underfoot is teaching — reality,
 * full color. Two faded-blue trails branch toward envisioned futures: pilot
 * and the PawHearth startup. Standing at a vision raises dreamFactor.
 */
class Block06ThreePaths implements StoryBlock {
  readonly id = 'block06-three-paths';

  private ctx!: WorldContext;
  private walk: WalkController | null = null;
  private trails: Wisp[] = [];
  private roads: StonePath[] = [];
  private qmarks: QMark[] = [];
  private paths: (PathDef & { visited: boolean })[] = [];
  private panels: THREE.Mesh[] = [];
  private panelMats: THREE.MeshBasicMaterial[] = [];
  private beacon: Wisp | null = null;
  private title: OverlayHandle | null = null;
  private typewriter: TypewriterHandle | null = null;
  private hintEl: HTMLElement | null = null;
  private activePath: PathDef | null = null;
  private visitedCount = 0;
  private advanced = false;
  private onAdvance: (() => void) | null = null;
  private disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  setAdvanceHandler(fn: () => void): void {
    this.onAdvance = fn;
  }

  async preload(): Promise<void> {}

  enter(ctx: WorldContext): void {
    this.ctx = ctx;
    stageCat(ctx); // the cat sits at the node where the branches split
    const cat = ctx.cat.object3D;
    this.walk = new WalkController(
      cat,
      ctx.camera,
      ctx.renderer.domElement,
      WALK_CENTER.clone().setY(cat.position.y),
      WALK_RADIUS,
      6,
      ctx.moveInput,
    );

    const c = pathsContent;
    // straight ahead = gold teaching road; leisure flight tilts 30° left,
    // PawHearth 30° right (screen left/right for a viewer behind the cat)
    const node = new THREE.Vector3(0, 2, -6);
    const ahead = node.clone().add(new THREE.Vector3(0, 0, -ROAD_LEN));
    const left = node
      .clone()
      .add(new THREE.Vector3(-Math.sin(TILT) * ROAD_LEN, 0, -Math.cos(TILT) * ROAD_LEN));
    const right = node
      .clone()
      .add(new THREE.Vector3(Math.sin(TILT) * ROAD_LEN, 0, -Math.cos(TILT) * ROAD_LEN));
    this.paths = [
      {
        key: 'teaching',
        color: GOLD,
        end: ahead,
        lines: c.teaching.lines,
        dream: 0,
        visited: false,
      },
      {
        key: 'pilot',
        color: ENVISIONED_BLUE,
        end: left,
        lines: c.pilot.lines,
        dream: 0.8,
        visited: false,
      },
      {
        key: 'pawhearth',
        color: ENVISIONED_BLUE,
        end: right,
        lines: c.pawhearth.lines,
        dream: 0.8,
        visited: false,
      },
    ];

    // three stone roads branch from the node like tree limbs; wisps float
    // above each to color-code reality (gold) vs envisioned (faded blue)
    const start = new THREE.Vector3(0, 1.6, -6);
    for (const path of this.paths) {
      const road = createStonePath(start, path.end.clone(), {
        color: path.key === 'teaching' ? 0xcbb98e : 0xa9b4cc,
      });
      this.ctx.scene.add(road.mesh);
      this.roads.push(road);

      const steps = 7;
      for (let i = 1; i <= steps; i++) {
        const p = start.clone().lerp(path.end, i / steps);
        const w = createWisp(
          path.color,
          path.key === 'teaching' ? 1.7 : 1.3,
          path.key === 'teaching' ? 0.9 : 0.5,
        );
        w.sprite.position.copy(p).setY(1.4 + Math.sin(i * 1.3) * 0.25);
        this.ctx.scene.add(w.sprite);
        this.trails.push(w);
      }
    }

    // ? buttons on the envisioned roads — the visions open in clouds
    this.qmarks.push(
      createQMark(ctx.overlay, left.clone().setY(4.2), c.modals.pilot.title, () =>
        openCloudModal(ctx.overlay, c.modals.pilot),
      ),
      createQMark(ctx.overlay, right.clone().setY(4.2), c.modals.pawhearth.title, () =>
        openCloudModal(ctx.overlay, c.modals.pawhearth),
      ),
    );

    // PawHearth: floating "screenshot" panels near its vision end
    const panelGeo = new THREE.PlaneGeometry(4.4, 2.75);
    this.disposables.push(panelGeo);
    for (let i = 0; i < 2; i++) {
      const tex = panelTexture(c.pawhearth.label);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.55,
        side: THREE.DoubleSide,
        fog: false,
      });
      this.disposables.push(tex, mat);
      this.panelMats.push(mat);
      const panel = new THREE.Mesh(panelGeo, mat);
      panel.position.set(9.5 + i * 3.2, 4.8 + i * 1.6, -22 - i * 1.5);
      panel.lookAt(ctx.camera.position);
      this.ctx.scene.add(panel);
      this.panels.push(panel);
    }

    this.title = chapterTitle(ctx.overlay, c.title);
    this.typewriter = typewriterLines(ctx.overlay, [c.intro], 2200);
  }

  private visit(path: PathDef & { visited: boolean }): void {
    path.visited = true;
    this.visitedCount += 1;
    this.typewriter?.destroy();
    this.typewriter = typewriterLines(this.ctx.overlay, [...path.lines]);

    if (this.visitedCount === this.paths.length) {
      // last path's lines land → closing beats → beacon
      const pathLines = this.typewriter;
      void pathLines.done.then(() => {
        if (this.typewriter !== pathLines) return; // superseded by teardown
        this.typewriter.destroy();
        this.typewriter = typewriterLines(this.ctx.overlay, [...pathsContent.closing], 2600);
        void this.typewriter.done.then(() => this.showBeacon());
      });
    }
  }

  private showBeacon(): void {
    this.beacon = createWisp(GOLD, 5, 1);
    this.beacon.sprite.position.set(0, 3, -27); // past the gold road's end
    this.ctx.scene.add(this.beacon.sprite);
    const hint = document.createElement('p');
    hint.className = 'wl-hint';
    hint.textContent = pathsContent.continueHint;
    this.ctx.overlay.appendChild(hint);
    this.hintEl = hint;
  }

  update(dt: number, t: number): void {
    const cat = this.ctx.cat.object3D;
    this.walk?.update(dt);
    this.ctx.cat.setMoving(this.walk?.moving ?? false);
    this.ctx.cat.update(dt);
    lerpEnvToPreset(this.ctx.env, skyPresets.dawn, 1 - Math.exp(-dt * 0.7));

    // which path end is the cat standing at?
    this.activePath = null;
    for (const path of this.paths) {
      if (path.end.distanceTo(cat.position) < 5) {
        this.activePath = path;
        if (!path.visited) this.visit(path);
      }
    }

    // dreamFactor eases toward the active zone's dream level
    const targetDream = this.activePath?.dream ?? 0;
    const d = this.ctx.dreamFactor;
    d.value += (targetDream - d.value) * Math.min(dt * 1.5, 1);

    for (const w of this.trails) pulseWisp(w, t);
    for (const q of this.qmarks) q.update(this.ctx.camera);

    // envisioned panels bob and gently blink (faded futures)
    this.panels.forEach((panel, i) => {
      panel.position.y += Math.sin(t * 0.9 + i * 1.7) * dt * 0.25;
      this.panelMats[i].opacity = 0.45 + 0.15 * Math.sin(t * 1.8 + i);
    });

    if (this.beacon) {
      pulseWisp(this.beacon, t, 0.2);
      if (!this.advanced && this.beacon.sprite.position.distanceTo(cat.position) < 4.5) {
        this.advanced = true;
        this.onAdvance?.();
      }
    }
  }

  /** Skip the walking objective: visit every road's end at once. */
  skipInteraction(): void {
    if (this.beacon) {
      if (!this.advanced) {
        this.advanced = true;
        this.onAdvance?.();
      }
      return;
    }
    for (const path of this.paths) if (!path.visited) this.visit(path);
    this.typewriter?.skip();
  }

  async exit(): Promise<void> {
    // never carry a dream state into the next chapter
    this.ctx.dreamFactor.value = 0;
  }

  dispose(): void {
    this.walk?.dispose();
    this.typewriter?.destroy();
    this.title?.destroy();
    this.hintEl?.remove();
    for (const w of this.trails) {
      this.ctx.scene.remove(w.sprite);
      w.dispose();
    }
    this.trails = [];
    for (const p of this.panels) this.ctx.scene.remove(p);
    this.panels = [];
    for (const r of this.roads) {
      this.ctx.scene.remove(r.mesh);
      r.dispose();
    }
    this.roads = [];
    for (const q of this.qmarks) q.dispose();
    this.qmarks = [];
    if (this.beacon) {
      this.ctx.scene.remove(this.beacon.sprite);
      this.beacon.dispose();
    }
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
    this.ctx.rig.follow(null);
  }
}

export function createBlock(): Block06ThreePaths {
  return new Block06ThreePaths();
}
