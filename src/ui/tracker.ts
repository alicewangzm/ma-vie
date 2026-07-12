import type { ProgressStore } from '../core/progress';

/**
 * Constellation chapter tracker, top-center: one star per chapter joined by
 * a gold thread (same language as the Connecting-the-Dots chapter). Visited
 * stars are lit, the current one pulses, and clicking a star jumps there.
 */

let styled = false;

function ensureStyles(): void {
  if (styled) return;
  styled = true;
  const style = document.createElement('style');
  style.textContent = /* css */ `
    .wl-tracker {
      position: absolute;
      top: max(12px, env(safe-area-inset-top, 0px));
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      pointer-events: auto;
      z-index: 14;
    }
    .wl-tracker-star {
      position: relative;
      width: 30px;
      height: 30px;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
      color: rgba(74, 63, 92, 0.35);
      font-size: 13px;
      line-height: 30px;
      text-align: center;
      transition: color 0.5s ease, transform 0.3s ease, text-shadow 0.5s ease;
    }
    .wl-tracker-star:hover { transform: scale(1.35); }
    .wl-tracker-star.visited {
      color: #e9b64c;
      text-shadow: 0 0 8px rgba(255, 215, 106, 0.9);
    }
    .wl-tracker-star.current {
      color: #ffd76a;
      text-shadow: 0 0 12px rgba(255, 215, 106, 1);
      animation: wl-star-pulse 2.4s ease-in-out infinite;
    }
    @keyframes wl-star-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.45); }
    }
    .wl-tracker-thread {
      width: clamp(8px, 2.2vw, 26px);
      height: 1px;
      background: linear-gradient(90deg, rgba(233, 182, 76, 0.55), rgba(233, 182, 76, 0.55));
      opacity: 0.25;
      transition: opacity 0.5s ease;
    }
    .wl-tracker-thread.lit { opacity: 0.9; }
    @media (prefers-reduced-motion: reduce) {
      .wl-tracker-star.current { animation: none; }
    }
  `;
  document.head.appendChild(style);
}

export interface Tracker {
  dispose(): void;
}

export function createTracker(
  parent: HTMLElement,
  chapters: readonly { id: string; label: string }[],
  progress: ProgressStore,
  onSelect: (index: number) => void,
): Tracker {
  ensureStyles();
  const root = document.createElement('nav');
  root.className = 'wl-tracker';
  root.setAttribute('aria-label', 'chapters');

  const stars: HTMLButtonElement[] = [];
  const threads: HTMLElement[] = [];
  chapters.forEach((ch, i) => {
    if (i > 0) {
      const thread = document.createElement('div');
      thread.className = 'wl-tracker-thread';
      root.appendChild(thread);
      threads.push(thread);
    }
    const star = document.createElement('button');
    star.className = 'wl-tracker-star';
    star.textContent = '✦';
    star.title = ch.label;
    star.setAttribute('aria-label', `go to ${ch.label}`);
    star.addEventListener('click', () => onSelect(i));
    root.appendChild(star);
    stars.push(star);
  });
  parent.appendChild(root);

  const unsubscribe = progress.subscribe((s) => {
    chapters.forEach((ch, i) => {
      stars[i].classList.toggle('visited', s.visited.includes(ch.id));
      stars[i].classList.toggle('current', s.currentBlock === ch.id);
      if (i > 0) {
        threads[i - 1].classList.toggle(
          'lit',
          s.visited.includes(ch.id) && s.visited.includes(chapters[i - 1].id),
        );
      }
    });
  });

  return {
    dispose() {
      unsubscribe();
      root.remove();
    },
  };
}
