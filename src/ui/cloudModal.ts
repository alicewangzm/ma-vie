/**
 * Cloud modal: a fluffy panel that billows in and covers ~80% of the screen
 * — the "look closer" surface for every chapter (diplomas, projects,
 * PawHearth shots, teaching, visions, hobbies). Content-driven so chapters
 * animate the same way; images are slots that show a soft placeholder until
 * the real file lands in /assets.
 */

export interface CloudStory {
  title: string;
  body: readonly string[];
  images?: readonly { src: string; alt: string; caption?: string }[];
  links?: readonly { label: string; href: string }[];
}

let styled = false;

function ensureStyles(): void {
  if (styled) return;
  styled = true;
  const style = document.createElement('style');
  style.textContent = /* css */ `
    .wl-modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(236, 216, 228, 0.35);
      backdrop-filter: blur(3px);
      opacity: 0;
      transition: opacity 0.5s ease;
      pointer-events: auto;
      z-index: 30;
    }
    .wl-modal-backdrop.visible { opacity: 1; }
    .wl-cloud {
      position: absolute;
      left: 50%;
      top: 50%;
      width: min(80vw, 46rem);
      max-height: 80vh;
      transform: translate(-50%, -50%) scale(0.86);
      background: rgba(255, 252, 246, 0.94);
      border-radius: 4rem;
      box-shadow:
        0 0 0 14px rgba(255, 252, 246, 0.35),
        0 0 60px 30px rgba(255, 252, 246, 0.45),
        -3rem -2rem 0 -1.2rem rgba(255, 252, 246, 0.94),
        3rem -2.4rem 0 -1rem rgba(255, 252, 246, 0.94),
        -2rem 2.2rem 0 -1.4rem rgba(255, 252, 246, 0.94),
        2.4rem 2rem 0 -1.1rem rgba(255, 252, 246, 0.94);
      opacity: 0;
      transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.1);
      display: flex;
      flex-direction: column;
      pointer-events: auto;
    }
    .wl-modal-backdrop.visible .wl-cloud {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    .wl-cloud-scroll {
      overflow-y: auto;
      padding: 2.6rem 2.8rem 3.4rem;
      color: #4a3f5c;
    }
    .wl-cloud h3 {
      margin: 0 0 0.8em;
      text-align: center;
      font-size: 1.35rem;
      letter-spacing: 0.05em;
    }
    .wl-cloud p { margin: 0 0 0.7em; line-height: 1.7; }
    .wl-cloud-images {
      display: flex;
      flex-wrap: wrap;
      gap: 0.8rem;
      justify-content: center;
      margin: 1rem 0;
    }
    .wl-cloud-images figure { margin: 0; text-align: center; max-width: 46%; }
    .wl-cloud-images img,
    .wl-cloud-img-slot {
      width: 100%;
      min-width: 9rem;
      border-radius: 1rem;
      display: block;
    }
    .wl-cloud-img-slot {
      aspect-ratio: 4 / 3;
      background: repeating-linear-gradient(45deg, #eee6f0, #eee6f0 10px, #f6eff6 10px, #f6eff6 20px);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(74, 63, 92, 0.6);
      font-size: 0.8rem;
      font-style: italic;
      padding: 0 1rem;
      text-align: center;
    }
    .wl-cloud-images figcaption { font-size: 0.8rem; opacity: 0.75; margin-top: 0.3em; }
    .wl-cloud-links { display: flex; gap: 0.8rem; justify-content: center; flex-wrap: wrap; margin-top: 0.6rem; }
    .wl-cloud-links a {
      color: #4a3f5c;
      background: rgba(255, 244, 214, 0.9);
      border: 1px solid rgba(74, 63, 92, 0.3);
      border-radius: 999px;
      padding: 0.45em 1.4em;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .wl-cloud-close {
      position: absolute;
      left: 50%;
      bottom: -1.1rem;
      transform: translateX(-50%);
      width: 2.6rem;
      height: 2.6rem;
      border-radius: 50%;
      border: 1px solid rgba(74, 63, 92, 0.35);
      background: rgba(255, 250, 240, 0.96);
      color: #4a3f5c;
      font-size: 1.1rem;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(74, 63, 92, 0.25);
    }
    .wl-cloud-close:hover { background: rgba(255, 244, 214, 1); }
    @media (prefers-reduced-motion: reduce) {
      .wl-modal-backdrop, .wl-cloud { transition-duration: 0.01s; }
    }
  `;
  document.head.appendChild(style);
}

export interface CloudModalHandle {
  close(): void;
  /** Resolves once the modal has fully closed and been removed. */
  closed: Promise<void>;
}

export function openCloudModal(parent: HTMLElement, story: CloudStory): CloudModalHandle {
  ensureStyles();
  const backdrop = document.createElement('div');
  backdrop.className = 'wl-modal-backdrop';

  const cloud = document.createElement('div');
  cloud.className = 'wl-cloud';
  cloud.setAttribute('role', 'dialog');
  cloud.setAttribute('aria-modal', 'true');
  cloud.setAttribute('aria-label', story.title);

  const scroll = document.createElement('div');
  scroll.className = 'wl-cloud-scroll';

  const h = document.createElement('h3');
  h.textContent = story.title;
  scroll.appendChild(h);

  for (const line of story.body) {
    const p = document.createElement('p');
    p.textContent = line;
    scroll.appendChild(p);
  }

  if (story.images?.length) {
    const grid = document.createElement('div');
    grid.className = 'wl-cloud-images';
    for (const img of story.images) {
      const fig = document.createElement('figure');
      const el = document.createElement('img');
      el.src = img.src;
      el.alt = img.alt;
      el.loading = 'lazy';
      el.addEventListener('error', () => {
        // image not dropped in /assets yet — show a soft slot instead
        const slot = document.createElement('div');
        slot.className = 'wl-cloud-img-slot';
        slot.textContent = `${img.alt} — drop ${img.src.replace('assets/', '')} into public/assets`;
        el.replaceWith(slot);
      });
      fig.appendChild(el);
      if (img.caption) {
        const cap = document.createElement('figcaption');
        cap.textContent = img.caption;
        fig.appendChild(cap);
      }
      grid.appendChild(fig);
    }
    scroll.appendChild(grid);
  }

  if (story.links?.length) {
    const row = document.createElement('div');
    row.className = 'wl-cloud-links';
    for (const link of story.links) {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.label;
      a.target = '_blank';
      a.rel = 'noreferrer';
      row.appendChild(a);
    }
    scroll.appendChild(row);
  }

  const closeBtn = document.createElement('button');
  closeBtn.className = 'wl-cloud-close';
  closeBtn.textContent = '✕';
  closeBtn.setAttribute('aria-label', 'close');

  cloud.append(scroll, closeBtn);
  backdrop.appendChild(cloud);
  parent.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('visible'));

  let resolveClosed!: () => void;
  const closed = new Promise<void>((res) => (resolveClosed = res));

  const close = (): void => {
    backdrop.classList.remove('visible');
    window.removeEventListener('keydown', onKey);
    setTimeout(() => {
      backdrop.remove();
      resolveClosed();
    }, 520);
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') close();
  };

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  window.addEventListener('keydown', onKey);
  closeBtn.focus();

  return { close, closed };
}
