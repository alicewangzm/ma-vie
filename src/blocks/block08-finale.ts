import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import helvetiker from 'three/examples/fonts/helvetiker_bold.typeface.json';
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
import { openCloudModal } from '../ui/cloudModal';
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
const PORTRAIT_DOTS = 24; // 24×24 pixel-art grid of alice.jpg
const PORTRAIT_URL = 'assets/alice.jpg';
const CARD_SECONDS = 2;

interface PortraitData {
  /** RGB per grid cell, sampled from alice.jpg. */
  pixels: [number, number, number][];
  /** Which hobby-cluster each cell belongs to. */
  clusterOf: number[];
  /** Mean color of each cluster — used for the flying light dots. */
  clusterCss: string[];
  /** Same colors, darkened until they read against the bright sky. */
  clusterTextCss: string[];
}

/** Darken a cluster mean until it's legible as text on a pale sky. */
function readableCss([r, g, b]: [number, number, number]): string {
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  const k = luma > 130 ? 130 / luma : 1;
  return `rgb(${Math.round(r * k)}, ${Math.round(g * k)}, ${Math.round(b * k)})`;
}

/**
 * Pixelate alice.jpg to the dot grid and cluster the cells around the hobby
 * seed palette (k-means, a few rounds). Each hobby takes the real color of
 * its region — cloth, skin, hair — and clicking it later sends that color
 * back into the portrait exactly where it was sampled from.
 */
async function loadPortrait(seeds: string[]): Promise<PortraitData | null> {
  try {
    const img = new Image();
    img.src = PORTRAIT_URL;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = c.height = PORTRAIT_DOTS;
    const g = c.getContext('2d')!;
    // cover-crop the center square
    const s = Math.min(img.width, img.height);
    g.drawImage(
      img,
      (img.width - s) / 2,
      (img.height - s) / 2,
      s,
      s,
      0,
      0,
      PORTRAIT_DOTS,
      PORTRAIT_DOTS,
    );
    const data = g.getImageData(0, 0, PORTRAIT_DOTS, PORTRAIT_DOTS).data;
    const pixels: [number, number, number][] = [];
    for (let i = 0; i < PORTRAIT_DOTS * PORTRAIT_DOTS; i++) {
      pixels.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]);
    }

    const means = seeds.map((hex) => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as [number, number, number];
    });
    const clusterOf = new Array<number>(pixels.length).fill(0);
    for (let round = 0; round < 5; round++) {
      for (let i = 0; i < pixels.length; i++) {
        let best = 0;
        let bestD = Infinity;
        for (let k = 0; k < means.length; k++) {
          const d =
            (pixels[i][0] - means[k][0]) ** 2 +
            (pixels[i][1] - means[k][1]) ** 2 +
            (pixels[i][2] - means[k][2]) ** 2;
          if (d < bestD) {
            bestD = d;
            best = k;
          }
        }
        clusterOf[i] = best;
      }
      for (let k = 0; k < means.length; k++) {
        let r = 0;
        let gr = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < pixels.length; i++) {
          if (clusterOf[i] === k) {
            r += pixels[i][0];
            gr += pixels[i][1];
            b += pixels[i][2];
            n += 1;
          }
        }
        if (n > 0) means[k] = [r / n, gr / n, b / n];
      }
    }
    const clusterCss = means.map(
      ([r, g2, b]) => `rgb(${Math.round(r)}, ${Math.round(g2)}, ${Math.round(b)})`,
    );
    const clusterTextCss = means.map(readableCss);
    return { pixels, clusterOf, clusterCss, clusterTextCss };
  } catch {
    return null; // no alice.jpg (or decode failed) — fall back to seed colors
  }
}

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
  private letterMats: THREE.MeshBasicMaterial[] = [];
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
  private portraitPhoto: HTMLImageElement | null = null;
  private portrait: PortraitData | null = null;
  private revealQueue: number[] = []; // grid cells waiting to be painted
  private clustersQueued = 0;
  private clickedCount = 0;
  private tipEl: HTMLElement | null = null;
  private disposables: (THREE.BufferGeometry | THREE.Material | THREE.Texture)[] = [];

  /** Finale is the last block — no advance handler needed. */
  setAdvanceHandler(_fn: () => void): void {}

  async preload(): Promise<void> {
    this.portrait = await loadPortrait(finaleContent.hobbies.map((h) => h.color));
  }

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

  /**
   * The vision on the horizon: a real 3D Google wordmark over a San
   * Francisco skyline — Transamerica pyramid, Salesforce curve, the flat
   * downtown blocks. Faded (not yet reality) but steady, no flicker.
   */
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
    // downtown blocks
    for (let i = 0; i < 12; i++) {
      const w = 3 + rand() * 4;
      const h = 4 + rand() * 11;
      const geo = new THREE.BoxGeometry(w, h, 3);
      this.disposables.push(geo);
      const b = new THREE.Mesh(geo, this.skylineMat);
      b.position.set(-34 + i * 6 + (rand() - 0.5) * 2, 6 + h / 2, -80);
      merged.add(b);
    }
    // Transamerica pyramid
    const pyramid = new THREE.ConeGeometry(2.6, 22, 4);
    this.disposables.push(pyramid);
    const py = new THREE.Mesh(pyramid, this.skylineMat);
    py.position.set(-9, 17, -78);
    py.rotation.y = Math.PI / 4;
    merged.add(py);
    // Salesforce tower — tall, rounded, gently tapered
    const tower = new THREE.CylinderGeometry(1.7, 2.4, 26, 12);
    this.disposables.push(tower);
    const tw = new THREE.Mesh(tower, this.skylineMat);
    tw.position.set(6, 19, -80);
    merged.add(tw);

    // the 3D GOOGLE wordmark floating above the city
    const font = new FontLoader().parse(
      helvetiker as unknown as Parameters<FontLoader['parse']>[0],
    );
    let cursor = 0;
    const letters: { geo: TextGeometry; mat: THREE.MeshBasicMaterial; width: number }[] = [];
    'Google'.split('').forEach((ch, i) => {
      const geo = new TextGeometry(ch, {
        font,
        size: 4.6,
        depth: 1.4,
        curveSegments: 6,
        bevelEnabled: false,
      });
      geo.computeBoundingBox();
      const width = geo.boundingBox!.max.x - geo.boundingBox!.min.x;
      const mat = new THREE.MeshBasicMaterial({
        color: GOOGLE_COLORS[i],
        transparent: true,
        opacity: 0,
        fog: false,
      });
      this.disposables.push(geo, mat);
      letters.push({ geo, mat, width });
      cursor += width + 0.7;
    });
    let x = -cursor / 2;
    for (const l of letters) {
      const mesh = new THREE.Mesh(l.geo, l.mat);
      mesh.position.set(x, 25, -78); // hovering just above the towers, clear of the star tracker
      merged.add(mesh);
      this.letterMats.push(l.mat);
      x += l.width + 0.7;
    }

    this.skyline = merged;
    this.ctx.scene.add(merged);
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
    c.hobbies.forEach((h, i) => {
      const btn = document.createElement('button');
      btn.className = 'wl-hobby';
      btn.textContent = h.word;
      // each word wears the real color of its region of alice.jpg,
      // darkened just enough to stay readable against the bright sky
      const color = this.portrait?.clusterTextCss[i] ?? h.color;
      btn.style.color = color;
      btn.addEventListener('click', () => {
        openCloudModal(this.ctx.overlay, h.modal);
        if (btn.dataset.clicked) return;
        btn.dataset.clicked = '1';
        btn.style.textShadow = `0 0 14px ${color}`;
        this.clickedCount += 1;
      });
      row.appendChild(btn);
      row.append(' ');
      this.hobbyButtons.push(btn);
    });
    root.appendChild(row);
    this.ctx.overlay.appendChild(root);
    this.everythingEl = root;

    const tip = document.createElement('p');
    tip.className = 'wl-hint';
    tip.textContent = c.everythingTip;
    this.ctx.overlay.appendChild(tip);
    this.tipEl = tip;
  }

  /**
   * Part D — the words become light. Each hobby word collapses into a
   * glowing dot that drifts to the bottom-right corner; as the dots land,
   * the portrait fills in.
   */
  /** Cells whose color came from hobby-cluster k, shuffled for a soft fill. */
  private clusterCells(k: number): number[] {
    const total = PORTRAIT_DOTS * PORTRAIT_DOTS;
    const cells: number[] = [];
    for (let i = 0; i < total; i++) {
      if (this.portrait ? this.portrait.clusterOf[i] === k : i % finaleContent.hobbies.length === k)
        cells.push(i);
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    return cells;
  }

  private buildPortrait(): void {
    this.tipEl?.remove();
    this.tipEl = null;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = PORTRAIT_DOTS * 8;
    canvas.style.cssText =
      'position:absolute;right:3%;bottom:6%;width:min(192px,26vw);border-radius:12px;' +
      'background:rgba(255,250,240,0.35);backdrop-filter:blur(2px);pointer-events:none;';
    this.ctx.overlay.appendChild(canvas);
    this.portraitCanvas = canvas;

    const hobbies = finaleContent.hobbies;
    const corner = canvas.getBoundingClientRect();
    const cx = corner.left + corner.width / 2;
    const cy = corner.top + corner.height / 2;

    if (this.ctx.reducedMotion) {
      this.everythingEl?.remove();
      this.everythingEl = null;
      for (let k = 0; k < hobbies.length; k++) this.revealQueue.push(...this.clusterCells(k));
      this.clustersQueued = hobbies.length;
    } else {
      this.hobbyButtons.forEach((btn, i) => {
        const color = this.portrait?.clusterCss[i] ?? hobbies[i].color;
        const r = btn.getBoundingClientRect();
        const dot = document.createElement('div');
        dot.className = 'wl-dot';
        dot.style.left = `${r.left + r.width / 2 - 7}px`;
        dot.style.top = `${r.top + r.height / 2 - 7}px`;
        dot.style.background = color;
        dot.style.boxShadow = `0 0 18px 6px ${color}`;
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
          // the hobby's color lands exactly where it was sampled from
          this.revealQueue.push(...this.clusterCells(i));
          this.clustersQueued += 1;
        });
      });
      // the word row fades once its words have flown
      setTimeout(
        () => {
          this.everythingEl?.remove();
          this.everythingEl = null;
        },
        250 + hobbies.length * 420 + 700,
      );
    }

    this.typewriter = typewriterLines(this.ctx.overlay, finaleContent.rgb, 2600, 3);
    void this.typewriter.done.then(() => this.setPhase('reward'));
  }

  /** Once every pixel has landed, the pixel art resolves into the photo. */
  private revealPhoto(): void {
    if (this.portraitPhoto || !this.portraitCanvas || !this.portrait) return;
    const img = document.createElement('img');
    img.src = PORTRAIT_URL;
    img.alt = 'Alice';
    img.style.cssText =
      this.portraitCanvas.style.cssText +
      'object-fit:cover;aspect-ratio:1/1;opacity:0;transition:opacity 2.4s ease;';
    this.ctx.overlay.appendChild(img);
    this.portraitPhoto = img;
    requestAnimationFrame(() => (img.style.opacity = '1'));
  }

  private drawPortrait(dt: number): void {
    if (!this.portraitCanvas) return;
    if (this.revealQueue.length === 0) {
      if (this.clustersQueued >= finaleContent.hobbies.length) this.revealPhoto();
      return;
    }
    const g = this.portraitCanvas.getContext('2d')!;
    const cell = this.portraitCanvas.width / PORTRAIT_DOTS;
    // paint incrementally — a handful of pixels per frame, no clearing
    let budget = Math.max(2, Math.round(dt * 220));
    while (budget > 0 && this.revealQueue.length > 0) {
      budget -= 1;
      const i = this.revealQueue.shift()!;
      const x = i % PORTRAIT_DOTS;
      const y = Math.floor(i / PORTRAIT_DOTS);
      if (this.portrait) {
        const [r, gr, b] = this.portrait.pixels[i];
        g.fillStyle = `rgb(${r}, ${gr}, ${b})`;
      } else {
        // no alice.jpg — soft pastel placeholder in the hobby's seed color
        g.fillStyle = finaleContent.hobbies[i % finaleContent.hobbies.length].color;
      }
      g.fillRect(x * cell + 0.5, y * cell + 0.5, cell - 1, cell - 1);
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

    // the vision is faded — not yet reality — but holds steady on the horizon
    if (this.skylineMat) {
      this.skylineMat.opacity += (0.5 - this.skylineMat.opacity) * Math.min(dt * 0.5, 1);
    }
    for (const m of this.letterMats) {
      m.opacity += (0.85 - m.opacity) * Math.min(dt * 0.5, 1);
    }
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
      // give time to open and read the hobby clouds before the words fly
      if ((allClicked && this.phaseTime > 6) || this.phaseTime > 45) this.setPhase('portrait');
    }
    if (this.phase === 'goodbye' && this.titleCard) {
      this.rotateCard(finaleContent.goodbyes, true);
    }
  }

  /**
   * Fast-forward the current part. In the hobby part this lights every
   * word at once — for travelers who don't want to open each cloud.
   */
  skipInteraction(): void {
    switch (this.phase) {
      case 'titles':
        this.phaseTime = CARD_SECONDS * finaleContent.rotatingTitles.length + 1;
        break;
      case 'everything':
        this.hobbyButtons.forEach((btn) => {
          if (!btn.dataset.clicked) {
            btn.dataset.clicked = '1';
            this.clickedCount += 1;
          }
        });
        this.phaseTime = 100; // clears the reading-time gate → dots fly
        break;
      default:
        this.typewriter?.skip();
    }
  }

  async exit(): Promise<void> {}

  dispose(): void {
    this.typewriter?.destroy();
    this.title?.destroy();
    this.titleCard?.remove();
    this.tipEl?.remove();
    this.everythingEl?.remove();
    this.signoffEl?.remove();
    this.linksEl?.remove();
    this.portraitCanvas?.remove();
    this.portraitPhoto?.remove();
    for (const d of this.flyingDots) d.remove();
    this.flyingDots = [];
    if (this.skyline) this.ctx.scene.remove(this.skyline);
    this.letterMats = [];
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
