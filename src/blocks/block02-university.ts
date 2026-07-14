import * as THREE from 'three';
import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { WalkController } from '../core/walk';
import { createWisp, pulseWisp, type Wisp } from '../render/wisp';
import { makePanel } from '../render/panels';
import { skyPresets, lerpEnvToPreset } from '../render/skyPresets';
import {
  typewriterLines,
  chapterTitle,
  TITLE_LEAD_MS,
  type TypewriterHandle,
  type OverlayHandle,
} from '../ui/overlay';
import { createQMark, type QMark } from '../ui/qmark';
import { openCloudModal, type CloudStory } from '../ui/cloudModal';
import { universityContent, type UniversityCue } from '../content/block02';
import { hillY, stageCat } from './block01-who-is-alice';

const WALK_RADIUS = 22;
const MS_PER_BEAT = 2600;

type Panel = ReturnType<typeof makePanel> & { targetY: number };

/**
 * Block 02 — "One Road, Two Sides" (University). Diploma letters drift up
 * like glowing cards, project panels and the co-op logo float past, gold
 * award motes rise — all cued off the story beats.
 */
class Block02University implements StoryBlock {
  readonly id = 'block02-university';

  private ctx!: WorldContext;
  private walk: WalkController | null = null;
  private title: OverlayHandle | null = null;
  private typewriter: TypewriterHandle | null = null;
  private hintEl: HTMLElement | null = null;
  private panels: Panel[] = [];
  private qmarks: QMark[] = [];
  private motes: Wisp[] = [];
  private beacon: Wisp | null = null;
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

    this.title = chapterTitle(ctx.overlay, universityContent.title);
    const beats = universityContent.beats;
    this.typewriter = typewriterLines(
      ctx.overlay,
      beats.map((b) => b.text),
      MS_PER_BEAT,
      3,
      (i) => {
        const cue = beats[i].cue;
        if (cue) this.trigger(cue);
      },
      TITLE_LEAD_MS,
    );
    void this.typewriter.done.then(() => this.showBeacon());
  }

  private addPanel(title: string, subtitle: string, pos: THREE.Vector3, accent?: string): void {
    const panel = makePanel(title, subtitle, accent) as Panel;
    panel.targetY = pos.y;
    panel.mesh.position.copy(pos).setY(pos.y - 4); // rises into place
    panel.mesh.scale.setScalar(1.7); // readable against the bright sky
    panel.mesh.lookAt(this.ctx.camera.position);
    this.ctx.scene.add(panel.mesh);
    this.panels.push(panel);
  }

  /** A "look closer" ? that opens the chapter's cloud modal for that spot. */
  private addQMark(pos: THREE.Vector3, story: CloudStory): void {
    this.qmarks.push(
      createQMark(this.ctx.overlay, pos, story.title, () =>
        openCloudModal(this.ctx.overlay, story),
      ),
    );
  }

  private trigger(cue: UniversityCue): void {
    const modals = universityContent.modals;
    switch (cue) {
      case 'waterloo':
        // the CS story fans across the left half — Waterloo, Banking APIs,
        // Replicant, Supplier Upload — one bearing each, heights alternating
        this.addPanel(
          'University of Waterloo',
          'Computer Science — with Distinction',
          new THREE.Vector3(-4.5, 4.6, -14),
          '#8a6d3b',
        );
        this.addQMark(new THREE.Vector3(-4.5, 2.3, -14), modals.waterloo);
        break;
      case 'laurier':
        this.addPanel(
          'Wilfrid Laurier University',
          'Business — Finance, minor in Economics',
          new THREE.Vector3(14, 6.5, -14),
          '#5b3b8a',
        );
        this.addQMark(new THREE.Vector3(14, 3.9, -14), modals.laurier);
        break;
      case 'projects':
        // separation must hold in 3D, not just from the spawn viewpoint —
        // the camera is free, so cards closer than ~10 world units line up
        // from somewhere. Laurier↔Finance (the pair Alice likes) are 10.4
        // apart; the left fan keeps every pair at least that far, heights
        // alternating low/high as a second guard.
        this.addPanel('Banking APIs', 'Java + Spring Boot', new THREE.Vector3(-13, 7, -19));
        this.addQMark(new THREE.Vector3(-13, 3.6, -19), modals.banking);
        this.addPanel('Supplier Upload', 'React + Google Maps', new THREE.Vector3(-15, 7.4, 0));
        this.addQMark(new THREE.Vector3(-15, 3.8, 0), modals.supplier);
        this.addPanel('Finance Research', 'Data analysis · Python', new THREE.Vector3(17, 3.5, -4));
        this.addQMark(new THREE.Vector3(17, 1.8, -4), modals.finance);
        break;
      case 'coop':
        this.addPanel(
          'Replicant',
          'co-op · San Francisco',
          new THREE.Vector3(-17, 4.9, -9),
          '#b3552d',
        );
        this.addQMark(new THREE.Vector3(-17, 2.5, -9), modals.replicant);
        break;
      case 'awards':
        // gold award motes drifting up around the crest
        for (let i = 0; i < 8; i++) {
          const w = createWisp('#ffd76a', 1.2 + Math.random() * 0.8, 0.8);
          w.sprite.position.set(
            (Math.random() - 0.5) * 18,
            2 + Math.random() * 3,
            -6 + (Math.random() - 0.5) * 14,
          );
          this.ctx.scene.add(w.sprite);
          this.motes.push(w);
        }
        break;
    }
  }

  private showBeacon(): void {
    this.beacon = createWisp('#ffd76a', 5, 1);
    // always forward — at the end of the view the cat faces
    this.beacon.sprite.position.set(0, hillY(0, -25) + 2, -25);
    this.ctx.scene.add(this.beacon.sprite);
    const hint = document.createElement('p');
    hint.className = 'wl-hint';
    hint.textContent = universityContent.continueHint;
    this.ctx.overlay.appendChild(hint);
    this.hintEl = hint;
  }

  update(dt: number, t: number): void {
    const cat = this.ctx.cat.object3D;
    this.walk?.update(dt);
    this.ctx.cat.setMoving(this.walk?.moving ?? false);
    cat.position.y = hillY(cat.position.x, cat.position.z) + 0.1;
    this.ctx.cat.update(dt);
    lerpEnvToPreset(this.ctx.env, skyPresets.dawn, 1 - Math.exp(-dt * 0.7));

    for (const p of this.panels) {
      // rise + fade in, then bob gently
      p.material.opacity = Math.min(p.material.opacity + dt * 0.7, 0.92);
      const rise = p.targetY - p.mesh.position.y;
      p.mesh.position.y += rise * Math.min(dt * 1.8, 1);
      if (Math.abs(rise) < 0.05)
        p.mesh.position.y = p.targetY + Math.sin(t * 0.8 + p.targetY) * 0.15;
    }
    for (const m of this.motes) {
      m.sprite.position.y += dt * 0.9;
      pulseWisp(m, t);
      m.baseOpacity = Math.max(m.baseOpacity - dt * 0.045, 0);
    }

    for (const q of this.qmarks) q.update(this.ctx.camera, cat.position);

    if (this.beacon) {
      pulseWisp(this.beacon, t, 0.2);
      if (!this.advanced && this.beacon.sprite.position.distanceTo(cat.position) < 4.2) {
        this.advanced = true;
        this.onAdvance?.();
      }
    }
  }

  /** Skip the walking objective; the beats (and their panels) still land. */
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
    this.walk?.dispose();
    this.typewriter?.destroy();
    this.title?.destroy();
    this.hintEl?.remove();
    for (const p of this.panels) {
      this.ctx.scene.remove(p.mesh);
      p.dispose();
    }
    this.panels = [];
    for (const q of this.qmarks) q.dispose();
    this.qmarks = [];
    for (const m of this.motes) {
      this.ctx.scene.remove(m.sprite);
      m.dispose();
    }
    this.motes = [];
    if (this.beacon) {
      this.ctx.scene.remove(this.beacon.sprite);
      this.beacon.dispose();
    }
    this.ctx.rig.follow(null);
  }
}

export function createBlock(): Block02University {
  return new Block02University();
}
