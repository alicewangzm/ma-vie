import * as THREE from 'three';
import { theme } from '../theme';
import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { radialTexture } from '../render/textures';
import { typewriterLines, createButton, type TypewriterHandle } from '../ui/overlay';
import { letterContent } from '../content/block00';

const MS_PER_LINE = 1900; // unhurried — letter copy is the longest passage

const FLOAT_POS = new THREE.Vector3(0, 11, 4);
const FALL_FROM_Y = 60;
const FALL_DURATION = 4;

type Phase = 'falling' | 'waiting-click' | 'reading' | 'accepted';

/**
 * Block 00 — "The Letter".
 * A glowing envelope falls from above the clouds, floats center-frame.
 * Click it → invitation lines fade in one by one → Accept → clouds part.
 */
class Block00Letter implements StoryBlock {
  readonly id = 'block00-letter';

  private ctx!: WorldContext;
  private letter = new THREE.Group();
  private glow!: THREE.Sprite;
  private phase: Phase = 'falling';
  private phaseTime = 0;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private typewriter: TypewriterHandle | null = null;
  private acceptBtn: HTMLButtonElement | null = null;
  private hintEl: HTMLElement | null = null;
  private onAdvance: (() => void) | null = null;
  private disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];
  private onClick = (e: PointerEvent) => this.handleClick(e);

  /** main.ts wires this to director.next(). */
  setAdvanceHandler(fn: () => void): void {
    this.onAdvance = fn;
  }

  async preload(): Promise<void> {
    // Envelope is procedural — nothing heavy to fetch in Stage 1.
  }

  enter(ctx: WorldContext): void {
    this.ctx = ctx;
    this.buildLetter();
    this.letter.position.copy(FLOAT_POS);
    if (ctx.reducedMotion) {
      this.phase = 'waiting-click';
      this.showHint();
    } else {
      this.letter.position.y = FALL_FROM_Y;
      this.phase = 'falling';
    }
    ctx.scene.add(this.letter);
    ctx.rig.lookAt(FLOAT_POS);
    ctx.renderer.domElement.addEventListener('pointerdown', this.onClick);
  }

  private buildLetter(): void {
    const paper = new THREE.MeshStandardMaterial({
      color: new THREE.Color(theme.letter.paper),
      roughness: 0.6,
      emissive: new THREE.Color(theme.letter.emissive),
      emissiveIntensity: 1.1 * theme.letter.glowIntensity,
    });
    const bodyGeo = new THREE.BoxGeometry(3.2, 2.2, 0.12);
    const body = new THREE.Mesh(bodyGeo, paper);

    const flapShape = new THREE.Shape();
    flapShape.moveTo(-1.6, 0);
    flapShape.lineTo(1.6, 0);
    flapShape.lineTo(0, -1.15);
    flapShape.closePath();
    const flapGeo = new THREE.ShapeGeometry(flapShape);
    const flap = new THREE.Mesh(flapGeo, paper);
    flap.position.set(0, 1.1, 0.075);

    const sealGeo = new THREE.CircleGeometry(0.28, 24);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xe8a87c,
      roughness: 0.6,
      emissive: 0xd88a55,
      emissiveIntensity: 0.4 * theme.letter.glowIntensity,
    });
    const seal = new THREE.Mesh(sealGeo, sealMat);
    seal.position.set(0, -0.05, 0.08);

    const glowTex = radialTexture([
      [0.0, 'rgba(255,244,190,1.0)'],
      [0.35, 'rgba(255,230,150,0.45)'],
      [1.0, 'rgba(255,220,140,0.0)'],
    ]);
    const glowMat = new THREE.SpriteMaterial({
      map: glowTex,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.9 * theme.letter.glowIntensity,
    });
    this.glow = new THREE.Sprite(glowMat);
    this.glow.scale.setScalar(13);

    this.disposables.push(bodyGeo, flapGeo, sealGeo, paper, sealMat, glowTex, glowMat);
    this.letter.add(body, flap, seal, this.glow);
  }

  private handleClick(e: PointerEvent): void {
    if (this.phase !== 'waiting-click') return;
    const rect = this.ctx.renderer.domElement.getBoundingClientRect();
    this.pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.ctx.camera);
    if (this.raycaster.intersectObject(this.letter, true).length > 0) {
      this.startReading();
    }
  }

  private showHint(): void {
    const hint = document.createElement('p');
    hint.className = 'wl-hint';
    hint.textContent = letterContent.clickHint;
    this.ctx.overlay.appendChild(hint);
    this.hintEl = hint;
  }

  private startReading(): void {
    this.phase = 'reading';
    this.phaseTime = 0;
    this.hintEl?.remove();
    this.hintEl = null;
    this.ctx.audio.start(); // first user gesture — safe spot to boot audio

    this.typewriter = typewriterLines(this.ctx.overlay, letterContent.lines, MS_PER_LINE);
    void this.typewriter.done.then(() => {
      if (this.phase !== 'reading') return;
      this.acceptBtn = createButton(this.ctx.overlay, letterContent.acceptLabel, 'wl-accept', () =>
        this.accept(),
      );
      requestAnimationFrame(() => this.acceptBtn?.classList.add('visible'));
    });
  }

  /** Skip straight to the end of the intro (accessibility requirement). */
  skipIntro(): void {
    if (this.phase === 'accepted') return;
    this.letter.position.copy(FLOAT_POS);
    if (this.phase === 'falling' || this.phase === 'waiting-click') this.startReading();
    this.typewriter?.skip();
    this.accept();
  }

  private accept(): void {
    if (this.phase === 'accepted') return;
    this.phase = 'accepted';
    this.acceptBtn?.remove();
    this.acceptBtn = null;
    this.onAdvance?.();
  }

  update(dt: number, t: number): void {
    this.phaseTime += dt;

    if (this.phase === 'falling') {
      const k = Math.min(this.phaseTime / FALL_DURATION, 1);
      const ease = 1 - Math.pow(1 - k, 3); // cubic ease-out
      this.letter.position.y = THREE.MathUtils.lerp(FALL_FROM_Y, FLOAT_POS.y, ease);
      this.letter.rotation.z = Math.sin(t * 2.2) * 0.12 * (1 - k); // flutter
      if (k >= 1) {
        this.phase = 'waiting-click';
        this.phaseTime = 0;
        this.showHint();
      }
      return;
    }

    // gentle float (locked look-dev bob values)
    const bob = this.ctx.reducedMotion ? 0.2 : 1;
    this.letter.position.y =
      FLOAT_POS.y + Math.sin(t * theme.letter.bobSpeed) * theme.letter.bobAmplitude * bob;
    this.letter.rotation.z = Math.sin(t * theme.letter.bobSpeed * 0.7) * 0.06 * bob;
    this.letter.rotation.y = Math.sin(t * theme.letter.bobSpeed * 0.4) * 0.15 * bob;
  }

  async exit(): Promise<void> {
    // clouds are already closing over us; nothing to animate out yet
  }

  dispose(): void {
    this.ctx.renderer.domElement.removeEventListener('pointerdown', this.onClick);
    this.typewriter?.destroy();
    this.acceptBtn?.remove();
    this.hintEl?.remove();
    this.ctx.scene.remove(this.letter);
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
  }
}

export function createBlock(): Block00Letter {
  return new Block00Letter();
}
export type { Block00Letter };
