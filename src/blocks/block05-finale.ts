import * as THREE from 'three';
import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { createWisp, pulseWisp, type Wisp } from '../render/wisp';
import { skyPresets, lerpEnvToPreset } from '../render/skyPresets';
import { typewriterLines, type TypewriterHandle } from '../ui/overlay';
import { block05Content } from '../content/block05';

type Phase = 'vision' | 'titles' | 'everything' | 'reward' | 'goodbye';

const GOOGLE_COLORS = ['#4285f4', '#ea4335', '#fbbc05', '#4285f4', '#34a853', '#ea4335'];
const PORTRAIT_DOTS = 14; // 14×14 grid

/**
 * Block 05 — "Finale". The Google lights and SF skyline reappear, faded and
 * blinking — not yet reality. Then Alice herself: rotating titles, a little
 * bit of everything, a gold droplet of thanks, the color-dot portrait
 * completing, and goodbye in three languages.
 * TODO(stage-3): RGB portrait idea — zoomed pixels of Alice's photo, one
 * channel per hobby — replaces the procedural placeholder portrait.
 */
class Block05Finale implements StoryBlock {
  readonly id = 'block05-finale';

  private ctx!: WorldContext;
  private phase: Phase = 'vision';
  private phaseTime = 0;
  private skyline: THREE.Group | null = null;
  private skylineMat: THREE.MeshBasicMaterial | null = null;
  private lights: Wisp[] = [];
  private droplet: Wisp | null = null;
  private typewriter: TypewriterHandle | null = null;
  private titleCard: HTMLElement | null = null;
  private titleIndex = 0;
  private everythingEl: HTMLElement | null = null;
  private noteEl: HTMLElement | null = null;
  private linksEl: HTMLElement | null = null;
  private portraitCanvas: HTMLCanvasElement | null = null;
  private portraitShown = 0; // dots revealed so far
  private hobbyClicked = false;
  private disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  /** Finale is the last block — no advance handler needed. */
  setAdvanceHandler(_fn: () => void): void {}

  async preload(): Promise<void> {}

  enter(ctx: WorldContext): void {
    this.ctx = ctx;
    const cat = ctx.cat.object3D;
    cat.visible = true;
    cat.position.set(0, 1.2, -6);
    ctx.rig.follow(null);
    ctx.rig.lookAt(new THREE.Vector3(0, 14, -60));

    this.buildSkyline();
    this.typewriter = typewriterLines(ctx.overlay, [block05Content.visionCaption]);
  }

  /** Far SF skyline silhouette + Google lights, faded + gently blinking. */
  private buildSkyline(): void {
    const geos: THREE.BoxGeometry[] = [];
    const merged = new THREE.Group();
    // one draw call would be nicer, but a handful of boxes in one material
    // is already trivial; keep it readable
    this.skylineMat = new THREE.MeshBasicMaterial({
      color: 0x5a6a8c,
      transparent: true,
      opacity: 0,
      fog: false,
    });
    this.disposables.push(this.skylineMat);
    let seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 14; i++) {
      const w = 3 + rand() * 4;
      const h = 5 + rand() * 14 + (i === 7 ? 10 : 0); // one tall spire
      const geo = new THREE.BoxGeometry(w, h, 3);
      geos.push(geo);
      const b = new THREE.Mesh(geo, this.skylineMat);
      b.position.set(-32 + i * 5 + (rand() - 0.5) * 2, 6 + h / 2, -80);
      merged.add(b);
    }
    this.disposables.push(...geos);
    this.skyline = merged;
    this.ctx.scene.add(merged);

    GOOGLE_COLORS.forEach((color, i) => {
      const w = createWisp(color, 3, 0.55);
      w.sprite.position.set(-15 + i * 6, 30 + Math.sin(i * 2) * 2, -78);
      this.ctx.scene.add(w.sprite);
      this.lights.push(w);
    });
  }

  private setPhase(next: Phase): void {
    this.phase = next;
    this.phaseTime = 0;
    if (next === 'titles') {
      this.typewriter?.destroy();
      this.typewriter = null;
      this.titleCard = document.createElement('div');
      this.titleCard.className = 'wl-title-card';
      this.ctx.overlay.appendChild(this.titleCard);
      this.titleIndex = -1;
    }
    if (next === 'everything') this.buildEverything();
    if (next === 'reward') this.buildReward();
    if (next === 'goodbye') this.buildGoodbye();
  }

  private buildEverything(): void {
    const c = block05Content;
    const root = document.createElement('div');
    root.className = 'wl-everything';
    const lead = document.createElement('p');
    lead.textContent = c.everythingLead;
    root.appendChild(lead);
    const row = document.createElement('p');
    for (const h of c.hobbies) {
      const btn = document.createElement('button');
      btn.className = 'wl-hobby';
      btn.textContent = h.word;
      btn.style.color = h.color;
      btn.addEventListener('click', () => {
        this.hobbyClicked = true;
        if (!this.noteEl) {
          this.noteEl = document.createElement('p');
          this.noteEl.className = 'wl-hobby-note';
          this.ctx.overlay.appendChild(this.noteEl);
        }
        this.noteEl.textContent = h.note;
        this.noteEl.style.color = h.color;
      });
      row.appendChild(btn);
      row.append(' ');
    }
    root.appendChild(row);
    this.ctx.overlay.appendChild(root);
    this.everythingEl = root;
  }

  private buildReward(): void {
    this.everythingEl?.remove();
    this.everythingEl = null;
    this.noteEl?.remove();
    this.noteEl = null;

    this.droplet = createWisp('#ffd76a', 4, 1);
    this.droplet.sprite.position.set(0, 34, -30);
    this.ctx.scene.add(this.droplet.sprite);

    this.typewriter = typewriterLines(this.ctx.overlay, [...block05Content.rewardLines]);

    // color-dot portrait, bottom-right; dots fill to journey completion
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 180;
    canvas.style.cssText =
      'position:absolute;right:3%;bottom:6%;width:min(180px,26vw);border-radius:12px;' +
      'background:rgba(255,250,240,0.35);backdrop-filter:blur(2px);pointer-events:none;';
    this.ctx.overlay.appendChild(canvas);
    this.portraitCanvas = canvas;
  }

  private drawPortrait(): void {
    if (!this.portraitCanvas) return;
    const total = PORTRAIT_DOTS * PORTRAIT_DOTS;
    const target = Math.floor(this.ctx.progress.get().completion * total);
    if (this.portraitShown >= target) return;
    this.portraitShown = Math.min(this.portraitShown + 3, target);

    const g = this.portraitCanvas.getContext('2d')!;
    const cell = this.portraitCanvas.width / PORTRAIT_DOTS;
    g.clearRect(0, 0, this.portraitCanvas.width, this.portraitCanvas.height);
    for (let i = 0; i < this.portraitShown; i++) {
      const x = i % PORTRAIT_DOTS;
      const y = Math.floor(i / PORTRAIT_DOTS);
      // placeholder portrait: soft radial pastel pattern (Alice's photo in stage 3)
      const cx = x - PORTRAIT_DOTS / 2 + 0.5;
      const cy = y - PORTRAIT_DOTS / 2 + 0.5;
      const r = Math.sqrt(cx * cx + cy * cy) / (PORTRAIT_DOTS / 2);
      const hue = 340 - r * 120 + Math.sin(x * 1.7 + y * 2.3) * 14;
      g.fillStyle = `hsl(${hue}, 65%, ${72 - r * 18}%)`;
      g.beginPath();
      g.arc((x + 0.5) * cell, (y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2);
      g.fill();
    }
  }

  private buildGoodbye(): void {
    this.typewriter?.destroy();
    this.typewriter = null;
    this.titleCard = this.titleCard ?? document.createElement('div');
    this.titleCard.className = 'wl-title-card';
    if (!this.titleCard.parentElement) this.ctx.overlay.appendChild(this.titleCard);
    this.titleIndex = -1;

    const c = block05Content;
    const links = document.createElement('div');
    links.className = 'wl-links';
    const resume = document.createElement('a');
    resume.href = c.resumeUrl;
    resume.target = '_blank';
    resume.rel = 'noreferrer';
    resume.textContent = 'resume';
    const mail = document.createElement('a');
    mail.href = `mailto:${c.email}`;
    mail.textContent = 'say hello';
    links.append(resume, mail);
    this.ctx.overlay.appendChild(links);
    requestAnimationFrame(() => links.classList.add('visible'));
    this.linksEl = links;
  }

  /** Rotate entries of `list` through the title card, 2s each. */
  private rotateCard(list: readonly string[], loop: boolean): boolean {
    const i = Math.floor(this.phaseTime / 2);
    const idx = loop ? i % list.length : i;
    if (idx !== this.titleIndex && this.titleCard) {
      this.titleIndex = idx;
      if (!loop && idx >= list.length) return true; // sequence finished
      this.titleCard.classList.remove('visible');
      const text = list[idx % list.length];
      setTimeout(() => {
        if (this.titleCard) {
          this.titleCard.textContent = text;
          this.titleCard.classList.add('visible');
        }
      }, 220);
    }
    return !loop && Math.floor(this.phaseTime / 2) >= list.length;
  }

  update(dt: number, t: number): void {
    this.ctx.cat.update(dt);
    this.phaseTime += dt;
    lerpEnvToPreset(this.ctx.env, skyPresets.goldenHour, 1 - Math.exp(-dt * 0.5));

    // the vision is faded and blinking — not yet reality
    const blink = 0.55 + 0.25 * Math.sin(t * 1.3);
    if (this.skylineMat) {
      const target = 0.5 * blink;
      this.skylineMat.opacity += (target - this.skylineMat.opacity) * Math.min(dt, 1);
    }
    this.lights.forEach((w, i) => {
      pulseWisp(w, t + i, 0.25);
      w.sprite.material.opacity *= blink;
    });
    if (this.droplet) {
      pulseWisp(this.droplet, t, 0.15);
      // the droplet drifts down toward the cat like a slow gift
      this.droplet.sprite.position.y = Math.max(this.droplet.sprite.position.y - dt * 1.6, 6);
    }
    this.drawPortrait();

    const speed = this.ctx.reducedMotion ? 3 : 1;
    switch (this.phase) {
      case 'vision':
        if (this.phaseTime * speed > 8) this.setPhase('titles');
        break;
      case 'titles':
        if (this.rotateCard(block05Content.rotatingTitles, false)) {
          this.titleCard?.remove();
          this.titleCard = null;
          this.setPhase('everything');
        }
        break;
      case 'everything':
        if ((this.hobbyClicked && this.phaseTime > 7) || this.phaseTime * speed > 26) {
          this.setPhase('reward');
        }
        break;
      case 'reward':
        if (this.phaseTime * speed > 9) this.setPhase('goodbye');
        break;
      case 'goodbye':
        this.rotateCard(block05Content.goodbyes, true);
        break;
    }
  }

  async exit(): Promise<void> {}

  dispose(): void {
    this.typewriter?.destroy();
    this.titleCard?.remove();
    this.everythingEl?.remove();
    this.noteEl?.remove();
    this.linksEl?.remove();
    this.portraitCanvas?.remove();
    if (this.skyline) this.ctx.scene.remove(this.skyline);
    for (const w of this.lights) {
      this.ctx.scene.remove(w.sprite);
      w.dispose();
    }
    this.lights = [];
    if (this.droplet) {
      this.ctx.scene.remove(this.droplet.sprite);
      this.droplet.dispose();
    }
    this.disposables.forEach((d) => d.dispose());
    this.disposables.length = 0;
  }
}

export function createBlock(): Block05Finale {
  return new Block05Finale();
}
