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
      transition: opacity 1.1s ease;
    }
    .story-line.visible {
      opacity: 1;
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
    .wl-corner {
      position: absolute;
      top: 14px;
      font-size: 0.85rem;
      padding: 0.4em 1.1em;
      opacity: 1;
    }
    .wl-mute { right: 14px; }
    .wl-skip { right: 110px; }
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
    @media (prefers-reduced-motion: reduce) {
      .story-line, .wl-button { transition-duration: 0.01s; }
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

/** Reveal lines one at a time with a soft fade — typewriter-with-fade. */
export function typewriterLines(
  parent: HTMLElement,
  lines: readonly string[],
  msPerLine = 1400,
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
      els.forEach((el) => el.classList.add('visible'));
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
