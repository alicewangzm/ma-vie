import * as THREE from 'three';
import type { StoryBlock } from '../core/StoryBlock';
import type { WorldContext } from '../core/WorldContext';
import { createWisp, pulseWisp, type Wisp } from '../render/wisp';
import { skyPresets, lerpEnvToPreset } from '../render/skyPresets';
import {
  typewriterLines,
  chapterTitle,
  type TypewriterHandle,
  type OverlayHandle,
} from '../ui/overlay';
import { finaleContent } from '../content/block08';

type Phase =
  | 'vision' // A — Google + SF, faded & blinking (third person)
  | 'reveal' // B — "So — who is Alice?" (voice flips to first person)
  | 'titles' // B — rotating title card
  | 'outro' // B — "and a little bit of everything."
  | 'everything' // C — clickable colored words
  | 'portrait' // D — hobbies become light dots, become her (placeholder)
  | 'reward' // E — gold droplet + wishes
  | 'goodbye'; // F — thanks, goodbyes, signoff, links

const GOOGLE_COLORS = ['#4285f4', '#ea4335', '#fbbc05', '#4285f4', '#34a853', '#ea4335'];
const PORTRAIT_DOTS = 14; // 14×14 grid
const CARD_SECONDS = 2;

/**
 * Block 08 — "To Be Continued" (Finale). The lights reappear, faded and
 * blinking — then Alice steps forward and speaks as I. The hobby words
 * turn into dots of colored light that drift to the corner and become
 * her portrait (placeholder art until the real photo lands in Stage 3).
 * TODO(stage-3): RGB channel portrait from Alice's real photo.
 */
class Block08Finale implements StoryBlock {
  readonly id = 'block08-finale';

  private ctx!: WorldContext;
  private phase: Phase = 'vision';
  private phaseTime = 0;
  private skyline: THREE.Group | null = null;
  private skylineMat: THREE.MeshBasicMaterial | null = null;
  private lights: Wisp[] = [];
  private droplet: Wisp | null = null;
  private title: OverlayHandle | null = null;
  private typewriter: TypewriterHandle | null = null;
  private titleCard: HTMLElement | null = null;
  private titleIndex = -1;
  private everythingEl: HTMLElement | null = null;
  private hobbyButtons: HTMLButtonElement[] = [];
  private flyingDots: HTMLElement[] = [];
  private linksEl: HTMLElement | null = null;
  private signoffEl: HTMLElement | null = null;
  private portraitCanvas: HTMLCanvasElement | null = null;
  private portraitTarget = 0; // 0..1, fraction of dots that have arrived
  private portraitShown = 0; // dots currently drawn
  private clickedCount = 0;
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
    this.title = chapterTitle(ctx.overlay, finaleContent.title);
    this.typewriter = typewriterLines(ctx.overlay, finaleContent.partA, 2400, 3);
    void this.typewriter.done.then(() => this.setPhase('reveal'));
  }

  /** Far SF skyline silhouette + Google lights, faded + gently blinking. */
  private buildSkyline(): void {
    const merged = new THREE.Group();
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
      this.disposables.push(geo);
      const b = new THREE.Mesh(geo, this.skylineMat);
      b.position.set(-32 + i * 5 + (rand() - 0.5) * 2, 6 + h / 2, -80);
      merged.add(b);
    }
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
    this.typewriter?.destroy();
    this.typewriter = null;

    switch (next) {
      case 'reveal':
        this.typewriter = typewriterLines(this.ctx.overlay, finaleContent.reveal, 2400, 4);
        void this.typewriter.done.then(() => this.setPhase('titles'));
        break;
      case 'titles':
        this.titleCard = document.createElement('div');
        this.titleCard.className = 'wl-title-card';
        this.ctx.overlay.appendChild(this.titleCard);
        this.titleIndex = -1;
        break;
      case 'outro':
        this.titleCard?.remove();
        this.titleCard = null;
        this.typewriter = typewriterLines(this.ctx.overlay, [finaleContent.revealOutro], 2000);
        void this.typewriter.done.then(() => this.setPhase('everything'));
        break;
      case 'everything':
        this.buildEverything();
        break;
      case 'portrait':
        this.buildPortrait();
        break;
      case 'reward':
        this.buildReward();
        break;
      case 'goodbye':
        this.buildGoodbye();
        break;
    }
  }

  private buildEverything(): void {
    const c = finaleContent;
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
        if (btn.dataset.clicked) return;
        btn.dataset.clicked = '1';
        btn.style.textShadow = `0 0 14px ${h.color}`;
        this.clickedCount += 1;
      });
      row.appendChild(btn);
      row.append(' ');
      this.hobbyButtons.push(btn);
    }
    root.appendChild(row);
    this.ctx.overlay.appendChild(root);
    this.everythingEl = root;
  }

  /**
   * Part D — the words become light. Each hobby word collapses into a
   * glowing dot that drifts to the bottom-right corner; as the dots land,
   * the portrait fills in.
   */
  private buildPortrait(): void {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 180;
    canvas.style.cssText =
      'position:absolute;right:3%;bottom:6%;width:min(180px,26vw);border-radius:12px;' +
      'background:rgba(255,250,240,0.35);backdrop-filter:blur(2px);pointer-events:none;';
    this.ctx.overlay.appendChild(canvas);
    this.portraitCanvas = canvas;

    const hobbies = finaleContent.hobbies;
    const total = hobbies.length;
    const corner = canvas.getBoundingClientRect();
    const cx = corner.left + corner.width / 2;
    const cy = corner.top + corner.height / 2;

    if (this.ctx.reducedMotion) {
      this.everythingEl?.remove();
      this.everythingEl = null;
      this.portraitTarget = 1;
    } else {
      this.hobbyButtons.forEach((btn, i) => {
        const r = btn.getBoundingClientRect();
        const dot = document.createElement('div');
        dot.className = 'wl-dot';
        dot.style.left = `${r.left + r.width / 2 - 7}px`;
        dot.style.top = `${r.top + r.height / 2 - 7}px`;
        dot.style.background = hobbies[i].color;
        dot.style.boxShadow = `0 0 18px 6px ${hobbies[i].color}`;
        this.ctx.overlay.appendChild(dot);
        this.flyingDots.push(dot);
        btn.style.transition = 'opacity 0.6s ease';
        btn.style.opacity = '0';

        // stagger the flights so the words leave one by one
        setTimeout(
          () => {
            const dx = cx - (r.left + r.width / 2);
            const dy = cy - (r.top + r.height / 2);
            dot.style.transform = `translate(${dx}px, ${dy}px) scale(0.6)`;
            dot.style.opacity = '0';
          },
          250 + i * 420,
        );
        dot.addEventListener('transitionend', (e) => {
          if (e.propertyName !== 'transform') return;
          dot.remove();
          this.portraitTarget = Math.min(this.portraitTarget + 1 / total, 1);
        });
      });
      // the word row fades once its words have flown
      setTimeout(
        () => {
          this.everythingEl?.remove();
          this.everythingEl = null;
        },
        250 + total * 420 + 700,
      );
    }

    this.typewriter = typewriterLines(this.ctx.overlay, finaleContent.rgb, 2600, 3);
    void this.typewriter.done.then(() => this.setPhase('reward'));
  }

  private drawPortrait(dt: number): void {
    if (!this.portraitCanvas) return;
    const total = PORTRAIT_DOTS * PORTRAIT_DOTS;
    const target = Math.floor(this.portraitTarget * total);
    if (this.portraitShown >= target) return;
    this.portraitShown = Math.min(this.portraitShown + Math.max(1, Math.round(dt * 90)), target);

    const g = this.portraitCanvas.getContext('2d')!;
    const cell = this.portraitCanvas.width / PORTRAIT_DOTS;
    g.clearRect(0, 0, this.portraitCanvas.width, this.portraitCanvas.height);
    for (let i = 0; i < this.portraitShown; i++) {
      const x = i % PORTRAIT_DOTS;
      const y = Math.floor(i / PORTRAIT_DOTS);
      // PLACEHOLDER portrait: soft radial pastel pattern (real photo → stage 3)
      const px = x - PORTRAIT_DOTS / 2 + 0.5;
      const py = y - PORTRAIT_DOTS / 2 + 0.5;
      const r = Math.sqrt(px * px + py * py) / (PORTRAIT_DOTS / 2);
      const hue = 340 - r * 120 + Math.sin(x * 1.7 + y * 2.3) * 14;
      g.fillStyle = `hsl(${hue}, 65%, ${72 - r * 18}%)`;
      g.beginPath();
      g.arc((x + 0.5) * cell, (y + 0.5) * cell, cell * 0.36, 0, Math.PI * 2);
      g.fill();
    }
  }

  private buildReward(): void {
    this.droplet = createWisp('#ffd76a', 4, 1);
    this.droplet.sprite.position.set(0, 34, -30);
    this.ctx.scene.add(this.droplet.sprite);
    this.typewriter = typewriterLines(this.ctx.overlay, finaleContent.reward, 2400, 3);
    void this.typewriter.done.then(() => this.setPhase('goodbye'));
  }

  private buildGoodbye(): void {
    this.typewriter = typewriterLines(this.ctx.overlay, finaleContent.thanks, 2400, 3);
    void this.typewriter.done.then(() => {
      this.typewriter?.destroy();
      this.typewriter = null;

      // rotating goodbye card
      this.titleCard = document.createElement('div');
      this.titleCard.className = 'wl-title-card';
      this.ctx.overlay.appendChild(this.titleCard);
      this.titleIndex = -1;
      this.phaseTime = 0;

      // signoff stays on screen under the card
      const signoff = document.createElement('div');
      signoff.className = 'wl-everything';
      signoff.style.top = '58%';
      for (const line of finaleContent.signoff) {
        const p = document.createElement('p');
        p.textContent = line;
        signoff.appendChild(p);
      }
      this.ctx.overlay.appendChild(signoff);
      this.signoffEl = signoff;

      const links = document.createElement('div');
      links.className = 'wl-links';
      const resume = document.createElement('a');
      resume.href = finaleContent.resumeUrl;
      resume.target = '_blank';
      resume.rel = 'noreferrer';
      resume.textContent = finaleContent.resumeLabel;
      const mail = document.createElement('a');
      mail.href = `mailto:${finaleContent.email}`;
      mail.textContent = finaleContent.helloLabel;
      links.append(resume, mail);
      this.ctx.overlay.appendChild(links);
      requestAnimationFrame(() => links.classList.add('visible'));
      this.linksEl = links;
    });
  }

  /** Rotate entries of `list` through the title card, ~2s each. */
  private rotateCard(list: readonly string[], loop: boolean): boolean {
    const i = Math.floor(this.phaseTime / CARD_SECONDS);
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
    return !loop && Math.floor(this.phaseTime / CARD_SECONDS) >= list.length;
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
    this.drawPortrait(dt);

    if (this.phase === 'titles' && this.rotateCard(finaleContent.rotatingTitles, false)) {
      this.setPhase('outro');
    }
    if (this.phase === 'everything') {
      const allClicked = this.clickedCount >= finaleContent.hobbies.length;
      if (allClicked || this.phaseTime > 18) this.setPhase('portrait');
    }
    if (this.phase === 'goodbye' && this.titleCard) {
      this.rotateCard(finaleContent.goodbyes, true);
    }
  }

  async exit(): Promise<void> {}

  dispose(): void {
    this.typewriter?.destroy();
    this.title?.destroy();
    this.titleCard?.remove();
    this.everythingEl?.remove();
    this.signoffEl?.remove();
    this.linksEl?.remove();
    this.portraitCanvas?.remove();
    for (const d of this.flyingDots) d.remove();
    this.flyingDots = [];
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

export function createBlock(): Block08Finale {
  return new Block08Finale();
}
