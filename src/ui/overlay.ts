/**
 * Minimal DOM overlay helpers for story text and controls.
 * All styling is injected once; blocks create/destroy their own elements.
 */

let styled = false;

export function ensureOverlayStyles(): void {
  if (styled) return;
  styled = true;
  const style = document.createElement('style');
  style.textContent = /* css */ `
    .story-lines {
      position: absolute;
      left: 50%;
      top: 58%;
      transform: translateX(-50%);
      width: min(34rem, 84vw);
      text-align: center;
      color: #4a3f5c;
      text-shadow: 0 1px 6px rgba(255, 255, 255, 0.65);
      font-size: clamp(1rem, 2.2vw, 1.25rem);
      line-height: 1.9;
      pointer-events: none;
    }
    .story-line {
      opacity: 0;
      transition: opacity 1.1s ease, max-height 0.9s ease, margin 0.9s ease;
      max-height: 6em;
      overflow: hidden;
    }
    .story-line.visible {
      opacity: 1;
    }
    .story-line.collapsed {
      max-height: 0;
      margin: 0;
    }
    .wl-notice {
      position: absolute;
      left: 50%;
      top: 14px;
      transform: translateX(-50%);
      color: rgba(74, 63, 92, 0.85);
      background: rgba(255, 250, 240, 0.85);
      border: 1px solid rgba(74, 63, 92, 0.25);
      border-radius: 999px;
      font-size: 0.85rem;
      padding: 0.4em 1.2em;
      pointer-events: auto;
      cursor: pointer;
    }
    .wl-dot {
      position: absolute;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      pointer-events: none;
      transition: transform 1.6s cubic-bezier(0.4, 0, 0.3, 1), opacity 0.5s ease 1.4s;
      z-index: 20;
    }
    .wl-button {
      pointer-events: auto;
      cursor: pointer;
      border: 1px solid rgba(74, 63, 92, 0.35);
      border-radius: 999px;
      background: rgba(255, 250, 240, 0.82);
      color: #4a3f5c;
      font: inherit;
      font-size: 1rem;
      padding: 0.6em 2.2em;
      transition: background 0.3s ease, transform 0.3s ease, opacity 0.8s ease;
      opacity: 0;
    }
    .wl-button.visible {
      opacity: 1;
    }
    .wl-button:hover {
      background: rgba(255, 244, 214, 0.95);
      transform: translateY(-1px);
    }
    .wl-accept {
      position: absolute;
      left: 50%;
      bottom: 12%;
      transform: translateX(-50%);
    }
    .wl-corner-bar {
      position: absolute;
      top: max(14px, env(safe-area-inset-top, 0px));
      right: max(14px, env(safe-area-inset-right, 0px));
      display: flex;
      gap: 10px;
      z-index: 16;
    }
    .wl-corner {
      font-size: 0.85rem;
      padding: 0.4em 1.1em;
      opacity: 1;
      white-space: nowrap;
    }
    .wl-hint {
      position: absolute;
      left: 50%;
      bottom: 6%;
      transform: translateX(-50%);
      color: rgba(74, 63, 92, 0.7);
      font-size: 0.9rem;
      pointer-events: none;
      transition: opacity 1s ease;
    }
    .wl-chapter-title {
      position: absolute;
      left: 50%;
      top: 16%;
      transform: translateX(-50%);
      width: min(38rem, 90vw);
      text-align: center;
      color: #4a3f5c;
      text-shadow: 0 1px 8px rgba(255, 255, 255, 0.7);
      font-size: clamp(1.2rem, 3vw, 1.7rem);
      letter-spacing: 0.06em;
      opacity: 0;
      transition: opacity 1.4s ease;
      pointer-events: none;
    }
    .wl-chapter-title.visible { opacity: 1; }
    .wl-sidelog {
      position: absolute;
      left: 3%;
      top: 50%;
      transform: translateY(-50%);
      width: min(17rem, 40vw);
      color: rgba(255, 252, 245, 0.92);
      text-shadow: 0 1px 6px rgba(30, 30, 50, 0.55);
      font-size: 0.95rem;
      font-style: italic;
      line-height: 1.8;
      pointer-events: none;
    }
    .wl-sidelog p { opacity: 0; transition: opacity 1.2s ease; margin: 0 0 0.6em; }
    .wl-sidelog p.visible { opacity: 1; }
    .wl-title-card {
      position: absolute;
      left: 50%;
      top: 40%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #4a3f5c;
      text-shadow: 0 1px 8px rgba(255, 255, 255, 0.7);
      font-size: clamp(1.6rem, 4.5vw, 2.6rem);
      letter-spacing: 0.08em;
      opacity: 0;
      transition: opacity 0.45s ease;
      pointer-events: none;
    }
    .wl-title-card.visible { opacity: 1; }
    .wl-everything {
      position: absolute;
      left: 50%;
      top: 48%;
      transform: translateX(-50%);
      width: min(36rem, 90vw);
      text-align: center;
      color: #4a3f5c;
      text-shadow: 0 1px 6px rgba(255, 255, 255, 0.65);
      font-size: clamp(1rem, 2.2vw, 1.2rem);
      line-height: 2.1;
    }
    .wl-hobby {
      pointer-events: auto;
      cursor: pointer;
      border: none;
      background: none;
      font: inherit;
      font-weight: 600;
      padding: 0 0.15em;
      transition: transform 0.25s ease;
    }
    .wl-hobby:hover { transform: translateY(-2px) scale(1.06); }
    .wl-hobby-note {
      position: absolute;
      left: 50%;
      top: 68%;
      transform: translateX(-50%);
      color: rgba(74, 63, 92, 0.85);
      font-size: 0.95rem;
      font-style: italic;
      pointer-events: none;
      transition: opacity 0.6s ease;
    }
    .wl-links {
      position: absolute;
      left: 50%;
      bottom: 8%;
      transform: translateX(-50%);
      display: flex;
      gap: 1.2rem;
      opacity: 0;
      transition: opacity 1.2s ease;
    }
    .wl-links.visible { opacity: 1; }
    .wl-links a {
      pointer-events: auto;
      color: #4a3f5c;
      background: rgba(255, 250, 240, 0.82);
      border: 1px solid rgba(74, 63, 92, 0.35);
      border-radius: 999px;
      padding: 0.55em 1.8em;
      text-decoration: none;
      font-size: 0.95rem;
      transition: background 0.3s ease, transform 0.3s ease;
    }
    .wl-links a:hover { background: rgba(255, 244, 214, 0.95); transform: translateY(-1px); }
    @media (prefers-reduced-motion: reduce) {
      .story-line, .wl-button, .wl-chapter-title, .wl-sidelog p, .wl-title-card {
        transition-duration: 0.01s;
      }
    }
  `;
  document.head.appendChild(style);
}

export interface TypewriterHandle {
  /** Resolves when every line is visible (or skip() was called). */
  done: Promise<void>;
  skip(): void;
  destroy(): void;
}

/**
 * Reveal lines one at a time with a soft fade — typewriter-with-fade.
 * Older lines fade back out so long passages breathe instead of stacking
 * into a wall of text (Sky-style: short lines, lots of breath).
 */
export function typewriterLines(
  parent: HTMLElement,
  lines: readonly string[],
  msPerLine = 1400,
  maxVisible = 4,
  onLine?: (index: number) => void,
): TypewriterHandle {
  ensureOverlayStyles();
  const root = document.createElement('div');
  root.className = 'story-lines';
  const els = lines.map((text) => {
    const el = document.createElement('p');
    el.className = 'story-line';
    el.textContent = text;
    root.appendChild(el);
    return el;
  });
  parent.appendChild(root);

  let timer: ReturnType<typeof setInterval> | null = null;
  let resolveDone!: () => void;
  const done = new Promise<void>((res) => (resolveDone = res));

  let i = 0;
  const revealNext = () => {
    if (i < els.length) {
      els[i].classList.add('visible');
      onLine?.(i);
      const old = i - maxVisible;
      if (old >= 0) {
        els[old].classList.remove('visible');
        els[old].classList.add('collapsed');
      }
      i += 1;
    }
    if (i >= els.length) {
      if (timer) clearInterval(timer);
      timer = null;
      resolveDone();
    }
  };
  revealNext();
  timer = setInterval(revealNext, msPerLine);

  return {
    done,
    skip() {
      els.forEach((el, idx) => {
        if (idx >= els.length - maxVisible) el.classList.add('visible');
        else el.classList.add('collapsed');
      });
      i = els.length;
      if (timer) clearInterval(timer);
      timer = null;
      resolveDone();
    },
    destroy() {
      if (timer) clearInterval(timer);
      root.remove();
    },
  };
}

export interface OverlayHandle {
  el: HTMLElement;
  destroy(): void;
}

/** Chapter title that fades in at the top of the frame. */
export function chapterTitle(parent: HTMLElement, text: string): OverlayHandle {
  ensureOverlayStyles();
  const el = document.createElement('h2');
  el.className = 'wl-chapter-title';
  el.textContent = text;
  parent.appendChild(el);
  requestAnimationFrame(() => el.classList.add('visible'));
  return { el, destroy: () => el.remove() };
}

export interface SideLogHandle extends OverlayHandle {
  /** Reveal the next line; returns false when exhausted. */
  next(): boolean;
}

/** Left-side italic log (storm self-talk). Lines reveal on demand. */
export function sideLog(parent: HTMLElement, lines: readonly string[]): SideLogHandle {
  ensureOverlayStyles();
  const el = document.createElement('div');
  el.className = 'wl-sidelog';
  const els = lines.map((text) => {
    const p = document.createElement('p');
    p.textContent = text;
    el.appendChild(p);
    return p;
  });
  parent.appendChild(el);
  let i = 0;
  return {
    el,
    next() {
      if (i >= els.length) return false;
      els[i].classList.add('visible');
      i += 1;
      return true;
    },
    destroy: () => el.remove(),
  };
}

export function createButton(
  parent: HTMLElement,
  label: string,
  className: string,
  onClick: () => void,
): HTMLButtonElement {
  ensureOverlayStyles();
  const btn = document.createElement('button');
  btn.className = `wl-button ${className}`;
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  parent.appendChild(btn);
  return btn;
}
