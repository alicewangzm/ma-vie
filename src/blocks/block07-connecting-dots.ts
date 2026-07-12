import * as THREE from 'three';
import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { createWisp, pulseWisp, type Wisp } from '../render/wisp';
import { radialTexture } from '../render/textures';
import { skyPresets, lerpEnvToPreset } from '../render/skyPresets';
import {
  typewriterLines,
  chapterTitle,
  createButton,
  type TypewriterHandle,
  type OverlayHandle,
} from '../ui/overlay';
import { dotsContent } from '../content/block07';

const POINTS_PER_LINK = 28;
const MS_PER_BEAT = 3200;

/** A dome of far stars + a tilted milky-way band — the galaxy night. */
function makeGalaxy(count: number): {
  points: THREE.Points;
  dispose(): void;
} {
  const positions = new Float32Array(count * 3);
  const band = new THREE.Vector3(1, 0.45, -0.3).normalize(); // milky-way tilt
  const v = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const inBand = i < count * 0.55;
    do {
      v.set(Math.random() * 2 - 1, Math.random(), Math.random() * 2 - 1).normalize();
    } while (inBand && Math.abs(v.dot(band)) > 0.22); // cluster near the band plane
    const r = 640 + Math.random() * 120;
    positions[i * 3] = v.x * r;
    positions[i * 3 + 1] = Math.max(v.y, 0.03) * r;
    positions[i * 3 + 2] = v.z * r;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const tex = radialTexture([
    [0.0, 'rgba(255,255,255,1)'],
    [0.4, 'rgba(220,225,255,0.5)'],
    [1.0, 'rgba(200,210,255,0)'],
  ]);
  const mat = new THREE.PointsMaterial({
    size: 6,
    map: tex,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
    sizeAttenuation: false,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return {
    points,
    dispose() {
      geo.dispose();
      mat.dispose();
      tex.dispose();
    },
  };
}

/**
 * Block 07 — "Connecting the Dots". Dusk falls; one star per chapter hangs
 * in the sky and a gold thread draws between them Sky-style while the
 * gratitude beats speak. Cinematic: the cat rests, the sky does the talking.
 */
class Block07ConnectingDots implements StoryBlock {
  readonly id = 'block07-connecting-dots';

  private ctx!: WorldContext;
  private stars: Wisp[] = [];
  private galaxy: ReturnType<typeof makeGalaxy> | null = null;
  private line: THREE.Line | null = null;
  private lineGeo: THREE.BufferGeometry | null = null;
  private lineMat: THREE.LineBasicMaterial | null = null;
  private totalPoints = 0;
  private drawTime = 0;
  private drawing = false;
  private drawSeconds = 1;
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

    ctx.env.setSunVisible(false); // no sun in the galaxy night
    this.galaxy = makeGalaxy(ctx.quality === 'low' ? 400 : 900);
    ctx.scene.add(this.galaxy.points);

    // one star per chapter walked so far
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

    // gold thread through the stars, revealed by drawRange as beats speak
    const curvePoints: THREE.Vector3[] = [];
    for (let i = 0; i < starPos.length - 1; i++) {
      const a = starPos[i];
      const b = starPos[i + 1];
      const mid = a.clone().lerp(b, 0.5);
      mid.y += 3; // gentle arc between stars
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const pts = curve.getPoints(POINTS_PER_LINK - 1);
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

    this.title = chapterTitle(ctx.overlay, dotsContent.title);

    // opening beats → then the thread draws while the gratitude beats speak
    this.typewriter = typewriterLines(ctx.overlay, dotsContent.opening, 2600);
    void this.typewriter.done.then(() => {
      if (!this.lineGeo) return; // disposed mid-opening
      this.typewriter?.destroy();
      const speed = this.ctx.reducedMotion ? 3 : 1;
      const ms = MS_PER_BEAT / speed;
      this.drawSeconds = (dotsContent.beats.length * ms) / 1000;
      this.drawing = true;
      this.typewriter = typewriterLines(this.ctx.overlay, dotsContent.beats, ms, 3);
      void this.typewriter.done.then(() => this.finish());
    });
  }

  private finish(): void {
    this.lineGeo?.setDrawRange(0, this.totalPoints);
    this.continueBtn = createButton(
      this.ctx.overlay,
      dotsContent.continueLabel,
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
    lerpEnvToPreset(this.ctx.env, skyPresets.galaxyNight, 1 - Math.exp(-dt * 0.6));

    for (const s of this.stars) pulseWisp(s, t, 0.08);

    if (this.drawing && this.lineGeo) {
      this.drawTime += dt;
      const k = Math.min(this.drawTime / this.drawSeconds, 1);
      this.lineGeo.setDrawRange(0, Math.floor(k * this.totalPoints));
      if (k >= 1) this.drawing = false;
    }
  }

  async exit(): Promise<void> {
    this.ctx.env.setSunVisible(true); // dawn returns for the finale
  }

  dispose(): void {
    this.typewriter?.destroy();
    this.title?.destroy();
    this.continueBtn?.remove();
    for (const s of this.stars) {
      this.ctx.scene.remove(s.sprite);
      s.dispose();
    }
    this.stars = [];
    if (this.galaxy) {
      this.ctx.scene.remove(this.galaxy.points);
      this.galaxy.dispose();
    }
    if (this.line) this.ctx.scene.remove(this.line);
    this.lineGeo?.dispose();
    this.lineMat?.dispose();
    this.lineGeo = null;
  }
}

export function createBlock(): Block07ConnectingDots {
  return new Block07ConnectingDots();
}
